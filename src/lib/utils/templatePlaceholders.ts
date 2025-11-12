import Docxtemplater, { type DocxtemplaterTag } from "docxtemplater";
import PizZip from "pizzip";
import mammoth from "mammoth";
import { PRESET_FIELDS } from "@/lib/types/templateRequisites";

export type PlaceholderSuggestionSource = "preset" | "system" | "custom";

export interface PlaceholderMetadata {
  name: string;
  normalized: string;
  occurrences: number;
  rawTags: string[];
  suggestedLabel?: string;
  suggestedSource: PlaceholderSuggestionSource;
  inferredFieldCode?: string;
  defaultValue?: string;
  warnings: string[];
}

export interface ExtractPlaceholdersResult {
  placeholders: PlaceholderMetadata[];
  warnings: string[];
  previewText: string;
  hasPlaceholders: boolean;
}

const PLACEHOLDER_PATTERN = /^[a-zA-Z][a-zA-Z0-9._:-]{1,63}$/;

const PRESET_FIELD_MAP: Record<string, { label: string }> = ((): Record<string, { label: string }> => {
  const map: Record<string, { label: string }> = {};
  for (const field of PRESET_FIELDS) {
    map[field.code] = { label: field.label };
  }
  return map;
})();

const SYSTEM_PLACEHOLDERS: Record<string, { label: string }> = {
  current_date: { label: "Текущая дата" },
  current_datetime: { label: "Текущая дата и время" },
  template_version: { label: "Версия шаблона" },
  template_name: { label: "Название шаблона" },
  user_full_name: { label: "ФИО пользователя" },
};

function extractNameParts(rawTag: string) {
  const cleaned = rawTag.replace(/^\$\{/, "").replace(/}$/, "").trim();
  const [name, label, defaultValue] = cleaned.split("|");
  return { name: name?.trim() ?? "", label: label?.trim(), defaultValue: defaultValue?.trim() };
}

function normalizeName(name: string) {
  return name.trim();
}

function inferMetadata(name: string, providedLabel?: string) {
  if (SYSTEM_PLACEHOLDERS[name]) {
    return {
      source: "system" as PlaceholderSuggestionSource,
      label: providedLabel || SYSTEM_PLACEHOLDERS[name].label,
      fieldCode: undefined,
    };
  }

  if (PRESET_FIELD_MAP[name]) {
    return {
      source: "preset" as PlaceholderSuggestionSource,
      label: providedLabel || PRESET_FIELD_MAP[name].label,
      fieldCode: name,
    };
  }

  return {
    source: "custom" as PlaceholderSuggestionSource,
    label: providedLabel,
    fieldCode: undefined,
  };
}

function aggregatePlaceholders(rawTags: DocxtemplaterTag[] | undefined, fallbackRawTags: string[]) {
  const tagMap = new Map<string, PlaceholderMetadata>();
  const warnings: string[] = [];

  const handleTag = (rawTag: string) => {
    const { name, label, defaultValue } = extractNameParts(rawTag);
    const normalized = normalizeName(name);
    const entryWarnings: string[] = [];

    if (!normalized) {
      entryWarnings.push("Пустой плейсхолдер пропущен");
      warnings.push(...entryWarnings);
      return;
    }

    if (!PLACEHOLDER_PATTERN.test(normalized)) {
      entryWarnings.push("Некорректный формат кода плейсхолдера");
    }

    const existing = tagMap.get(normalized);
    const { source, label: suggestedLabel, fieldCode } = inferMetadata(normalized, label);

    if (existing) {
      existing.occurrences += 1;
      existing.rawTags.push(rawTag);
      if (defaultValue && !existing.defaultValue) {
        existing.defaultValue = defaultValue;
      }
      existing.warnings.push(...entryWarnings);
      return;
    }

    tagMap.set(normalized, {
      name: normalized,
      normalized,
      occurrences: 1,
      rawTags: [rawTag],
      suggestedLabel,
      suggestedSource: source,
      inferredFieldCode: fieldCode,
      defaultValue: defaultValue || undefined,
      warnings: entryWarnings,
    });
  };

  if (rawTags) {
    rawTags.forEach((tag) => handleTag(tag.raw));
  }

  fallbackRawTags.forEach((raw) => handleTag(raw));

  return { placeholders: Array.from(tagMap.values()), warnings };
}

function bufferToArrayBuffer(buffer: Buffer): ArrayBuffer {
  const slice = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
  return slice instanceof ArrayBuffer ? slice : buffer.slice().buffer;
}

const XML_ENTITY_MAP: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&apos;": "'",
};

function decodeXmlEntities(input: string) {
  return input.replace(/&(amp|lt|gt|quot|apos);/g, (match) => XML_ENTITY_MAP[match] ?? match);
}

function normalizeWhitespace(text: string) {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function fallbackPreviewFromXml(buffer: Buffer): string {
  try {
    const zip = new PizZip(buffer);
    const documentXml = zip.file("word/document.xml")?.asText();
    if (!documentXml) {
      return "";
    }

    const withLineBreaks = documentXml
      .replace(/<w:p[^>]*>/g, "\n")
      .replace(/<w:br\s*\/>/g, "\n")
      .replace(/<w:tab\s*\/>/g, "\t")
      .replace(/<\/w:p>/g, "\n")
      .replace(/<[^>]+>/g, " ");

    const decoded = decodeXmlEntities(withLineBreaks);
    const cleaned = normalizeWhitespace(decoded);

    return cleaned;
  } catch (error) {
    console.error("Failed to build fallback preview", error);
    return "";
  }
}

async function buildPreview(buffer: Buffer) {
  try {
    const { value } = await mammoth.extractRawText({
      arrayBuffer: bufferToArrayBuffer(buffer),
      includeTextBoxText: true,
    });
    const cleaned = normalizeWhitespace(value ?? "");
    if (cleaned) {
      return cleaned;
    }
  } catch (error) {
    console.error("Failed to build preview via mammoth", error);
  }

  return fallbackPreviewFromXml(buffer);
}

export async function extractDocxPlaceholders(fileBuffer: Buffer): Promise<ExtractPlaceholdersResult> {
  const warnings: string[] = [];
  let fullTags: DocxtemplaterTag[] | undefined;
  const fallbackRawTags: string[] = [];

  try {
    const zip = new PizZip(fileBuffer);
    const doc = new Docxtemplater(zip, {
      delimiters: { start: "${", end: "}" },
    });
    doc.compile();

    if (typeof doc.getFullTags === "function") {
      fullTags = doc.getFullTags();
    }

    if (!fullTags || fullTags.length === 0) {
      const fullText = typeof (doc as any).getFullText === "function" ? (doc as any).getFullText() : "";
      if (typeof fullText === "string" && fullText.includes("${")) {
        const regex = /\$\{([^}]+)\}/g;
        let match: RegExpExecArray | null;
        while ((match = regex.exec(fullText))) {
          fallbackRawTags.push(`\${${match[1]}}`);
        }
      }
    }
  } catch (error) {
    console.error("Placeholder extraction error", error);
    warnings.push("Не удалось полностью проанализировать плейсхолдеры. Проверьте корректность шаблона.");
  }

  const { placeholders, warnings: aggregationWarnings } = aggregatePlaceholders(fullTags, fallbackRawTags);
  warnings.push(...aggregationWarnings);

  const previewText = await buildPreview(fileBuffer);

  return {
    placeholders,
    warnings,
    previewText,
    hasPlaceholders: placeholders.length > 0,
  };
}
