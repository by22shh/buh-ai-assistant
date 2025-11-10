import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';
import { Document as DocxDocument, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth-utils';
import { resolveStoredPath } from '@/lib/services/templateStorage';
import type { TemplatePlaceholderBinding } from '@/lib/types/templateRequisites';

type PlaceholderSource = 'requisite' | 'organization' | 'system' | 'custom';

interface NormalizedBinding {
  name: string;
  label: string;
  source: PlaceholderSource;
  fieldCode?: string;
  defaultValue?: string;
  required: boolean;
  autofillFromOrg?: boolean;
}

interface NormalizedField {
  code: string;
  label: string;
  order: number;
}

interface NormalizedConfig {
  appendMode: 'auto' | 'disabled';
  placeholderBindings: NormalizedBinding[];
  fields: NormalizedField[];
}

const DEFAULT_APPEND_MODE: 'auto' | 'disabled' = 'auto';

const SYSTEM_VALUE_RESOLVERS: Record<string, (context: SystemContext) => string> = {
  current_date: ({ now }) => formatDate(now),
  current_datetime: ({ now }) => formatDate(now, true),
  template_version: ({ template }) => template?.version || '',
  template_name: ({ template, templateName }) => template?.nameRu || templateName || '',
  user_full_name: ({ user }) => [user?.lastName, user?.firstName, user?.middleName].filter(Boolean).join(' ').trim(),
};

interface SystemContext {
  templateName?: string;
  template?: { nameRu: string; version: string } | null;
  user?: { firstName?: string | null; lastName?: string | null; middleName?: string | null } | null;
  now: Date;
}

const DEFAULT_REQUISITE_LABELS: Record<string, string> = {
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
  bank_bik: 'БИК банка',
    bank_name: 'Наименование банка',
    bank_ks: 'Корр. счёт',
    bank_rs: 'Расчётный счёт',
    seal_note: 'Примечание о печати',
  notes: 'Заметки',
};

function parseConfig(raw: any): NormalizedConfig {
  const appendMode = raw?.appendMode === 'disabled' ? 'disabled' : DEFAULT_APPEND_MODE;

  const placeholderBindings: NormalizedBinding[] = Array.isArray(raw?.placeholderBindings)
    ? raw.placeholderBindings
        .map((binding: TemplatePlaceholderBinding & { source?: string }) => normalizeBinding(binding))
        .filter(Boolean) as NormalizedBinding[]
    : [];

  const fields: NormalizedField[] = Array.isArray(raw?.fields)
    ? raw.fields
        .map((field: any) => normalizeField(field))
        .filter(Boolean) as NormalizedField[]
    : [];

  return {
    appendMode,
    placeholderBindings,
    fields: fields.sort((a, b) => a.order - b.order),
  };
}

function normalizeBinding(binding: any): NormalizedBinding | null {
  const name = binding?.name;
  if (!name || typeof name !== 'string') return null;

  const source: PlaceholderSource = ['requisite', 'organization', 'system', 'custom'].includes(binding?.source)
    ? binding.source
    : 'requisite';

  return {
    name,
    label: typeof binding?.label === 'string' && binding.label.length > 0 ? binding.label : name,
    source,
    fieldCode: binding?.fieldCode || binding?.name,
    defaultValue: binding?.defaultValue,
    required: Boolean(binding?.required ?? binding?.fieldDefinition?.required ?? false),
    autofillFromOrg: Boolean(binding?.autofillFromOrg ?? binding?.fieldDefinition?.autofillFromOrg ?? false),
  };
}

function normalizeField(field: any): NormalizedField | null {
  const code = typeof field?.code === 'string' && field.code.length > 0 ? field.code : field?.name;
  if (!code) return null;

  const label = typeof field?.label === 'string' && field.label.length > 0
    ? field.label
    : DEFAULT_REQUISITE_LABELS[code] || code;

  const order = typeof field?.order === 'number' ? field.order : 0;

  return {
    code,
    label,
    order,
  };
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function formatDate(date: Date, withTime = false): string {
  const formatter = new Intl.DateTimeFormat('ru-RU', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: withTime ? '2-digit' : undefined,
    minute: withTime ? '2-digit' : undefined,
  });
  return formatter.format(date);
}

function resolveBindingValue(
  binding: NormalizedBinding,
  context: {
    requisites?: Record<string, any> | null;
    organization?: Record<string, any> | null;
    system: SystemContext;
  }
): string {
  const key = binding.fieldCode || binding.name;

  switch (binding.source) {
    case 'requisite':
      return normalizeValue(context.requisites?.[key] ?? context.requisites?.[binding.name]);
    case 'organization':
      return normalizeValue(context.organization?.[key] ?? context.organization?.[binding.name]);
    case 'system':
      return normalizeValue(getSystemValue(key, context.system));
    case 'custom':
      return normalizeValue(binding.defaultValue);
    default:
      return normalizeValue(context.requisites?.[key] ?? binding.defaultValue);
  }
}

function normalizeValue(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return '';
}

function getSystemValue(code: string, context: SystemContext): string {
  const resolver = SYSTEM_VALUE_RESOLVERS[code];
  if (resolver) {
    return resolver(context);
  }

  // Популярные алиасы
  if (code === 'current_year') {
    return context.now.getFullYear().toString();
  }

  return '';
}

function ensureRenderDataPlaceholders(renderData: Record<string, any>, placeholders: any[]) {
  placeholders.forEach((placeholder) => {
    const name = placeholder?.name || placeholder?.normalized;
    if (typeof name === 'string' && !(name in renderData)) {
      renderData[name] = '';
    }
  });
}

function buildRequisitesLines(
  fields: NormalizedField[],
  requisites?: Record<string, any> | null,
  organization?: Record<string, any> | null
): string[] {
  const lines: string[] = [];
  const seen = new Set<string>();

  const addLine = (label: string, value: unknown, code: string) => {
    const normalized = normalizeValue(value);
    if (!normalized || seen.has(code)) return;
    seen.add(code);
    lines.push(`${label}: ${normalized}`);
  };

  fields.forEach((field) => {
    const label = field.label || DEFAULT_REQUISITE_LABELS[field.code] || field.code;
    const value = requisites?.[field.code] ?? organization?.[field.code];
    addLine(label, value, field.code);
  });

  const fallbackKeys = ['name_full', 'inn', 'kpp', 'ogrn', 'address_legal', 'phone', 'email'];
  fallbackKeys.forEach((key) => {
    const label = DEFAULT_REQUISITE_LABELS[key] || key;
    const value = requisites?.[key] ?? organization?.[key];
    addLine(label, value, key);
  });

  return lines;
}

function appendRequisitesXml(xml: string, lines: string[]): string {
  if (!lines.length) return xml;
  const block = [
    '<w:p><w:r><w:t xml:space="preserve">\u00a0</w:t></w:r></w:p>',
    '<w:p><w:r><w:rPr><w:b/></w:rPr><w:t>РЕКВИЗИТЫ</w:t></w:r></w:p>',
    ...lines.map((line) => `<w:p><w:r><w:t xml:space="preserve">${escapeXml(line)}</w:t></w:r></w:p>`),
  ].join('');

  const closingIndex = xml.lastIndexOf('</w:body>');
  if (closingIndex === -1) return xml;

  return `${xml.slice(0, closingIndex)}${block}${xml.slice(closingIndex)}`;
}

function buildRequisitesParagraphsDocx(lines: string[]): Paragraph[] {
  if (!lines.length) return [];

  const paragraphs: Paragraph[] = [
    new Paragraph({ text: '', spacing: { before: 600 } }),
    new Paragraph({ text: 'РЕКВИЗИТЫ', heading: HeadingLevel.HEADING_2, spacing: { after: 200 } }),
  ];

  lines.forEach((line) => {
    paragraphs.push(
      new Paragraph({
        children: [new TextRun(line)],
        spacing: { after: 100 },
      })
    );
  });

  return paragraphs;
}

async function generateFromTemplateBody(params: {
  templateBody: { filePath: string; placeholders?: any };
  config: NormalizedConfig;
  template?: { nameRu: string; version: string } | null;
  user?: { firstName?: string | null; lastName?: string | null; middleName?: string | null } | null;
  bodyText: string;
  requisites?: Record<string, unknown> | null;
  organization?: Record<string, unknown> | null;
  templateName?: string;
}): Promise<Buffer> {
  const templatePath = resolveStoredPath(params.templateBody.filePath);
  const templateContent = await fs.readFile(templatePath);

  const zip = new PizZip(templateContent);
  const doc = new Docxtemplater(zip, {
    delimiters: { start: '${', end: '}' },
  });

  const renderData: Record<string, any> = {};
  const missingRequired: string[] = [];

  const context = {
    requisites: params.requisites ?? {},
    organization: params.organization ?? {},
    system: {
      template: params.template ?? null,
      templateName: params.templateName,
      user: params.user ?? null,
      now: new Date(),
    } satisfies SystemContext,
  };

  params.config.placeholderBindings.forEach((binding) => {
    const value = resolveBindingValue(binding, context);
    const finalValue = value || binding.defaultValue || '';
    if (!finalValue && binding.required) {
      missingRequired.push(binding.label || binding.name);
    }
    renderData[binding.name] = finalValue;
  });

  const placeholders = Array.isArray(params.templateBody.placeholders) ? params.templateBody.placeholders : [];
  ensureRenderDataPlaceholders(renderData, placeholders);

  if (missingRequired.length) {
    throw new Error(`Не заполнены обязательные поля: ${missingRequired.join(', ')}`);
  }

  doc.setData(renderData);
  doc.render();

  const shouldAppendRequisites =
    params.config.appendMode !== 'disabled' &&
    !params.config.placeholderBindings.some((binding) => binding.source === 'requisite' || binding.source === 'organization');

  if (shouldAppendRequisites) {
    const lines = buildRequisitesLines(params.config.fields, params.requisites, params.organization);
    if (lines.length) {
      const documentXml = zip.file('word/document.xml')?.asText();
      if (documentXml) {
        zip.file('word/document.xml', appendRequisitesXml(documentXml, lines));
      }
    }
  }

  return doc.getZip().generate({ type: 'nodebuffer' });
}

async function generateFallbackDoc(params: {
  bodyText: string;
  templateName?: string;
  requisites?: Record<string, unknown> | null;
  organization?: Record<string, unknown> | null;
  config: NormalizedConfig;
}): Promise<Buffer> {
  const children: Paragraph[] = [];

  if (params.templateName) {
    children.push(
      new Paragraph({
        text: params.templateName,
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
      })
    );
  }

  const bodyParagraphs = params.bodyText.split('\n').filter((line) => line.trim().length > 0);

  for (const line of bodyParagraphs) {
    const trimmed = line.trim();
    const isHeading = /^[А-ЯЁ\s]+$/.test(trimmed) && trimmed.length < 50;
    const isNumbered = /^\d+\./.test(trimmed);

    if (isHeading) {
      children.push(
        new Paragraph({
          text: trimmed,
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 300, after: 200 },
        })
      );
    } else {
      children.push(
        new Paragraph({
          children: [new TextRun(line)],
          spacing: { after: 150 },
          indent: isNumbered ? { left: 720 } : undefined,
        })
      );
    }
  }

  if (params.config.appendMode !== 'disabled') {
    const lines = buildRequisitesLines(params.config.fields, params.requisites, params.organization);
    buildRequisitesParagraphsDocx(lines).forEach((paragraph) => children.push(paragraph));
  }

  const doc = new DocxDocument({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440,
              right: 1440,
              bottom: 1440,
              left: 1440,
            },
          },
        },
        children,
      },
    ],
  });

  return Packer.toBuffer(doc);
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const {
      bodyText,
      requisites = {},
      templateName,
      templateCode,
      documentId,
      organization = null,
    } = await request.json();

    if (!bodyText) {
      return NextResponse.json({ success: false, error: 'bodyText обязателен' }, { status: 400 });
    }

    let effectiveTemplateCode: string | null = templateCode || null;
    if (!effectiveTemplateCode && documentId) {
      const docRecord = await prisma.document.findUnique({
        where: { id: documentId },
        select: { templateCode: true },
      });
      effectiveTemplateCode = docRecord?.templateCode ?? null;
    }

    let templateRecord: { nameRu: string; version: string } | null = null;
    let templateBody: { filePath: string; placeholders?: any } | null = null;
    let config: NormalizedConfig = { appendMode: DEFAULT_APPEND_MODE, placeholderBindings: [], fields: [] };

    if (effectiveTemplateCode) {
      templateRecord = await prisma.template.findUnique({
        where: { code: effectiveTemplateCode },
        select: { nameRu: true, version: true },
      });

      const [bodyRecord, configRecord] = await Promise.all([
        prisma.templateBody.findUnique({
          where: { templateCode: effectiveTemplateCode },
          select: { filePath: true, placeholders: true },
        }),
        prisma.templateConfig.findUnique({
          where: { templateCode: effectiveTemplateCode },
          select: { requisitesConfig: true },
        }),
      ]);

      if (bodyRecord) {
        templateBody = bodyRecord;
      }

      if (configRecord?.requisitesConfig) {
        config = parseConfig(configRecord.requisitesConfig);
      }
    }

    let buffer: Buffer;

    if (templateBody) {
      buffer = await generateFromTemplateBody({
        templateBody,
        config,
        template: templateRecord,
        user,
        bodyText,
        requisites,
        organization,
        templateName,
      });
    } else {
      buffer = await generateFallbackDoc({
        bodyText,
        templateName,
        requisites,
        organization,
        config,
      });
    }

    const filename = `${(templateName || templateRecord?.nameRu || 'document').replace(/\s+/g, '_')}_${Date.now()}.docx`;

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
        'Content-Length': buffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('DOCX generation error:', error);
    const message = error instanceof Error ? error.message : 'Ошибка при генерации DOCX';
    const status = message.startsWith('Не заполнены обязательные поля') ? 400 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
