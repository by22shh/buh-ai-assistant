"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useUser } from "@/hooks/useUser";
// Не полагаемся на статический список шаблонов — загружаем из БД через API
import { toast } from "sonner";
import { api } from "@/lib/api-client";

interface RequisiteField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'email' | 'phone' | 'date' | 'select' | 'textarea';
  required: boolean;
  enabled: boolean;
  placeholder?: string;
  validation?: string;
  options?: string[]; // для select
  order: number;
}

type RequisitesMode = "fields_only" | "placeholders_only" | "both";

interface TemplateRequisitesConfig {
  templateCode: string;
  version: string;
  fields: RequisiteField[];
  requisitesMode?: RequisitesMode;
  lastUpdated: string;
  updatedBy: string;
}

// Стандартные поля реквизитов
// Важно: коды полей (name) должны совпадать с кодами полей в организации
// Пользователь сам выбирает, какие поля подтягивать из организации
const standardFields: RequisiteField[] = [
  {
    name: 'name_full',
    label: 'Наименование организации',
    type: 'text',
    required: true,
    enabled: true,
    placeholder: 'ООО "Название компании"',
    order: 1
  },
  {
    name: 'inn',
    label: 'ИНН',
    type: 'text',
    required: true,
    enabled: true,
    placeholder: '1234567890',
    validation: '^\\d{10}$|^\\d{12}$',
    order: 2
  },
  {
    name: 'kpp',
    label: 'КПП',
    type: 'text',
    required: false,
    enabled: true,
    placeholder: '123456789',
    validation: '^\\d{9}$',
    order: 3
  },
  {
    name: 'ogrn',
    label: 'ОГРН',
    type: 'text',
    required: false,
    enabled: true,
    placeholder: '1234567890123',
    validation: '^\\d{13}$',
    order: 4
  },
  {
    name: 'ogrnip',
    label: 'ОГРНИП',
    type: 'text',
    required: false,
    enabled: true,
    placeholder: '123456789012345',
    validation: '^\\d{15}$',
    order: 5
  },
  {
    name: 'address_legal',
    label: 'Юридический адрес',
    type: 'textarea',
    required: false,
    enabled: true,
    placeholder: 'г. Москва, ул. Примерная, д. 1',
    order: 6
  },
  {
    name: 'address_postal',
    label: 'Почтовый адрес',
    type: 'textarea',
    required: false,
    enabled: true,
    placeholder: 'г. Москва, ул. Примерная, д. 1',
    order: 7
  },
  {
    name: 'phone',
    label: 'Телефон',
    type: 'phone',
    required: false,
    enabled: true,
    placeholder: '+7 (999) 123-45-67',
    validation: '^\\+?[0-9\\s\\-()]{10,20}$',
    order: 8
  },
  {
    name: 'email',
    label: 'Email',
    type: 'email',
    required: false,
    enabled: true,
    placeholder: 'info@company.ru',
    order: 9
  },
  {
    name: 'website',
    label: 'Веб-сайт',
    type: 'text',
    required: false,
    enabled: true,
    placeholder: 'www.example.ru',
    order: 10
  },
  {
    name: 'bank_name',
    label: 'Наименование банка',
    type: 'text',
    required: false,
    enabled: false,
    placeholder: 'ПАО "Сбербанк"',
    order: 11
  },
  {
    name: 'bank_bik',
    label: 'БИК банка',
    type: 'text',
    required: false,
    enabled: false,
    placeholder: '044525225',
    validation: '^\\d{9}$',
    order: 12
  },
  {
    name: 'bank_ks',
    label: 'Корреспондентский счёт',
    type: 'text',
    required: false,
    enabled: false,
    placeholder: '30101810400000000225',
    validation: '^\\d{20}$',
    order: 13
  },
  {
    name: 'bank_rs',
    label: 'Расчётный счёт',
    type: 'text',
    required: false,
    enabled: false,
    placeholder: '40702810838000123456',
    validation: '^\\d{20}$',
    order: 14
  },
  {
    name: 'head_fio',
    label: 'ФИО руководителя',
    type: 'text',
    required: false,
    enabled: false,
    placeholder: 'Иванов Иван Иванович',
    order: 15
  },
  {
    name: 'head_title',
    label: 'Должность руководителя',
    type: 'text',
    required: false,
    enabled: false,
    placeholder: 'Генеральный директор',
    order: 16
  },
  {
    name: 'authority_base',
    label: 'Основание полномочий',
    type: 'select',
    required: false,
    enabled: false,
    options: ['Устава', 'Доверенности'],
    order: 17
  }
];

export default function AdminTemplateRequisitesPage({ params }: { params: Promise<{ code: string }> }) {
  const router = useRouter();
  const { user, isLoading } = useUser();
  const resolvedParams = use(params);
  const templateCode = resolvedParams.code;

  const [template, setTemplate] = useState<any | null>(null);
  const [templateNotFound, setTemplateNotFound] = useState(false);
  const [config, setConfig] = useState<TemplateRequisitesConfig | null>(null);
  const [fields, setFields] = useState<RequisiteField[]>(standardFields);
  const [requisitesMode, setRequisitesMode] = useState<RequisitesMode>("both");
  const [appendMode, setAppendMode] = useState<"auto" | "disabled">("auto");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isLoading && (!user || user.role !== "admin")) {
      router.push("/templates");
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user && user.role === "admin" && templateCode) {
      loadTemplate();
      loadRequisitesConfig();
    }
  }, [user, templateCode]);

  const loadTemplate = async () => {
    try {
      const res = await fetch(`/api/admin/templates/${templateCode}`);
      if (res.ok) {
        const t = await res.json();
        setTemplate(t);
        setTemplateNotFound(false);
      } else if (res.status === 404) {
        setTemplate(null);
        setTemplateNotFound(true);
      }
    } catch (e) {
      // оставляем template как null, чтобы страница всё равно позволяла настраивать реквизиты
      console.error('Error loading template info:', e);
    }
  };

  const loadRequisitesConfig = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/template-configs/${templateCode}`);
      if (response.ok) {
        const data = await response.json();
        setConfig(data);
        if (data.requisitesConfig) {
          // Загружаем режим отображения реквизитов
          if (data.requisitesConfig.requisitesMode) {
            setRequisitesMode(data.requisitesConfig.requisitesMode);
          } else {
            // По умолчанию "both" если не указано
            setRequisitesMode("both");
          }

          // Загружаем режим добавления реквизитов
          if (data.requisitesConfig.appendMode) {
            setAppendMode(data.requisitesConfig.appendMode);
          } else {
            // По умолчанию "auto" если не указано
            setAppendMode("auto");
          }

          if (data.requisitesConfig.fields) {
            const storedFields = data.requisitesConfig.fields as any[];
            // Убираем autofillFromOrg из загруженных полей, так как это поле больше не используется
            // Администратор не должен выбирать, что подтягивать - это делает пользователь
            const orderedFields = storedFields
              .map((field, index) => {
                // Создаем новый объект без autofillFromOrg
                const cleanField: RequisiteField = {
                  name: field.name,
                  label: field.label,
                  type: field.type || 'text',
                  required: Boolean(field.required),
                  enabled: field.enabled !== false, // по умолчанию включено
                  placeholder: field.placeholder || undefined,
                  validation: field.validation || undefined,
                  options: field.options || undefined,
                  order: field.order ?? index + 1,
                };
                return cleanField;
              })
              .sort((a, b) => a.order - b.order);
            setFields(orderedFields);
          }
        }
      } else if (response.status === 404) {
        // Конфигурация не найдена - используем стандартные поля
        setConfig(null);
        setFields(standardFields);
      }
    } catch (error) {
      console.error('Error loading requisites config:', error);
      toast.error('Ошибка при загрузке конфигурации реквизитов');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Убираем autofillFromOrg при сохранении, так как это поле больше не используется
      // Администратор не должен выбирать, что подтягивать - это делает пользователь
      // Создаем чистые объекты без лишних полей
      const sortedFields = [...fields]
        .sort((a, b) => a.order - b.order)
        .map(field => {
          // Создаем новый объект только с нужными полями
          const cleanField: any = {
            name: field.name,
            label: field.label,
            type: field.type,
            required: field.required,
            enabled: field.enabled,
            order: field.order,
          };
          // Добавляем опциональные поля только если они есть
          if (field.placeholder) cleanField.placeholder = field.placeholder;
          if (field.validation) cleanField.validation = field.validation;
          if (field.options && field.options.length > 0) cleanField.options = field.options;
          return cleanField;
        });
      const enabledCount = fields.filter(field => field.enabled).length;
      
      const configData = {
        templateCode,
        requisitesConfig: {
          fields: sortedFields,
          requisitesMode: requisitesMode,
          appendMode: appendMode,
          version: template?.version || '1.0',
          lastUpdated: new Date().toISOString(),
          updatedBy: user?.email || 'admin'
        }
      };

      await api.put(`/api/admin/template-configs/${templateCode}`, configData);

      toast.success(`Конфигурация сохранена (активно ${enabledCount} из ${fields.length} полей)`);
      await loadRequisitesConfig(); // Перезагружаем данные
    } catch (error) {
      console.error('Error saving requisites config:', error);
      const message = error instanceof Error ? error.message : 'Ошибка при сохранении конфигурации';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const updateField = (index: number, updates: Partial<RequisiteField>) => {
    setFields(prev => prev.map((field, i) => 
      i === index ? { ...field, ...updates } : field
    ));
  };

  const moveField = (index: number, direction: 'up' | 'down') => {
    const newFields = [...fields];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex >= 0 && targetIndex < newFields.length) {
      [newFields[index], newFields[targetIndex]] = [newFields[targetIndex], newFields[index]];
      
      // Обновляем порядок
      newFields.forEach((field, i) => {
        field.order = i + 1;
      });
      
      setFields(newFields);
    }
  };

  const resetToDefaults = () => {
    setFields([...standardFields]);
    toast.info('Сброшено к стандартным настройкам');
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user || user.role !== "admin") return null;

  if (templateNotFound) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Шаблон не найден</CardTitle>
            <CardDescription>
              Шаблон с кодом &quot;{templateCode}&quot; не существует
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/admin/templates")}>
              Назад к шаблонам
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/50">
      <header className="border-b bg-background">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Настройка реквизитов</h1>
              <p className="text-muted-foreground">{template?.nameRu || '—'}</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "Сохранение..." : "Сохранить"}
              </Button>
              <Button variant="outline" onClick={resetToDefaults}>
                Сброс
              </Button>
              <Button variant="outline" onClick={() => router.push(`/admin/templates/${templateCode}`)}>
                Назад
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="grid gap-6">
          {/* Информация о конфигурации */}
          <Card>
            <CardHeader>
              <CardTitle>Информация о конфигурации</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Шаблон:</strong> {template?.nameRu || '—'}
                </div>
                <div>
                  <strong>Код:</strong> {templateCode}
                </div>
                <div>
                  <strong>Версия:</strong> {template?.version || '—'}
                </div>
                <div>
                  <strong>Последнее изменение:</strong> {config?.lastUpdated 
                    ? new Date(config.lastUpdated).toLocaleString('ru-RU')
                    : 'Не настроен'
                  }
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Режим отображения реквизитов */}
          <Card>
            <CardHeader>
              <CardTitle>Режим отображения реквизитов</CardTitle>
              <CardDescription>
                Выберите, какие реквизиты будут доступны пользователям при заполнении документа
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-3 rounded-lg border p-3">
                  <input
                    type="radio"
                    id="mode_fields_only"
                    name="requisitesMode"
                    value="fields_only"
                    checked={requisitesMode === "fields_only"}
                    onChange={(e) => setRequisitesMode(e.target.value as RequisitesMode)}
                    className="h-4 w-4"
                  />
                  <label htmlFor="mode_fields_only" className="flex-1 cursor-pointer">
                    <div className="font-medium">Только реквизиты из настроек</div>
                    <div className="text-sm text-muted-foreground">
                      Пользователи увидят только поля, настроенные в разделе "Поля реквизитов" ниже
                    </div>
                  </label>
                </div>
                <div className="flex items-center gap-3 rounded-lg border p-3">
                  <input
                    type="radio"
                    id="mode_placeholders_only"
                    name="requisitesMode"
                    value="placeholders_only"
                    checked={requisitesMode === "placeholders_only"}
                    onChange={(e) => setRequisitesMode(e.target.value as RequisitesMode)}
                    className="h-4 w-4"
                  />
                  <label htmlFor="mode_placeholders_only" className="flex-1 cursor-pointer">
                    <div className="font-medium">Только плейсхолдеры из тела документа</div>
                    <div className="text-sm text-muted-foreground">
                      Пользователи увидят только плейсхолдеры, найденные в теле шаблона (настраиваются в разделе "Тело шаблона")
                    </div>
                  </label>
                </div>
                <div className="flex items-center gap-3 rounded-lg border p-3">
                  <input
                    type="radio"
                    id="mode_both"
                    name="requisitesMode"
                    value="both"
                    checked={requisitesMode === "both"}
                    onChange={(e) => setRequisitesMode(e.target.value as RequisitesMode)}
                    className="h-4 w-4"
                  />
                  <label htmlFor="mode_both" className="flex-1 cursor-pointer">
                    <div className="font-medium">И реквизиты из настроек, и плейсхолдеры</div>
                    <div className="text-sm text-muted-foreground">
                      Пользователи увидят и настроенные поля, и плейсхолдеры из тела документа
                    </div>
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Список полей реквизитов */}
          <Card>
            <CardHeader>
              <CardTitle>Поля реквизитов</CardTitle>
              <CardDescription>
                Настройте какие поля будут доступны пользователям при заполнении реквизитов для этого шаблона
                {requisitesMode === "placeholders_only" && (
                  <span className="block mt-1 text-amber-600">
                    ⚠️ В текущем режиме эти поля не будут отображаться пользователям
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {fields.map((field, index) => (
                  <div key={field.name} className="border rounded-lg p-4 bg-background">
                    <div className="grid grid-cols-12 gap-3 items-center">
                      {/* Включен/выключен */}
                      <div className="col-span-1">
                        <Checkbox
                          checked={field.enabled}
                          onCheckedChange={(checked) => updateField(index, { enabled: checked as boolean })}
                        />
                      </div>

                      {/* Название поля */}
                      <div className="col-span-2">
                        <div className="font-medium text-sm">{field.label}</div>
                        <div className="text-xs text-muted-foreground font-mono">{field.name}</div>
                      </div>

                      {/* Тип поля */}
                      <div className="col-span-2">
                        <Select
                          value={field.type}
                          onValueChange={(value) => updateField(index, { type: value as RequisiteField['type'] })}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="text">Текст</SelectItem>
                            <SelectItem value="number">Число</SelectItem>
                            <SelectItem value="email">Email</SelectItem>
                            <SelectItem value="phone">Телефон</SelectItem>
                            <SelectItem value="date">Дата</SelectItem>
                            <SelectItem value="textarea">Многострочный текст</SelectItem>
                            <SelectItem value="select">Выпадающий список</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Обязательное поле */}
                      <div className="col-span-1">
                        <div className="flex items-center space-x-1">
                          <Checkbox
                            checked={field.required}
                            onCheckedChange={(checked) => updateField(index, { required: checked as boolean })}
                            disabled={!field.enabled}
                          />
                          <Label className="text-xs">Обяз.</Label>
                        </div>
                      </div>

                      {/* Placeholder */}
                      <div className="col-span-4">
                        <Input
                          value={field.placeholder || ''}
                          onChange={(e) => updateField(index, { placeholder: e.target.value })}
                          placeholder="Подсказка для пользователя"
                          className="h-8 text-xs"
                          disabled={!field.enabled}
                        />
                      </div>

                      {/* Порядок и действия */}
                      <div className="col-span-2 flex gap-1 items-center">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => moveField(index, 'up')}
                          disabled={index === 0}
                          className="h-8 w-8 p-0"
                        >
                          ↑
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => moveField(index, 'down')}
                          disabled={index === fields.length - 1}
                          className="h-8 w-8 p-0"
                        >
                          ↓
                        </Button>
                        <Badge variant="outline" className="text-xs px-2">
                          {field.order}
                        </Badge>
                      </div>
                    </div>

                    {/* Дополнительные настройки для активных полей */}
                    {field.enabled && (
                      <div className="mt-3 pt-3 border-t">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="text-xs">Регулярное выражение для валидации</Label>
                            <Input
                              value={field.validation || ''}
                              onChange={(e) => updateField(index, { validation: e.target.value })}
                              placeholder="^\\d{10}$"
                              className="h-8 text-xs font-mono"
                            />
                          </div>
                          {field.type === 'select' && (
                            <div>
                              <Label className="text-xs">Варианты (через запятую)</Label>
                              <Input
                                value={field.options?.join(', ') || ''}
                                onChange={(e) => updateField(index, { 
                                  options: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                                })}
                                placeholder="Вариант 1, Вариант 2, Вариант 3"
                                className="h-8 text-xs"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Предварительный просмотр */}
          <Card>
            <CardHeader>
              <CardTitle>Предварительный просмотр</CardTitle>
              <CardDescription>
                Так будут выглядеть поля реквизитов для пользователей
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg p-4 bg-background">
                <div className="grid gap-4">
                  {fields
                    .filter(field => field.enabled)
                    .sort((a, b) => a.order - b.order)
                    .map((field) => (
                      <div key={field.name}>
                        <Label className="text-sm">
                          {field.label}
                          {field.required && <span className="text-red-500 ml-1">*</span>}
                        </Label>
                        {field.type === 'textarea' ? (
                          <div className="mt-1 p-2 border rounded text-sm bg-muted">
                            {field.placeholder || 'Многострочное поле'}
                          </div>
                        ) : field.type === 'select' ? (
                          <div className="mt-1 p-2 border rounded text-sm bg-muted">
                            {field.options?.length ? `[${field.options.join(', ')}]` : '[Выпадающий список]'}
                          </div>
                        ) : (
                          <div className="mt-1 p-2 border rounded text-sm bg-muted">
                            {field.placeholder || `Поле типа ${field.type}`}
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Действия */}
          <div className="flex justify-between">
            <Button variant="outline" onClick={() => router.push(`/admin/templates/${templateCode}`)}>
              Назад к шаблону
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={resetToDefaults}>
                Сбросить к стандартным
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "Сохранение..." : "Сохранить конфигурацию"}
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}