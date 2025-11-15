"use client";

import { useEffect, useMemo, useRef, useState, use } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useUser } from "@/hooks/useUser";
import { toast } from "sonner";
import { FIELD_TYPES, type FieldType } from "@/lib/types/templateRequisites";
import { PRESET_FIELDS } from "@/lib/types/templateRequisites";
import { cn } from "@/lib/utils";

interface TemplateFieldMeta {
  code: string;
  label: string;
  type: string;
  required: boolean;
  autofillFromOrg: boolean;
  placeholder?: string;
  order?: number;
}

interface PlaceholderBindingState {
  name: string;
  label: string;
  source: PlaceholderSource;
  fieldCode?: string;
  fieldType?: FieldType;
  required: boolean;
  autofillFromOrg: boolean;
  placeholder?: string;
  defaultValue?: string;
  occurrences: number;
  warnings?: string[];
}

type PlaceholderSource = "requisite" | "organization" | "system" | "custom";

type UploadPlaceholder = {
  name: string;
  normalized: string;
  occurrences: number;
  rawTags: string[];
  suggestedLabel?: string;
  suggestedSource?: "preset" | "system" | "custom";
  inferredFieldCode?: string;
  defaultValue?: string;
  warnings?: string[];
};

interface TemplateBodyRecord {
  fileName: string;
  fileSize: number;
  mimeType: string;
  createdAt: string;
  updatedAt: string;
  previewText: string | null;
  placeholders: PlaceholderBindingState[] | null;
}

const SOURCE_OPTIONS: { value: PlaceholderSource; label: string }[] = [
  { value: "requisite", label: "Реквизиты шаблона" },
  { value: "organization", label: "Данные организации" },
  { value: "system", label: "Системные данные" },
  { value: "custom", label: "Фиксированное значение" },
];

const APPEND_MODE_OPTIONS: { value: "auto" | "disabled"; label: string; description: string }[] = [
  {
    value: "auto",
    label: "Автоматически добавлять блок реквизитов",
    description: "В конце документа появится раздел с реквизитами, если их нет в шаблоне",
  },
  {
    value: "disabled",
    label: "Не добавлять автоматически",
    description: "Финальный документ останется как в шаблоне",
  },
];

function formatBytes(bytes: number) {
  if (!bytes) return "0 Б";
  const units = ["Б", "КБ", "МБ", "ГБ"];
  let index = 0;
  let value = bytes;
  while (value >= 1024 && index < units.length - 1) {
    value /= 1024;
    index += 1;
  }
  return `${value.toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

function getDefaultFieldType(fieldCode?: string, fieldsMap?: Map<string, TemplateFieldMeta>): FieldType {
  if (fieldCode && fieldsMap?.has(fieldCode)) {
    const existing = fieldsMap.get(fieldCode);
    const match = FIELD_TYPES.find((type) => type === existing?.type);
    if (match) {
      return match;
    }
  }
  return "text";
}

function mapUploadPlaceholder(
  placeholder: UploadPlaceholder,
  fieldsMap: Map<string, TemplateFieldMeta>,
  existingBindings: Map<string, PlaceholderBindingState | undefined>
): PlaceholderBindingState {
  const alreadyConfigured = existingBindings.get(placeholder.name);
  if (alreadyConfigured) {
    return {
      ...alreadyConfigured,
      occurrences: placeholder.occurrences,
      warnings: placeholder.warnings,
    };
  }

  return {
    name: placeholder.name,
    label: placeholder.suggestedLabel || placeholder.name,
    source: "custom",
    fieldCode: undefined,
    fieldType: "text",
    required: false,
    autofillFromOrg: false,
    placeholder: undefined,
    defaultValue: undefined,
    occurrences: placeholder.occurrences,
    warnings: placeholder.warnings,
  };
}

function normalizeField(field: any): TemplateFieldMeta {
  const code = field.code || field.name;
  return {
    code,
    label: field.label || code,
    type: field.fieldType || field.type || "text",
    required: Boolean(field.required),
    autofillFromOrg: Boolean(field.autofillFromOrg || field.autofill_from_org),
    placeholder: field.placeholder,
    order: typeof field.order === "number" ? field.order : undefined,
  };
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function replacePlaceholderTokens(base: string, placeholders: PlaceholderBindingState[]): string {
  if (!base) return "";

  return placeholders.reduce((acc, placeholder) => {
    const displayValue =
      (placeholder.defaultValue && placeholder.defaultValue.trim()) ||
      (placeholder.label && placeholder.label.trim()) ||
      placeholder.name;

    if (!displayValue) {
      return acc;
    }

    const namePattern = escapeRegExp(placeholder.name);
    const regex = new RegExp(`\\$\\{\\s*${namePattern}(?:[^}]*)?\\}`, "g");

    return acc.replace(regex, displayValue);
  }, base);
}

export default function AdminTemplateBodyPage({ params }: { params: Promise<{ code: string }> }) {
  const router = useRouter();
  const { user, isLoading } = useUser();
  const resolvedParams = use(params);
  const templateCode = resolvedParams.code;

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [template, setTemplate] = useState<any | null>(null);
  const [isFetching, setIsFetching] = useState(true);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [templateBody, setTemplateBody] = useState<TemplateBodyRecord | null>(null);
  const [previewText, setPreviewText] = useState("");
  const [appendMode, setAppendMode] = useState<"auto" | "disabled">("auto");
  const [uploadId, setUploadId] = useState<string | null>(null);
  const [uploadWarnings, setUploadWarnings] = useState<string[]>([]);
  const [placeholders, setPlaceholders] = useState<PlaceholderBindingState[]>([]);
  const [hasPlaceholders, setHasPlaceholders] = useState(false);

  const [fields, setFields] = useState<TemplateFieldMeta[]>([]);

  const fieldsMap = useMemo(() => {
    const map = new Map<string, TemplateFieldMeta>();
    fields.forEach((field) => {
      map.set(field.code, field);
    });
    return map;
  }, [fields]);

  const renderedPreview = useMemo(
    () => replacePlaceholderTokens(previewText, placeholders),
    [previewText, placeholders]
  );

  useEffect(() => {
    if (!isLoading && (!user || user.role !== "admin")) {
      router.push("/templates");
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoadingStatus(true);
        setTemplateBody(null);
        setPreviewText("");
        setUploadId(null);
        setPlaceholders([]);
        setHasPlaceholders(false);
        setFields([]);
        setUploadWarnings([]);
        const [templateRes, bodyRes] = await Promise.all([
          fetch(`/api/admin/templates/${templateCode}`, { credentials: "include" }),
          fetch(`/api/admin/templates/${templateCode}/body`, { credentials: "include" }),
        ]);

        if (templateRes.ok) {
          const data = await templateRes.json();
          setTemplate(data);
        }

        if (bodyRes.ok) {
          const data = await bodyRes.json();
          const config = data.requisitesConfig || {};
          const parsedFields: TemplateFieldMeta[] = Array.isArray(config.fields)
            ? config.fields.map((field: unknown) => normalizeField(field))
            : [];
          setFields(parsedFields);
          const localFieldsMap = new Map<string, TemplateFieldMeta>();
          parsedFields.forEach((field) => localFieldsMap.set(field.code, field));

          if (config.appendMode === "disabled") {
            setAppendMode("disabled");
          }

          if (Array.isArray(config.placeholderBindings)) {
            const bindings = new Map<string, PlaceholderBindingState>();
            (config.placeholderBindings as any[]).forEach((binding) => {
              bindings.set(binding.name, {
                name: binding.name,
                label: binding.label || binding.name,
                source: "custom",
                fieldCode: undefined,
                fieldType: "text",
                required: false,
                autofillFromOrg: false,
                placeholder: undefined,
                defaultValue: undefined,
                occurrences: 1,
                warnings: [],
              });
            });
            setPlaceholders(Array.from(bindings.values()));
            setHasPlaceholders(bindings.size > 0);
          }

          if (data.templateBody) {
            const bodyRecord: TemplateBodyRecord = {
              fileName: data.templateBody.fileName,
              fileSize: data.templateBody.fileSize,
              mimeType: data.templateBody.mimeType,
              createdAt: data.templateBody.createdAt,
              updatedAt: data.templateBody.updatedAt,
              previewText: data.templateBody.previewText,
              placeholders: data.templateBody.placeholders,
            };
            setTemplateBody(bodyRecord);
            if (!previewText && bodyRecord.previewText) {
              setPreviewText(bodyRecord.previewText);
            }
            if (!placeholders.length && Array.isArray(bodyRecord.placeholders)) {
              setPlaceholders(bodyRecord.placeholders);
              setHasPlaceholders(bodyRecord.placeholders.length > 0);
            }
          }
        }
      } catch (error) {
        console.error("Failed to load template body", error);
        toast.error("Не удалось загрузить данные шаблона");
      } finally {
        setIsFetching(false);
        setLoadingStatus(false);
      }
    };

    if (templateCode) {
      loadData();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templateCode]);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadWarnings([]);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`/api/admin/templates/${templateCode}/body/upload`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: "Ошибка загрузки файла" }));
        throw new Error(error.error || "Ошибка загрузки файла");
      }

      const data = await response.json();
      setUploadId(data.uploadId);
      setPreviewText(data.previewText || "");
      setHasPlaceholders(Boolean(data.hasPlaceholders));
      setUploadWarnings(data.warnings || []);

      const existingBindings = new Map<string, PlaceholderBindingState>();
      placeholders.forEach((binding) => existingBindings.set(binding.name, binding));

      const mapped = (data.placeholders as UploadPlaceholder[]).map((placeholder) =>
        mapUploadPlaceholder(placeholder, fieldsMap, existingBindings)
      );
      setPlaceholders(mapped);

      toast.success(`Файл ${file.name} загружен (${mapped.length} плейсхолдеров)`);
    } catch (error) {
      console.error("Upload failed", error);
      toast.error(error instanceof Error ? error.message : "Ошибка при загрузке файла");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const updatePlaceholder = (name: string, updates: Partial<PlaceholderBindingState>) => {
    setPlaceholders((prev) =>
      prev.map((item) => (item.name === name ? { ...item, ...updates } : item))
    );
  };

  const handleSave = async () => {
    if (!placeholders.length && !uploadId && !templateBody) {
      toast.error("Загрузите шаблон перед сохранением");
      return;
    }


    setSaving(true);
    try {
      const payloadPlaceholders = placeholders.map((placeholder) => {
        return {
          name: placeholder.name,
          label: placeholder.label,
        };
      });

      const response = await fetch(`/api/admin/templates/${templateCode}/body`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          templateCode,
          uploadId: uploadId ?? undefined,
          appendMode,
          placeholders: payloadPlaceholders,
          previewText,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: "Ошибка сохранения" }));
        const message = error.error || "Ошибка сохранения";
        let hasDetails = false;

        if (error.details && Array.isArray(error.details)) {
          error.details.forEach((issue: any) => {
            hasDetails = true;
            const detailMessage = issue?.message || message;
            if (issue?.path?.length) {
              toast.error(`${issue.path.join(".")}: ${detailMessage}`);
            } else {
              toast.error(detailMessage);
            }
          });
        }

        if (!hasDetails) {
          toast.error(message);
        }

        throw new Error(message);
      }

      const data = await response.json();
      toast.success("Шаблон сохранён");
      setUploadId(null);

      let updatedFields: TemplateFieldMeta[] = fields;
      if (data.requisitesConfig?.fields) {
        updatedFields = data.requisitesConfig.fields.map(normalizeField);
        setFields(updatedFields);
      }

      if (data.templateBody) {
        setTemplateBody({
          fileName: data.templateBody.fileName,
          fileSize: data.templateBody.fileSize,
          mimeType: data.templateBody.mimeType,
          createdAt: data.templateBody.createdAt,
          updatedAt: data.templateBody.updatedAt,
          previewText: data.templateBody.previewText,
          placeholders: data.templateBody.placeholders,
        });
      }

          if (data.requisitesConfig?.placeholderBindings) {
            const bindings = (data.requisitesConfig.placeholderBindings as any[]).map((binding: any) => ({
              name: binding.name,
              label: binding.label || binding.name,
              source: "custom" as PlaceholderSource,
              fieldCode: undefined,
              fieldType: "text" as FieldType,
              required: false,
              autofillFromOrg: false,
              placeholder: undefined,
              defaultValue: undefined,
              occurrences: 1,
              warnings: [],
            } as PlaceholderBindingState));
            setPlaceholders(bindings);
            setHasPlaceholders(bindings.length > 0);
          }
    } catch (error) {
      console.error("Save failed", error);
      toast.error(error instanceof Error ? error.message : "Ошибка при сохранении");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBody = async () => {
    if (!templateBody) {
      toast.error("Шаблон тела не найден");
      return;
    }

    setDeleting(true);
    try {
      const response = await fetch(`/api/admin/templates/${templateCode}/body`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: "Ошибка удаления" }));
        throw new Error(error.error || "Ошибка удаления");
      }

      toast.success("Файл шаблона удалён");
      setTemplateBody(null);
      setPlaceholders([]);
      setPreviewText("");
      setUploadId(null);
      setHasPlaceholders(false);
    } catch (error) {
      console.error("Delete failed", error);
      toast.error(error instanceof Error ? error.message : "Ошибка при удалении");
    } finally {
      setDeleting(false);
    }
  };

  if (isLoading || loadingStatus) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user || user.role !== "admin") return null;

  const presetFieldCodes = new Set(PRESET_FIELDS.map((field) => field.code));

  return (
    <div className="min-h-screen bg-muted/50">
      <header className="border-b bg-background">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-bold">Тело шаблона</h1>
              <p className="text-muted-foreground">{template?.nameRu || templateCode}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => router.push(`/admin/templates/${templateCode}`)}>
                Назад
              </Button>
              <Button variant="outline" onClick={() => router.push(`/admin/templates/${templateCode}/requisites`)}>
                Настроить реквизиты
              </Button>
              <Button variant="destructive" onClick={handleDeleteBody} disabled={deleting}>
                {deleting ? "Удаление..." : "Удалить файл"}
              </Button>
              <Button onClick={handleSave} disabled={saving || (!placeholders.length && !uploadId && !templateBody)}>
                {saving ? "Сохранение..." : "Сохранить"}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Файл шаблона</CardTitle>
              <CardDescription>
                Загрузите DOCX с плейсхолдерами в формате <code>${"{placeholder}"}</code>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept=".docx"
                className="hidden"
                onChange={handleFileSelect}
              />
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  {templateBody ? (
                    <div className="space-y-1">
                      <div className="font-medium">{templateBody.fileName}</div>
                      <div className="text-sm text-muted-foreground">
                        {formatBytes(templateBody.fileSize)} · обновлён {new Date(templateBody.updatedAt).toLocaleString("ru-RU")}
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">Файл еще не загружен</div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    {uploading ? "Загрузка..." : "Загрузить DOCX"}
                  </Button>
                </div>
              </div>
              {uploadWarnings.length > 0 && (
                <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
                  <div className="font-medium">Предупреждения</div>
                  <ul className="mt-1 list-disc pl-4">
                    {uploadWarnings.map((warning) => (
                      <li key={warning}>{warning}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Режим добавления реквизитов</CardTitle>
              <CardDescription>
                Управляет тем, будет ли блок реквизитов добавляться автоматически, если в шаблоне нет плейсхолдеров
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {APPEND_MODE_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className={cn(
                    "flex cursor-pointer gap-3 rounded-lg border p-3",
                    appendMode === option.value ? "border-primary" : "border-border"
                  )}
                >
                  <Checkbox
                    checked={appendMode === option.value}
                    onCheckedChange={() => setAppendMode(option.value)}
                    className="mt-1"
                  />
                  <div>
                    <div className="font-medium">{option.label}</div>
                    <div className="text-sm text-muted-foreground">{option.description}</div>
                  </div>
                </label>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Плейсхолдеры</CardTitle>
              <CardDescription>
                Настройте отображаемые названия плейсхолдеров. Пользователи будут заполнять их вручную или использовать данные из организации.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {placeholders.length === 0 ? (
                <div className="text-sm text-muted-foreground">
                  Плейсхолдеры не обнаружены. Вы можете загрузить новый шаблон или использовать автоматический блок реквизитов.
                </div>
              ) : (
                <div className="space-y-4">
                  {placeholders.map((placeholder) => {
                    return (
                      <div key={placeholder.name} className="rounded-lg border bg-background p-4">
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                          <div>
                            <div className="font-semibold">{placeholder.name}</div>
                            <div className="text-xs text-muted-foreground">
                              Вхождений: {placeholder.occurrences || 1}
                            </div>
                            {placeholder.warnings?.length ? (
                              <div className="mt-2 text-xs text-amber-700">
                                {placeholder.warnings.join(". ")}
                              </div>
                            ) : null}
                          </div>
                        </div>

                        <div className="mt-4">
                          <div className="space-y-1">
                            <Label>Отображаемое название</Label>
                            <Input
                              value={placeholder.label}
                              onChange={(event) =>
                                updatePlaceholder(placeholder.name, { label: event.target.value })
                              }
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Предпросмотр текста</CardTitle>
              <CardDescription>
                Текст используется только для проверки содержания. Итоговая подстановка выполняется в файле DOCX
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={previewText}
                onChange={(event) => setPreviewText(event.target.value)}
                rows={12}
                placeholder="Предпросмотр тела документа"
              />
            </CardContent>
          </Card>

      <Card>
        <CardHeader>
          <CardTitle>Предпросмотр с учётом настроенных реквизитов</CardTitle>
          <CardDescription>
            Показано, как текст будет выглядеть после подстановки отображаемых названий и постоянных значений
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border bg-muted/50 p-3 text-sm whitespace-pre-wrap">
            {renderedPreview || "Нет данных для отображения"}
          </div>
        </CardContent>
      </Card>
        </div>
      </main>
    </div>
  );
}
