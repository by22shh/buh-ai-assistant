import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-utils";
import { finalizeTemplateBodySchema } from "@/lib/schemas/template";
import { ZodError } from "zod";
import { finalizeUpload, deleteStoredFile } from "@/lib/services/templateStorage";
import { Prisma } from "@prisma/client";

function normalizeConfig(config: Prisma.JsonValue | null | undefined) {
  if (!config) return {} as Record<string, unknown>;
  if (typeof config === "object") {
    return JSON.parse(JSON.stringify(config)) as Record<string, unknown>;
  }
  return {} as Record<string, unknown>;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const user = await getCurrentUser(request);
    const { code: templateCode } = await params;

    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const [templateBody, templateConfig] = await Promise.all([
      prisma.templateBody.findUnique({ where: { templateCode } }),
      prisma.templateConfig.findUnique({ where: { templateCode } }),
    ]);

    return NextResponse.json({
      templateBody,
      requisitesConfig: templateConfig?.requisitesConfig ?? null,
    });
  } catch (error) {
    console.error("GET /api/admin/templates/[code]/body error", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const user = await getCurrentUser(request);
    const { code: templateCode } = await params;

    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const payload = await request.json();
    const validated = finalizeTemplateBodySchema.parse(payload);

    if (validated.templateCode !== templateCode) {
      return NextResponse.json({ error: "Template code mismatch" }, { status: 400 });
    }

    const template = await prisma.template.findUnique({ where: { code: templateCode } });
    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    const existingBody = await prisma.templateBody.findUnique({ where: { templateCode } });
    const now = new Date();

    let newBodyRecord;

    const previewValue = validated.previewText ?? existingBody?.previewText ?? "";

    if (validated.uploadId) {
      const finalized = await finalizeUpload({
        uploadId: validated.uploadId,
        templateCode,
        previousRelativePath: existingBody?.filePath ?? null,
      });

      newBodyRecord = await prisma.templateBody.upsert({
        where: { templateCode },
        update: {
          filePath: finalized.relativePath,
          fileName: finalized.fileName,
          fileSize: finalized.fileSize,
          mimeType: finalized.mimeType,
          docHash: finalized.docHash,
          previewText: previewValue,
          placeholders: validated.placeholders,
          createdBy: user.email ?? "admin",
        },
        create: {
          templateCode,
          filePath: finalized.relativePath,
          fileName: finalized.fileName,
          fileSize: finalized.fileSize,
          mimeType: finalized.mimeType,
          docHash: finalized.docHash,
          previewText: previewValue,
          placeholders: validated.placeholders,
          createdBy: user.email ?? "admin",
        },
      });
    } else if (existingBody) {
      newBodyRecord = await prisma.templateBody.update({
        where: { templateCode },
        data: {
          previewText: previewValue,
          placeholders: validated.placeholders,
          createdBy: user.email ?? existingBody.createdBy,
        },
      });
    } else {
      return NextResponse.json({ error: "Необходимо загрузить файл шаблона" }, { status: 400 });
    }

    const existingConfig = await prisma.templateConfig.findUnique({ where: { templateCode } });
    const configData = normalizeConfig(existingConfig?.requisitesConfig);

    const existingFields = Array.isArray((configData as any).fields)
      ? ((configData as any).fields as any[])
      : [];
    const fieldsMap = new Map<string, any>();
    existingFields.forEach((field) => {
      const code = field.code || field.name;
      if (code) fieldsMap.set(code, field);
    });

    let nextOrder = existingFields.reduce((max, field) => Math.max(max, field.order ?? 0), 0);

    validated.placeholders.forEach((binding) => {
      const definition = binding.fieldDefinition;
      if (!definition) return;
      const fieldCode = definition.code;
      const order = definition.order ?? (fieldsMap.get(fieldCode)?.order ?? (nextOrder += 1));
      const normalizedField = {
        ...fieldsMap.get(fieldCode),
        code: fieldCode,
        name: fieldCode,
        label: definition.label,
        type: definition.fieldType,
        fieldType: definition.fieldType,
        required: definition.required,
        enabled: true,
        placeholder: definition.placeholder,
        autofillFromOrg: definition.autofillFromOrg,
        validation: definition.validation,
        options: definition.options,
        order,
      };
      fieldsMap.set(fieldCode, normalizedField);
    });

    const nextFields = Array.from(fieldsMap.values()).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    if (nextFields.length > 0) {
      (configData as any).fields = nextFields;
    }

    const nextConfig = {
      ...configData,
      placeholderBindings: validated.placeholders,
      appendMode: validated.appendMode,
      version: template.version,
      lastUpdated: now.toISOString(),
      updatedBy: user.email ?? "admin",
    };

    const configJson = nextConfig as unknown as Prisma.InputJsonValue;

    const updatedConfig = await prisma.templateConfig.upsert({
      where: { templateCode },
      update: { requisitesConfig: configJson },
      create: {
        templateCode,
        requisitesConfig: configJson,
      },
    });

    return NextResponse.json({
      templateBody: newBodyRecord,
      requisitesConfig: updatedConfig.requisitesConfig,
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      console.error("PUT /api/admin/templates/[code]/body prisma error", error);
    } else {
      console.error("PUT /api/admin/templates/[code]/body error", error);
    }
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "Validation error", details: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const user = await getCurrentUser(request);
    const { code: templateCode } = await params;

    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const existingBody = await prisma.templateBody.findUnique({ where: { templateCode } });
    if (existingBody) {
      await deleteStoredFile(existingBody.filePath);
      await prisma.templateBody.delete({ where: { templateCode } });
    }

    const existingConfig = await prisma.templateConfig.findUnique({ where: { templateCode } });
    if (existingConfig) {
      const configData = normalizeConfig(existingConfig.requisitesConfig);
      delete configData.placeholderBindings;
      delete configData.appendMode;

      const cleanedConfig = Object.keys(configData).length === 0
        ? Prisma.JsonNull
        : ((configData as unknown) as Prisma.InputJsonValue);

      await prisma.templateConfig.update({
        where: { templateCode },
        data: { requisitesConfig: cleanedConfig },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE /api/admin/templates/[code]/body error", error);
    if (error?.code === "P2025") {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
