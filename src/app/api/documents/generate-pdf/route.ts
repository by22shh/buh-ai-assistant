import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument, rgb } from 'pdf-lib';
import { getCurrentUser } from '@/lib/auth-utils';
import fontkit from '@pdf-lib/fontkit';

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
    // Используем CDN jsDelivr для DejaVu Sans
    const fontUrl = 'https://cdn.jsdelivr.net/gh/dejavu-fonts/dejavu-fonts@2.37/ttf/DejaVuSans.ttf';
    const fontBoldUrl = 'https://cdn.jsdelivr.net/gh/dejavu-fonts/dejavu-fonts@2.37/ttf/DejaVuSans-Bold.ttf';
    
    // Fetch с таймаутом 10 секунд
    const fetchWithTimeout = async (url: string, timeout = 10000) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      try {
        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.arrayBuffer();
      } catch (error) {
        clearTimeout(timeoutId);
        throw error;
      }
    };
    
    let font, fontBold;
    
    try {
      // Загружаем шрифты параллельно
      const [fontBytes, fontBoldBytes] = await Promise.all([
        fetchWithTimeout(fontUrl),
        fetchWithTimeout(fontBoldUrl)
      ]);
      
      font = await pdfDoc.embedFont(fontBytes);
      fontBold = await pdfDoc.embedFont(fontBoldBytes);
      
      if (process.env.NODE_ENV !== 'production') {
        console.log('✅ DejaVu Sans fonts loaded successfully');
      }
    } catch (fontError) {
      console.error('❌ Failed to load DejaVu Sans fonts:', fontError);
      
      return NextResponse.json(
        { 
          success: false, 
          error: 'Не удалось загрузить шрифты для PDF. Попробуйте позже или обратитесь в поддержку.',
          details: process.env.NODE_ENV !== 'production' ? String(fontError) : undefined
        },
        { status: 503 }
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
