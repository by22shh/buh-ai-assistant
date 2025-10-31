import { NextRequest, NextResponse } from 'next/server';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import { getCurrentUser } from '@/lib/auth-utils';

/**
 * POST /api/documents/generate-docx
 * Генерация DOCX файла из текста и реквизитов
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

    // Создаём секции документа
    const children: Paragraph[] = [];

    // Заголовок документа
    if (templateName) {
      children.push(
        new Paragraph({
          text: templateName,
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 }
        })
      );
    }

    // Тело документа
    const bodyParagraphs = bodyText.split('\n').filter((line: string) => line.trim());

    for (const line of bodyParagraphs) {
      // Определяем, является ли строка заголовком
      const isHeading = /^[А-ЯЁ\s]+$/.test(line.trim()) && line.length < 50;
      const isNumberedSection = /^\d+\./.test(line.trim());

      if (isHeading) {
        children.push(
          new Paragraph({
            text: line.trim(),
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 300, after: 200 }
          })
        );
      } else {
        children.push(
          new Paragraph({
            children: [new TextRun(line)],
            spacing: { after: 150 },
            indent: isNumberedSection ? { left: 720 } : undefined
          })
        );
      }
    }

    // Реквизиты в конце документа
    if (requisites && Object.keys(requisites).length > 0) {
      children.push(
        new Paragraph({
          text: '',
          spacing: { before: 600 }
        })
      );

      children.push(
        new Paragraph({
          text: 'РЕКВИЗИТЫ',
          heading: HeadingLevel.HEADING_2,
          spacing: { after: 200 }
        })
      );

      // Информация об организации
      if (organization) {
        if (organization.name_full) {
          children.push(
            new Paragraph({
              text: `Полное наименование: ${organization.name_full}`,
              spacing: { after: 100 }
            })
          );
        }
        if (organization.inn) {
          children.push(
            new Paragraph({
              text: `ИНН: ${organization.inn}`,
              spacing: { after: 100 }
            })
          );
        }
        if (organization.kpp) {
          children.push(
            new Paragraph({
              text: `КПП: ${organization.kpp}`,
              spacing: { after: 100 }
            })
          );
        }
        if (organization.ogrn) {
          children.push(
            new Paragraph({
              text: `ОГРН: ${organization.ogrn}`,
              spacing: { after: 100 }
            })
          );
        }
      }

      // Дополнительные реквизиты
      for (const [key, value] of Object.entries(requisites)) {
        if (value && typeof value === 'string') {
          const label = formatRequisiteLabel(key);
          children.push(
            new Paragraph({
              text: `${label}: ${value}`,
              spacing: { after: 100 }
            })
          );
        }
      }
    }

    // Создаём документ
    const doc = new Document({
      sections: [{
        properties: {
          page: {
            margin: {
              top: 1440,    // 2.5 см
              right: 1440,  // 2.5 см
              bottom: 1440, // 2.5 см
              left: 1440    // 2.5 см
            }
          }
        },
        children
      }]
    });

    // Генерируем buffer
    const buffer = await Packer.toBuffer(doc);

    // Формируем имя файла
    const filename = `${templateName?.replace(/\s+/g, '_') || 'document'}_${Date.now()}.docx`;

    // Возвращаем файл
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
        'Content-Length': buffer.length.toString()
      }
    });

  } catch (error) {
    console.error('DOCX generation error:', error);
    return NextResponse.json(
      { success: false, error: 'Ошибка при генерации DOCX' },
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
