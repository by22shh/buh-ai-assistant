import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/files/parse
 * Парсинг загруженных файлов и извлечение текста
 * Поддержка: .docx, .pdf, .txt, .md
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'Файл не найден' },
        { status: 400 }
      );
    }

    const fileName = file.name.toLowerCase();
    const fileExtension = fileName.split('.').pop();

    // Проверка размера (15 МБ)
    if (file.size > 15 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: 'Размер файла не должен превышать 15 МБ' },
        { status: 400 }
      );
    }

    let text: string;

    // Парсинг в зависимости от формата
    if (fileExtension === 'txt' || fileExtension === 'md') {
      // Простые текстовые файлы
      text = await file.text();

    } else if (fileExtension === 'docx') {
      // DOCX файлы
      const mammoth = await import('mammoth');
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      text = result.value;

    } else if (fileExtension === 'pdf') {
      // PDF файлы
      // @ts-expect-error - pdf-parse имеет проблемы с типами
      const pdfParse = (await import('pdf-parse')).default || (await import('pdf-parse'));
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const data = await pdfParse(buffer);
      text = data.text;

    } else {
      return NextResponse.json(
        {
          success: false,
          error: `Неподдерживаемый формат файла: .${fileExtension}. Поддерживаются: .docx, .pdf, .txt, .md`
        },
        { status: 400 }
      );
    }

    // Проверка на пустой текст
    if (!text || text.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Не удалось извлечь текст из файла' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      text: text.trim(),
      fileName: file.name,
      fileSize: file.size,
      fileType: fileExtension
    });

  } catch (error: any) {
    console.error('File parsing error:', error);
    return NextResponse.json(
      {
        success: false,
        error: `Ошибка при обработке файла: ${error.message || 'Неизвестная ошибка'}`
      },
      { status: 500 }
    );
  }
}
