import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-utils";
import { saveTempUpload } from "@/lib/services/templateStorage";
import { extractDocxPlaceholders } from "@/lib/utils/templatePlaceholders";

const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15 MB

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const user = await getCurrentUser(request);
    const { code: templateCode } = await params;

    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Файл не найден" }, { status: 400 });
    }

    if (!file.name.toLowerCase().endsWith(".docx")) {
      return NextResponse.json({ error: "Поддерживаются только DOCX файлы" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "Размер файла не должен превышать 15 МБ" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);

    const { uploadId } = await saveTempUpload({
      fileBuffer,
      originalName: file.name,
      mimeType: file.type || "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      size: file.size,
    });

    const { placeholders, warnings, previewText, hasPlaceholders } = await extractDocxPlaceholders(fileBuffer);

    return NextResponse.json({
      uploadId,
      templateCode,
      file: {
        name: file.name,
        size: file.size,
        type: file.type,
      },
      placeholders,
      warnings,
      hasPlaceholders,
      previewText,
      uploadedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("POST /api/admin/templates/[code]/body/upload error", error);
    return NextResponse.json({ error: "Не удалось обработать файл" }, { status: 500 });
  }
}
