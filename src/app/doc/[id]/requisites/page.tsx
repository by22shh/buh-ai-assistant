"use client";

import { useState, useEffect, use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useUser } from "@/hooks/useUser";
import { useOrganizations } from "@/hooks/useOrganizations";
import { useDocuments } from "@/hooks/useDocuments";
// TODO: Реализовать API для получения конфигурации реквизитов шаблонов
// import { mockTemplateRequisites } from "@/lib/store/mockData";
import { getTemplateByCode } from "@/lib/data/templates";
import { FIELD_TYPES, type RequisiteField } from "@/lib/types/templateRequisites";
import { toast } from "sonner";

export default function DocumentRequisitesPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const resolvedParams = use(params);
  const docId = resolvedParams.id;
  const templateCode = searchParams.get("template");
  const hasBody = searchParams.get("hasBody") === "true";

  const { user, isLoading: userLoading } = useUser();
  const { organizations, isLoading: orgsLoading } = useOrganizations();
  const { createDocument, getById } = useDocuments();

  const [selectedOrgId, setSelectedOrgId] = useState<string>("");
  const [requisites, setRequisites] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [configuredFields, setConfiguredFields] = useState<RequisiteField[]>([]);
  const [bodyText, setBodyText] = useState<string>("");

  useEffect(() => {
    if (!userLoading && !user) {
      router.push("/auth/login");
      return;
    }
    if (!templateCode) {
      router.push("/templates");
      return;
    }

    // Загружаем настроенные реквизиты для шаблона (публичный endpoint)
    if (templateCode && user) {
      fetch(`/api/template-configs/${templateCode}`)
        .then(res => {
          if (res.ok) {
            return res.json();
          }
          // Если конфигурация не найдена (404), это нормально - используем fallback
          return null;
        })
        .then(data => {
          if (!data?.requisitesConfig?.fields || !Array.isArray(data.requisitesConfig.fields)) {
            setConfiguredFields([]);
            return;
          }

          const normalizedFields: RequisiteField[] = data.requisitesConfig.fields
            .filter((field: any) => field.enabled !== false)
            .map((field: any, index: number) => {
              const rawCode = field.code ?? field.name ?? `field_${index + 1}`;
              const rawType = field.fieldType ?? field.type ?? "text";
              const safeType = (FIELD_TYPES as readonly string[]).includes(rawType)
                ? (rawType as RequisiteField["fieldType"])
                : "text";

              let options: RequisiteField["options"] = undefined;
              if (Array.isArray(field.options)) {
                options = field.options.map((option: any) => {
                  if (typeof option === "string") {
                    return { value: option, label: option };
                  }
                  if (option && typeof option.value === "string" && typeof option.label === "string") {
                    return option;
                  }
                  return null;
                }).filter(Boolean) as RequisiteField["options"];
              }

              const validation =
                field.validation && typeof field.validation === "object"
                  ? field.validation
                  : undefined;

              return {
                id: field.id ?? rawCode,
                code: rawCode,
                label: field.label ?? rawCode,
                fieldType: safeType,
                required: Boolean(field.required),
                autofillFromOrg: Boolean(field.autofillFromOrg),
                placeholder: typeof field.placeholder === "string" ? field.placeholder : "",
                helpText: typeof field.helpText === "string" ? field.helpText : "",
                validation,
                options,
                order: typeof field.order === "number" ? field.order : index + 1,
              };
            })
            .filter((field: any) => field.enabled !== false)
            .sort((a: RequisiteField, b: RequisiteField) => a.order - b.order);

          setConfiguredFields(normalizedFields);
        })
        .catch(err => {
          // Ошибка загрузки конфигурации - это не критично, используем fallback
          console.error('Error loading template config:', err);
        });
    }

    // Если есть bodyText из предыдущего шага, загружаем его из документа
    if (hasBody && docId) {
      const existingDoc = getById(docId);
      if (existingDoc?.bodyText) {
        setBodyText(existingDoc.bodyText);
      } else {
        // Если документ не найден в кеше, загружаем из API
        fetch(`/api/documents/${docId}`)
          .then(res => {
            if (res.ok) {
              return res.json();
            }
            return null;
          })
          .then(data => {
            if (data?.bodyText) {
              setBodyText(data.bodyText);
            }
          })
          .catch(err => {
            console.error('Error loading document bodyText:', err);
          });
      }
    }
  }, [userLoading, user, router, templateCode, hasBody, docId, getById]);

  const template = templateCode ? getTemplateByCode(templateCode) : null;
  const [dbTemplate, setDbTemplate] = useState<any | null>(null);
  const [isTemplateFetching, setIsTemplateFetching] = useState(false);

  useEffect(() => {
    async function loadTemplate() {
      if (!templateCode) return;
      setIsTemplateFetching(true);
      try {
        const res = await fetch('/api/templates');
        if (res.ok) {
          const list = await res.json();
          const found = list.find((t: any) => t.code === templateCode);
          if (found) setDbTemplate(found);
        }
      } catch (e) {
        // ignore
      } finally {
        setIsTemplateFetching(false);
      }
    }
    loadTemplate();
  }, [templateCode]);

  const effectiveTemplate = template || dbTemplate;

  // Loading state
  if (userLoading || orgsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Загрузка...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  if (!effectiveTemplate && isTemplateFetching) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (!effectiveTemplate) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Шаблон не найден</p>
      </div>
    );
  }

  const handleFillFromOrg = () => {
    if (!selectedOrgId) {
      toast.error("Выберите организацию");
      return;
    }

    const org = organizations.find(o => o.id === selectedOrgId);
    if (!org) {
      toast.error("Организация не найдена");
      return;
    }

    const newRequisites: Record<string, string> = {};

    if (configuredFields.length > 0) {
      // Используем настроенные поля с автозаполнением
      configuredFields.forEach(field => {
        if (field.autofillFromOrg && field.code) {
          const orgValue = (org as any)[field.code];
          if (orgValue !== undefined && orgValue !== null) {
            newRequisites[field.code] = String(orgValue);
          }
        }
      });
    } else {
      // Fallback: автоподстановка всех доступных полей
      newRequisites.name_full = org.name_full;
      newRequisites.name_short = org.name_short || "";
      newRequisites.inn = org.inn;
      newRequisites.kpp = org.kpp || "";
      newRequisites.ogrn = org.ogrn || "";
      newRequisites.ogrnip = org.ogrnip || "";
      newRequisites.address_legal = org.address_legal;
      newRequisites.phone = org.phone || "";
      newRequisites.email = org.email;
      newRequisites.head_title = org.head_title;
      newRequisites.head_fio = org.head_fio;
      newRequisites.bank_bik = org.bank_bik;
      newRequisites.bank_name = org.bank_name;
      newRequisites.bank_ks = org.bank_ks;
      newRequisites.bank_rs = org.bank_rs;
    }

    setRequisites(newRequisites);
    toast.success("Реквизиты подтянуты из организации");
  };

  const handleDownload = async (format: "docx" | "pdf") => {
    if (!effectiveTemplate) return;

    setLoading(true);

    try {
      // Создание документа через API
      const doc = await createDocument({
        title: `${effectiveTemplate.nameRu} — ${new Date().toLocaleDateString("ru-RU")}`,
        templateCode: effectiveTemplate.code,
        templateVersion: effectiveTemplate.version,
        organizationId: selectedOrgId || undefined,
        hasBodyChat: hasBody,
        bodyText: hasBody ? bodyText || "Текст документа будет заполнен из чата" : undefined,
        requisites,
      });

      toast.success(`Документ создан! Скачивание ${format.toUpperCase()}...`);

      // Теперь генерируем файл
      const organization = selectedOrgId
        ? organizations.find(o => o.id === selectedOrgId)
        : null;

      const endpoint = format === 'docx'
        ? '/api/documents/generate-docx'
        : '/api/documents/generate-pdf';

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bodyText: doc.bodyText || 'Текст документа не найден',
          requisites: doc.requisites || {},
          templateName: effectiveTemplate.nameRu,
          templateCode: doc.templateCode || effectiveTemplate.code,
          documentId: doc.id,
          organization: organization
        })
      });

      if (!response.ok) {
        throw new Error('Ошибка генерации документа');
      }

      // Получаем blob
      const blob = await response.blob();

      // Создаём ссылку для скачивания
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${effectiveTemplate.nameRu}_${Date.now()}.${format}`;
      document.body.appendChild(a);
      a.click();

      // Очищаем
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success(`Файл ${format.toUpperCase()} скачан`);

      // Переходим в архив
      router.push("/docs");
    } catch (error: any) {
      console.error('Create document error:', error);

      // Проверяем ошибку демо-лимита
      if (error.message?.includes('Demo limit exceeded') || error.message?.includes('лимит')) {
        router.push("/trial/expired");
        return;
      }

      toast.error(`Ошибка: ${error.message || 'Не удалось создать документ'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (hasBody) {
      router.push(`/doc/${docId}/body?template=${templateCode}`);
    } else {
      router.push("/templates");
    }
  };

  return (
    <div className="min-h-screen bg-muted/50">
      <header className="border-b bg-background">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold">Заполнение реквизитов</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {(template?.nameRu || dbTemplate?.nameRu || templateCode)} · {(template?.version || dbTemplate?.version || '')}
          </p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Выбор организации */}
          <Card>
            <CardHeader>
              <CardTitle>Выбор организации</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Организация</Label>
                <Select value={selectedOrgId || undefined} onValueChange={setSelectedOrgId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Не выбирать" />
                  </SelectTrigger>
                  <SelectContent>
                    {organizations.map((org) => (
                      <SelectItem key={org.id} value={org.id!}>
                        {org.name_full}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={handleFillFromOrg}
                disabled={!selectedOrgId}
                variant="outline"
                className="w-full"
              >
                Подтянуть реквизиты
              </Button>
              <p className="text-sm text-muted-foreground">
                Подтянем все доступные поля из выбранной организации. Изменения ниже влияют только на текущий документ.
              </p>
            </CardContent>
          </Card>

          {/* Форма реквизитов (динамическая или упрощенная) */}
          <Card>
            <CardHeader>
              <CardTitle>Реквизиты для этого документа</CardTitle>
              {configuredFields.length > 0 && (
                <p className="text-sm text-muted-foreground mt-1">
                  Настроено полей: {configuredFields.length}
                </p>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {configuredFields.length > 0 ? (
                // Динамическая генерация полей на основе настроек
                configuredFields.map((field) => (
                  <div key={field.id}>
                    <Label htmlFor={field.code}>
                      {field.label}
                      {field.required && <span className="text-destructive ml-1">*</span>}
                    </Label>

                    {/* Рендерим разные типы полей */}
                    {(field.fieldType === "text" || field.fieldType === "inn" ||
                      field.fieldType === "ogrn" || field.fieldType === "bik" ||
                      field.fieldType === "account" || field.fieldType === "number") && (
                      <Input
                        id={field.code}
                        type={field.fieldType === "number" ? "number" : "text"}
                        value={requisites[field.code] || ""}
                        onChange={(e) => setRequisites({ ...requisites, [field.code]: e.target.value })}
                        placeholder={field.placeholder}
                        required={field.required}
                      />
                    )}

                    {field.fieldType === "textarea" && (
                      <Textarea
                        id={field.code}
                        value={requisites[field.code] || ""}
                        onChange={(e) => setRequisites({ ...requisites, [field.code]: e.target.value })}
                        placeholder={field.placeholder}
                        required={field.required}
                        rows={3}
                      />
                    )}

                    {field.fieldType === "email" && (
                      <Input
                        id={field.code}
                        type="email"
                        value={requisites[field.code] || ""}
                        onChange={(e) => setRequisites({ ...requisites, [field.code]: e.target.value })}
                        placeholder={field.placeholder}
                        required={field.required}
                      />
                    )}

                    {field.fieldType === "phone" && (
                      <Input
                        id={field.code}
                        type="tel"
                        value={requisites[field.code] || ""}
                        onChange={(e) => setRequisites({ ...requisites, [field.code]: e.target.value })}
                        placeholder={field.placeholder}
                        required={field.required}
                      />
                    )}

                    {field.fieldType === "date" && (
                      <Input
                        id={field.code}
                        type="date"
                        value={requisites[field.code] || ""}
                        onChange={(e) => setRequisites({ ...requisites, [field.code]: e.target.value })}
                        required={field.required}
                      />
                    )}

                    {field.fieldType === "select" && field.options && (
                      <Select
                        value={requisites[field.code] || ""}
                        onValueChange={(value) => setRequisites({ ...requisites, [field.code]: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={field.placeholder || "Выберите..."} />
                        </SelectTrigger>
                        <SelectContent>
                          {field.options.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}

                    {field.helpText && (
                      <p className="text-xs text-muted-foreground mt-1">{field.helpText}</p>
                    )}
                  </div>
                ))
              ) : (
                // Fallback: статические поля
                <>
                  <div>
                    <Label>Полное наименование</Label>
                    <Input
                      value={requisites.name_full || ""}
                      onChange={(e) => setRequisites({ ...requisites, name_full: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>ИНН</Label>
                    <Input
                      value={requisites.inn || ""}
                      onChange={(e) => setRequisites({ ...requisites, inn: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Адрес</Label>
                    <Input
                      value={requisites.address_legal || ""}
                      onChange={(e) => setRequisites({ ...requisites, address_legal: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={requisites.email || ""}
                      onChange={(e) => setRequisites({ ...requisites, email: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Должность руководителя</Label>
                    <Input
                      value={requisites.head_title || ""}
                      onChange={(e) => setRequisites({ ...requisites, head_title: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>ФИО руководителя</Label>
                    <Input
                      value={requisites.head_fio || ""}
                      onChange={(e) => setRequisites({ ...requisites, head_fio: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>БИК банка</Label>
                    <Input
                      value={requisites.bank_bik || ""}
                      onChange={(e) => setRequisites({ ...requisites, bank_bik: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Наименование банка</Label>
                    <Input
                      value={requisites.bank_name || ""}
                      onChange={(e) => setRequisites({ ...requisites, bank_name: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Расчётный счёт</Label>
                    <Input
                      value={requisites.bank_rs || ""}
                      onChange={(e) => setRequisites({ ...requisites, bank_rs: e.target.value })}
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Действия */}
          <div className="flex flex-col gap-3">
            <Button
              onClick={() => handleDownload("docx")}
              disabled={loading}
              className="w-full"
            >
              {loading ? "Сборка..." : "Собрать и скачать (DOCX)"}
            </Button>
            <Button
              onClick={() => handleDownload("pdf")}
              disabled={loading}
              variant="secondary"
              className="w-full"
            >
              Скачать PDF
            </Button>
            <Button onClick={handleBack} variant="outline" className="w-full">
              Назад
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
