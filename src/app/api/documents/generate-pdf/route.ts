import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

/**
 * POST /api/documents/generate-pdf
 * Генерация PDF файла из текста и реквизитов
 */
export async function POST(request: NextRequest) {
  try {
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

    // Загружаем шрифты
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

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
    bank_name: 'Наименование банка',
    bank_bik: 'БИК',
    bank_corr_account: 'Корр. счёт',
    settlement_account: 'Расчётный счёт',
    legal_address: 'Юридический адрес',
    postal_address: 'Почтовый адрес',
    phone: 'Телефон',
    email: 'Email',
    ceo_name: 'Руководитель (ФИО)',
    ceo_position: 'Должность',
    accountant_name: 'Главный бухгалтер (ФИО)'
  };

  return labels[key] || key;
}
