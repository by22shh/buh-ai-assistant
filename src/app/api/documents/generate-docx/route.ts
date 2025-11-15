import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';
import { Document as DocxDocument, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableRow, TableCell, WidthType } from 'docx';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth-utils';
import { resolveStoredPath } from '@/lib/services/templateStorage';
import type { TemplatePlaceholderBinding } from '@/lib/types/templateRequisites';
import type { RequisiteItem } from '@/lib/services/templateRenderer';

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

  // Пропускаем поля, которые не включены администратором
  // В документ должны попадать только те реквизиты, которые настроены в шаблоне
  if (field.enabled === false) return null;

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

function ensureRenderDataPlaceholders(
  renderData: Record<string, any>, 
  placeholders: any[], 
  requisites?: Record<string, any> | null
) {
  placeholders.forEach((placeholder) => {
    const name = placeholder?.name || placeholder?.normalized;
    if (typeof name === 'string' && !(name in renderData)) {
      // Берем значение из requisites, если оно есть
      const value = requisites?.[name];
      renderData[name] = value !== undefined && value !== null ? String(value) : '';
    }
  });
}

function buildRequisitesData(
  fields: NormalizedField[],
  requisites?: Record<string, any> | null,
  organization?: Record<string, any> | null
): RequisiteItem[] {
  const items: RequisiteItem[] = [];
  const seen = new Set<string>();

  const addItem = (label: string, value: unknown, code: string) => {
    const normalized = normalizeValue(value);
    if (!normalized || seen.has(code)) return;
    seen.add(code);
    items.push({ label, value: normalized });
  };

  // Добавляем только те реквизиты, которые настроены администратором в шаблоне
  // Не добавляем fallback реквизиты - только то, что администратор явно настроил
  fields.forEach((field) => {
    const label = field.label || DEFAULT_REQUISITE_LABELS[field.code] || field.code;
    // Сначала берем значение из requisites (то, что пользователь заполнил),
    // затем из organization (если не заполнено)
    const value = requisites?.[field.code] ?? organization?.[field.code];
    addItem(label, value, field.code);
  });

  // Убрали fallback - теперь используются только реквизиты, настроенные администратором
  return items;
}

// Для обратной совместимости с XML-генерацией
function buildRequisitesLines(
  fields: NormalizedField[],
  requisites?: Record<string, any> | null,
  organization?: Record<string, any> | null
): string[] {
  return buildRequisitesData(fields, requisites, organization).map(item => `${item.label}: ${item.value}`);
}

function appendRequisitesTableXml(xml: string, items: RequisiteItem[]): string {
  if (!items.length) return xml;

  // Создаем XML для таблицы Word
  const tableRows = items.map((item) => {
    return `
      <w:tr>
        <w:tc>
          <w:tcPr>
            <w:tcW w:w="2400" w:type="pct"/>
          </w:tcPr>
          <w:p>
            <w:r>
              <w:rPr>
                <w:b/>
              </w:rPr>
              <w:t xml:space="preserve">${escapeXml(item.label)}</w:t>
            </w:r>
          </w:p>
        </w:tc>
        <w:tc>
          <w:tcPr>
            <w:tcW w:w="3600" w:type="pct"/>
          </w:tcPr>
          <w:p>
            <w:r>
              <w:t xml:space="preserve">${escapeXml(item.value)}</w:t>
            </w:r>
          </w:p>
        </w:tc>
      </w:tr>`;
  }).join('');

  const block = [
    '<w:p><w:r><w:t xml:space="preserve">\u00a0</w:t></w:r></w:p>',
    '<w:p><w:r><w:rPr><w:b/></w:rPr><w:t>РЕКВИЗИТЫ</w:t></w:r></w:p>',
    '<w:tbl>',
    '<w:tblPr>',
    '<w:tblW w:w="0" w:type="auto"/>',
    '<w:tblBorders>',
    '<w:top w:val="single" w:sz="4" w:space="0" w:color="000000"/>',
    '<w:left w:val="single" w:sz="4" w:space="0" w:color="000000"/>',
    '<w:bottom w:val="single" w:sz="4" w:space="0" w:color="000000"/>',
    '<w:right w:val="single" w:sz="4" w:space="0" w:color="000000"/>',
    '<w:insideH w:val="single" w:sz="4" w:space="0" w:color="000000"/>',
    '<w:insideV w:val="single" w:sz="4" w:space="0" w:color="000000"/>',
    '</w:tblBorders>',
    '</w:tblPr>',
    tableRows,
    '</w:tbl>',
  ].join('');

  const closingIndex = xml.lastIndexOf('</w:body>');
  if (closingIndex === -1) return xml;

  return `${xml.slice(0, closingIndex)}${block}${xml.slice(closingIndex)}`;
}

// Для обратной совместимости
function appendRequisitesXml(xml: string, lines: string[]): string {
  if (!lines.length) return xml;
  const items: RequisiteItem[] = lines.map(line => {
    const [label, ...valueParts] = line.split(': ');
    return {
      label: label || '',
      value: valueParts.join(': ') || ''
    };
  });
  return appendRequisitesTableXml(xml, items);
}

function buildRequisitesTableDocx(items: RequisiteItem[]): (Paragraph | Table)[] {
  if (!items.length) return [];

  const result: (Paragraph | Table)[] = [
    new Paragraph({ text: '', spacing: { before: 600 } }),
    new Paragraph({ text: 'РЕКВИЗИТЫ', heading: HeadingLevel.HEADING_2, spacing: { after: 200 } }),
  ];

  // Создаем таблицу с двумя колонками: Название и Значение
  const rows = items.map((item) => {
    return new TableRow({
      children: [
        new TableCell({
          children: [
            new Paragraph({
              children: [new TextRun(item.label)],
              alignment: AlignmentType.LEFT,
            }),
          ],
          width: {
            size: 40,
            type: WidthType.PERCENTAGE,
          },
        }),
        new TableCell({
          children: [
            new Paragraph({
              children: [new TextRun(item.value)],
              alignment: AlignmentType.LEFT,
            }),
          ],
          width: {
            size: 60,
            type: WidthType.PERCENTAGE,
          },
        }),
      ],
    });
  });

  const table = new Table({
    rows,
    width: {
      size: 100,
      type: WidthType.PERCENTAGE,
    },
  });

  result.push(table);
  return result;
}

// Для обратной совместимости с XML-генерацией
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
  templateBody: { filePath?: string | null; fileData?: Uint8Array | null; placeholders?: any };
  config: NormalizedConfig;
  template?: { nameRu: string; version: string } | null;
  user?: { firstName?: string | null; lastName?: string | null; middleName?: string | null } | null;
  bodyText: string;
  requisites?: Record<string, unknown> | null;
  organization?: Record<string, unknown> | null;
  templateName?: string;
}): Promise<Buffer> {
  let templateContent: Buffer | null = null;

  if (params.templateBody.fileData && params.templateBody.fileData.length > 0) {
    templateContent = Buffer.from(params.templateBody.fileData);
  } else if (params.templateBody.filePath) {
    if (typeof params.templateBody.filePath === 'string' && params.templateBody.filePath.startsWith('file://')) {
      try {
        const base64 = params.templateBody.filePath.replace('file://', '');
        templateContent = Buffer.from(base64, 'base64');
      } catch (error) {
        console.warn("Failed to decode inline template body");
      }
    } else {
      const templatePath = resolveStoredPath(params.templateBody.filePath);
      try {
        templateContent = await fs.readFile(templatePath);
      } catch (error) {
        console.warn("Template file not accessible on disk, falling back to stored data");
      }
    }
  }

  if (!templateContent) {
    throw new Error("Тело шаблона недоступно. Загрузите файл шаблона заново.");
  }

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

  // Обрабатываем плейсхолдеры из placeholderBindings
  // После упрощения у плейсхолдеров остались только name и label
  params.config.placeholderBindings.forEach((binding) => {
    // Берем значение напрямую из requisites по имени плейсхолдера
    const value = params.requisites?.[binding.name];
    const finalValue = value !== undefined && value !== null ? String(value) : (binding.defaultValue || '');
    if (!finalValue && binding.required) {
      missingRequired.push(binding.label || binding.name);
    }
    renderData[binding.name] = finalValue;
  });

  // Обрабатываем плейсхолдеры из тела шаблона, которые могут не быть в placeholderBindings
  const placeholders = Array.isArray(params.templateBody.placeholders) ? params.templateBody.placeholders : [];
  ensureRenderDataPlaceholders(renderData, placeholders, params.requisites);

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
  const children: (Paragraph | Table)[] = [];

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
    const items = buildRequisitesData(params.config.fields, params.requisites, params.organization);
    buildRequisitesTableDocx(items).forEach((element) => children.push(element));
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
    let templateBody: { filePath?: string | null; fileData?: Uint8Array | null; placeholders?: any } | null = null;
    let config: NormalizedConfig = { appendMode: DEFAULT_APPEND_MODE, placeholderBindings: [], fields: [] };

    if (effectiveTemplateCode) {
      templateRecord = await prisma.template.findUnique({
        where: { code: effectiveTemplateCode },
        select: { nameRu: true, version: true },
      });

      const [bodyRecord, configRecord] = await Promise.all([
        prisma.templateBody.findUnique({
          where: { templateCode: effectiveTemplateCode },
          select: { filePath: true, fileData: true, placeholders: true },
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
