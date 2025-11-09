import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { getCurrentUser } from '@/lib/auth-utils';
import fontkit from '@pdf-lib/fontkit';

export const runtime = 'nodejs';
export const maxDuration = 60;

// Cache fonts across invocations to reduce latency and external requests
let cachedFontBytes: Uint8Array | null = null;
let cachedFontBoldBytes: Uint8Array | null = null;

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
      organization
    } = await request.json();

    if (!bodyText) {
      return NextResponse.json(
        { success: false, error: 'bodyText обязателен' },
        { status: 400 }
      );
    }

    // Создаём новый PDF документ
    const pdfDoc = await PDFDocument.create();
    
    // Регистрируем fontkit для поддержки TTF шрифтов
    pdfDoc.registerFontkit(fontkit);

    // Загружаем шрифты с поддержкой кириллицы (DejaVu Sans)
    // Перечень зеркал/CDN — пробуем по очереди, кешируем успешный вариант
    const regularCandidates = [
      'https://cdn.jsdelivr.net/gh/dejavu-fonts/dejavu-fonts@2.37/ttf/DejaVuSans.ttf',
      'https://unpkg.com/@dejavu-fonts/dejavu-sans@2.37/ttf/DejaVuSans.ttf',
      'https://cdnjs.cloudflare.com/ajax/libs/dejavu/2.37/ttf/DejaVuSans.ttf',
      // GitHub raw как крайний вариант (иногда медленный)
      'https://raw.githubusercontent.com/dejavu-fonts/dejavu-fonts/version_2_37/ttf/DejaVuSans.ttf',
    ];
    const boldCandidates = [
      'https://cdn.jsdelivr.net/gh/dejavu-fonts/dejavu-fonts@2.37/ttf/DejaVuSans-Bold.ttf',
      'https://unpkg.com/@dejavu-fonts/dejavu-sans@2.37/ttf/DejaVuSans-Bold.ttf',
      'https://cdnjs.cloudflare.com/ajax/libs/dejavu/2.37/ttf/DejaVuSans-Bold.ttf',
      'https://raw.githubusercontent.com/dejavu-fonts/dejavu-fonts/version_2_37/ttf/DejaVuSans-Bold.ttf',
    ];
    
    // Fetch с таймаутом 10 секунд
    const fetchWithTimeout = async (url: string, timeout = 10000) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      try {
        const response = await fetch(url, { signal: controller.signal, headers: { 'User-Agent': 'pdf-generator/1.0' } });
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const buf = await response.arrayBuffer();
        return new Uint8Array(buf);
      } catch (error) {
        clearTimeout(timeoutId);
        throw error;
      }
    };
    
    let font, fontBold;
    
    try {
      // Загружаем шрифты (с кэшем) — пытаемся через несколько зеркал
      if (!cachedFontBytes) {
        let lastErr: unknown = null;
        for (const url of regularCandidates) {
          try {
            cachedFontBytes = await fetchWithTimeout(url, 12000);
            if (cachedFontBytes) break;
          } catch (e) {
            lastErr = e;
          }
        }
        if (!cachedFontBytes) throw lastErr || new Error('Failed to fetch regular font');
      }
      if (!cachedFontBoldBytes) {
        let lastErr: unknown = null;
        for (const url of boldCandidates) {
          try {
            cachedFontBoldBytes = await fetchWithTimeout(url, 12000);
            if (cachedFontBoldBytes) break;
          } catch (e) {
            lastErr = e;
          }
        }
        if (!cachedFontBoldBytes) throw lastErr || new Error('Failed to fetch bold font');
      }

      font = await pdfDoc.embedFont(cachedFontBytes);
      fontBold = await pdfDoc.embedFont(cachedFontBoldBytes);
      
      if (process.env.NODE_ENV !== 'production') {
        console.log('✅ DejaVu Sans fonts loaded successfully (custom Unicode fonts active)');
      }
    } catch (fontError) {
      // Fallback: в случае недоступности внешних шрифтов используем стандартные
      // Предупреждение: стандартные Helvetica/Helvetica-Bold могут не поддерживать кириллицу.
      if (process.env.NODE_ENV !== 'production') {
        console.warn('⚠️ Fallback to StandardFonts due to font load error:', fontError);
      }
      font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
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
    const bodyLines = bodyText.split('\n').filter((line: string) => line.trim());

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
