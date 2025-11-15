import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';
import { resolveStoredPath } from '@/lib/services/templateStorage';
import type { TemplatePlaceholderBinding } from '@/lib/types/templateRequisites';

export type PlaceholderSource = 'requisite' | 'organization' | 'system' | 'custom';

export interface NormalizedBinding {
  name: string;
  label: string;
  source: PlaceholderSource;
  fieldCode?: string;
  defaultValue?: string;
  required: boolean;
  autofillFromOrg?: boolean;
}

export interface NormalizedField {
  code: string;
  label: string;
  order: number;
}

export interface NormalizedConfig {
  appendMode: 'auto' | 'disabled';
  placeholderBindings: NormalizedBinding[];
  fields: NormalizedField[];
}

export const DEFAULT_APPEND_MODE: 'auto' | 'disabled' = 'auto';

interface SystemContext {
  templateName?: string;
  template?: { nameRu: string; version: string } | null;
  user?: { firstName?: string | null; lastName?: string | null; middleName?: string | null } | null;
  now: Date;
}

const SYSTEM_VALUE_RESOLVERS: Record<string, (context: SystemContext) => string> = {
  current_date: ({ now }) => formatDate(now),
  current_datetime: ({ now }) => formatDate(now, true),
  template_version: ({ template }) => template?.version || '',
  template_name: ({ template, templateName }) => template?.nameRu || templateName || '',
  user_full_name: ({ user }) => [user?.lastName, user?.firstName, user?.middleName].filter(Boolean).join(' ').trim(),
};

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

export function parseConfig(raw: any): NormalizedConfig {
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

export interface RequisiteItem {
  label: string;
  value: string;
}

export function buildRequisitesData(
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

// Для обратной совместимости
export function buildRequisitesLines(
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

export async function generateFromTemplateBody(params: {
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
        console.warn('Failed to decode inline template body');
      }
    } else {
      const templatePath = resolveStoredPath(params.templateBody.filePath);
      try {
        templateContent = await readFileSafe(templatePath);
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
    const items = buildRequisitesData(params.config.fields, params.requisites, params.organization);
    if (items.length) {
      const documentXml = zip.file('word/document.xml')?.asText();
      if (documentXml) {
        zip.file('word/document.xml', appendRequisitesTableXml(documentXml, items));
      }
    }
  }

  return doc.getZip().generate({ type: 'nodebuffer' });
}

async function readFileSafe(path: string): Promise<Buffer> {
  const fs = await import('fs/promises');
  return fs.readFile(path);
}

