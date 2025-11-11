import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument, rgb } from 'pdf-lib';
import { getCurrentUser } from '@/lib/auth-utils';
import fontkit from '@pdf-lib/fontkit';
import { readFile } from 'fs/promises';
import { resolve } from 'path';
import mammoth from 'mammoth';
import { prisma } from '@/lib/prisma';
import { DEFAULT_APPEND_MODE, generateFromTemplateBody, parseConfig, type NormalizedConfig } from '@/lib/services/templateRenderer';

export const runtime = 'nodejs';
export const maxDuration = 60;

// Пути к локальным шрифтам (поддержка кириллицы)
const FONT_REGULAR_PATH = resolve(process.cwd(), 'public/fonts/DejaVuSans.ttf');
const FONT_BOLD_PATH = resolve(process.cwd(), 'public/fonts/DejaVuSans-Bold.ttf');

// Cache fonts across invocations to reduce latency
let cachedFontBytes: Uint8Array | null = null;
let cachedFontBoldBytes: Uint8Array | null = null;

function bufferToArrayBuffer(buffer: Buffer): ArrayBuffer {
  const slice = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
  return slice instanceof ArrayBuffer ? slice : buffer.slice().buffer;
}

/**
 * POST /api/documents/generate-pdf
 * Генерация PDF файла из текста и реквизитов
 * 
 * ВАЖНО: Использует DejaVu Sans для поддержки кириллицы
 */
export async function POST(request: NextRequest) {
  try {
    // Проверка авторизации
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const {
      bodyText,
      requisites,
      templateName,
      templateCode,
      documentId,
      organization
    } = await request.json();

    let effectiveBodyText: string = bodyText || "";
    let effectiveTemplateCode: string | null = templateCode || null;

    if (!effectiveTemplateCode && documentId) {
      const docRecord = await prisma.document.findUnique({
        where: { id: documentId },
        select: { templateCode: true },
      });
      effectiveTemplateCode = docRecord?.templateCode ?? null;
    }

    let templateRecord: { nameRu: string; version: string } | null = null;
    let templateBody: { filePath?: string | null; fileData?: Uint8Array | null; previewText?: string | null; placeholders?: any } | null = null;
    let config: NormalizedConfig = { appendMode: DEFAULT_APPEND_MODE, placeholderBindings: [], fields: [] };

    if (effectiveTemplateCode) {
      const [template, bodyRecord, configRecord] = await Promise.all([
        prisma.template.findUnique({
          where: { code: effectiveTemplateCode },
          select: { nameRu: true, version: true },
        }),
        prisma.templateBody.findUnique({
          where: { templateCode: effectiveTemplateCode },
          select: { filePath: true, fileData: true, previewText: true, placeholders: true },
        }),
        prisma.templateConfig.findUnique({
          where: { templateCode: effectiveTemplateCode },
          select: { requisitesConfig: true },
        }),
      ]);

      if (template) {
        templateRecord = template;
      }

      if (configRecord?.requisitesConfig) {
        config = parseConfig(configRecord.requisitesConfig);
      }

      if (bodyRecord) {
        templateBody = bodyRecord;
      }
    }

    if ((!effectiveBodyText || effectiveBodyText === 'Текст документа не найден') && templateBody) {
      try {
        const docxBuffer = await generateFromTemplateBody({
          templateBody,
          config,
          template: templateRecord,
          user,
          bodyText: effectiveBodyText,
          requisites,
          organization,
          templateName,
        });
        const { value } = await mammoth.extractRawText({ arrayBuffer: bufferToArrayBuffer(docxBuffer) });
        if (value && value.trim().length > 0) {
          effectiveBodyText = value;
        }
      } catch (error) {
        console.error('PDF template render error:', error);
        if (templateBody.previewText) {
          effectiveBodyText = templateBody.previewText;
        }
      }
    }

    if (!effectiveBodyText) {
      effectiveBodyText = 'Текст документа не найден';
    }

    // Создаём новый PDF документ
    const pdfDoc = await PDFDocument.create();
    
    // Регистрируем fontkit для поддержки TTF шрифтов
    pdfDoc.registerFontkit(fontkit);

    let font, fontBold;
    
    try {
      if (!cachedFontBytes) {
        cachedFontBytes = new Uint8Array(await readFile(FONT_REGULAR_PATH));
      }
      if (!cachedFontBoldBytes) {
        cachedFontBoldBytes = new Uint8Array(await readFile(FONT_BOLD_PATH));
      }

      font = await pdfDoc.embedFont(cachedFontBytes, { subset: true });
      fontBold = await pdfDoc.embedFont(cachedFontBoldBytes, { subset: true });
      
      if (process.env.NODE_ENV !== 'production') {
        console.log('✅ DejaVu Sans fonts loaded from local files');
      }
    } catch (fontError) {
      console.error('❌ Failed to load local fonts for PDF generation:', fontError);
      return NextResponse.json(
        {
          success: false,
          error: 'Не удалось загрузить шрифты для PDF. Обновите страницу и попробуйте снова.',
        },
        { status: 500 }
      );
    }

    // Параметры страницы
    const pageWidth = 595.28;  // A4 width
    const pageHeight = 841.89; // A4 height
    const margin = 50;
    const maxWidth = pageWidth - (margin * 2);

    let page = pdfDoc.addPage([pageWidth, pageHeight]);
    let yPosition = pageHeight - margin;

    // Функция для добавления текста с переносом
    const drawText = (
      text: string,
      options: {
        fontSize?: number;
        bold?: boolean;
        indent?: number;
        spacing?: number;
      } = {}
    ) => {
      const fontSize = options.fontSize || 12;
      const currentFont = options.bold ? fontBold : font;
      const indent = options.indent || 0;
      const spacing = options.spacing || fontSize + 2;

      const words = text.split(' ');
      let line = '';

      for (const word of words) {
        const testLine = line + (line ? ' ' : '') + word;
        const testWidth = currentFont.widthOfTextAtSize(testLine, fontSize);

        if (testWidth > maxWidth - indent && line) {
          // Проверяем, нужна ли новая страница
          if (yPosition - spacing < margin) {
            page = pdfDoc.addPage([pageWidth, pageHeight]);
            yPosition = pageHeight - margin;
          }

          page.drawText(line, {
            x: margin + indent,
            y: yPosition,
            size: fontSize,
            font: currentFont,
            color: rgb(0, 0, 0)
          });

          yPosition -= spacing;
          line = word;
        } else {
          line = testLine;
        }
      }

      // Рисуем оставшуюся строку
      if (line) {
        if (yPosition - spacing < margin) {
          page = pdfDoc.addPage([pageWidth, pageHeight]);
          yPosition = pageHeight - margin;
        }

        page.drawText(line, {
          x: margin + indent,
          y: yPosition,
          size: fontSize,
          font: currentFont,
          color: rgb(0, 0, 0)
        });

        yPosition -= spacing;
      }
    };

    // Заголовок документа
    if (templateName) {
      drawText(templateName, { fontSize: 16, bold: true, spacing: 20 });
      yPosition -= 10;
    }

    // Тело документа
    const bodyLines = effectiveBodyText.split('\n').filter((line: string) => line.trim());

    for (const line of bodyLines) {
      const trimmedLine = line.trim();

      if (!trimmedLine) {
        yPosition -= 10;
        continue;
      }

      // Определяем стиль строки
      const isHeading = /^[А-ЯЁ\s]+$/.test(trimmedLine) && trimmedLine.length < 50;
      const isNumberedSection = /^\d+\./.test(trimmedLine);

      if (isHeading) {
        yPosition -= 5;
        drawText(trimmedLine, { fontSize: 14, bold: true, spacing: 18 });
        yPosition -= 5;
      } else {
        drawText(trimmedLine, {
          fontSize: 12,
          spacing: 16,
          indent: isNumberedSection ? 20 : 0
        });
      }
    }

    // Реквизиты
    if (requisites && Object.keys(requisites).length > 0) {
      yPosition -= 20;

      if (yPosition < margin + 100) {
        page = pdfDoc.addPage([pageWidth, pageHeight]);
        yPosition = pageHeight - margin;
      }

      drawText('РЕКВИЗИТЫ', { fontSize: 14, bold: true, spacing: 18 });
      yPosition -= 10;

      // Информация об организации
      if (organization) {
        if (organization.name_full) {
          drawText(`Полное наименование: ${organization.name_full}`, { fontSize: 11 });
        }
        if (organization.inn) {
          drawText(`ИНН: ${organization.inn}`, { fontSize: 11 });
        }
        if (organization.kpp) {
          drawText(`КПП: ${organization.kpp}`, { fontSize: 11 });
        }
        if (organization.ogrn) {
          drawText(`ОГРН: ${organization.ogrn}`, { fontSize: 11 });
        }
      }

      // Дополнительные реквизиты
      for (const [key, value] of Object.entries(requisites)) {
        if (value && typeof value === 'string') {
          const label = formatRequisiteLabel(key);
          drawText(`${label}: ${value}`, { fontSize: 11 });
        }
      }
    }

    // Генерируем PDF buffer
    const pdfBytes = await pdfDoc.save();

    // Формируем имя файла
    const filename = `${templateName?.replace(/\s+/g, '_') || 'document'}_${Date.now()}.pdf`;

    // Возвращаем файл
    return new NextResponse(pdfBytes, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
        'Content-Length': pdfBytes.length.toString()
      }
    });

  } catch (error) {
    console.error('PDF generation error:', error);
    return NextResponse.json(
      { success: false, error: 'Ошибка при генерации PDF' },
      { status: 500 }
    );
  }
}

// Вспомогательная функция для форматирования меток реквизитов
function formatRequisiteLabel(key: string): string {
  const labels: Record<string, string> = {
    name_full: 'Полное наименование',
    name_short: 'Краткое наименование',
    inn: 'ИНН',
    kpp: 'КПП',
    ogrn: 'ОГРН',
    ogrnip: 'ОГРНИП',
    okpo: 'ОКПО',
    okved: 'ОКВЭД',
    address_legal: 'Юридический адрес',
    address_postal: 'Почтовый адрес',
    phone: 'Телефон',
    email: 'Email',
    website: 'Веб-сайт',
    head_title: 'Должность руководителя',
    head_fio: 'ФИО руководителя',
    authority_base: 'Действует на основании',
    poa_number: 'Номер доверенности',
    poa_date: 'Дата доверенности',
    bank_bik: 'БИК',
    bank_name: 'Наименование банка',
    bank_ks: 'Корр. счёт',
    bank_rs: 'Расчётный счёт',
    seal_note: 'Примечание о печати',
    notes: 'Заметки'
  };

  return labels[key] || key;
}
