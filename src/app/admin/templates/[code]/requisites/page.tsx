"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useUser } from "@/hooks/useUser";
import { mockTemplateRequisites } from "@/lib/store/mockData";
import { getTemplateByCode } from "@/lib/data/templates";
import { PRESET_FIELDS, type RequisiteField, type FieldType } from "@/lib/types/templateRequisites";
import { toast } from "sonner";
import { Plus, Trash2, MoveUp, MoveDown } from "lucide-react";

export default function TemplateRequisitesPage({ params }: { params: Promise<{ code: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const templateCode = resolvedParams.code;

  const [fields, setFields] = useState<RequisiteField[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);

  const { user, isLoading } = useUser();

  useEffect(() => {
    if (!isLoading && (!user || user.role !== "admin")) {
      router.push("/templates");
      return;
    }

    // Загрузка существующих реквизитов
    if (user && user.role === "admin") {
      const existing = mockTemplateRequisites.getByTemplateCode(templateCode);
      if (existing) {
        setFields(existing.fields);
      }
    }
  }, [user, isLoading, router, templateCode]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user || user.role !== "admin") return null;

  const template = getTemplateByCode(templateCode);

  if (!template) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Шаблон не найден</h1>
          <Button onClick={() => router.push("/admin/templates")}>
            Вернуться к шаблонам
          </Button>
        </div>
      </div>
    );
  }

  const addField = (preset?: typeof PRESET_FIELDS[0]) => {
    const newField: RequisiteField = preset ? {
      ...preset,
      id: `field_${Date.now()}`,
      order: fields.length
    } : {
      id: `field_${Date.now()}`,
      code: "",
      label: "",
      fieldType: "text",
      required: false,
      autofillFromOrg: false,
      order: fields.length
    };

    setFields([...fields, newField]);
    setEditingField(newField.id);
  };

  const deleteField = (id: string) => {
    setFields(fields.filter(f => f.id !== id));
    if (editingField === id) setEditingField(null);
  };

  const moveField = (id: string, direction: "up" | "down") => {
    const index = fields.findIndex(f => f.id === id);
    if (index === -1) return;

    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === fields.length - 1) return;

    const newFields = [...fields];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    [newFields[index], newFields[targetIndex]] = [newFields[targetIndex], newFields[index]];

    // Обновляем order
    newFields.forEach((f, i) => f.order = i);
    setFields(newFields);
  };

  const updateField = (id: string, updates: Partial<RequisiteField>) => {
    setFields(fields.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  const handleSave = () => {
    // Валидация
    for (const field of fields) {
      if (!field.code || !field.label) {
        toast.error("Все поля должны иметь код и название");
        return;
      }
    }

    setLoading(true);

    try {
      mockTemplateRequisites.save({
        templateCode,
        fields: fields.map((f, i) => ({ ...f, order: i }))
      }, user.id);

      toast.success("Настройки реквизитов сохранены");
      setTimeout(() => {
        setLoading(false);
        router.push(`/admin/templates/${templateCode}`);
      }, 500);
    } catch (error) {
      toast.error("Ошибка при сохранении");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/50">
      <header className="border-b bg-background">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Настройка реквизитов</h1>
              <p className="text-sm text-muted-foreground mt-1">{template.nameRu}</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={loading}>
                {loading ? "Сохранение..." : "Сохранить"}
              </Button>
              <Button variant="outline" onClick={() => router.push(`/admin/templates/${templateCode}`)}>
                Отмена
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Быстрое добавление из пресетов */}
          <Card>
            <CardHeader>
              <CardTitle>Добавить поле из пресетов</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {PRESET_FIELDS.map((preset, idx) => (
                  <Button
                    key={idx}
                    variant="outline"
                    size="sm"
                    onClick={() => addField(preset)}
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    {preset.label}
                  </Button>
                ))}
              </div>
              <div className="mt-4">
                <Button variant="secondary" onClick={() => addField()}>
                  <Plus className="w-4 h-4 mr-2" />
                  Добавить пустое поле
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Список полей */}
          <Card>
            <CardHeader>
              <CardTitle>Поля реквизитов ({fields.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {fields.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Поля не добавлены</p>
                  <p className="text-sm mt-1">Используйте пресеты выше или создайте своё поле</p>
                </div>
              ) : (
                fields.map((field, index) => (
                  <div key={field.id} className="border rounded-lg p-4 space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">#{index + 1}</Badge>
                          <h3 className="font-medium">{field.label || "(Без названия)"}</h3>
                          {field.required && <Badge variant="destructive">Обязательное</Badge>}
                          {field.autofillFromOrg && <Badge variant="secondary">Автозаполнение</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          Код: {field.code || "(не указан)"} • Тип: {field.fieldType}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => moveField(field.id, "up")}
                          disabled={index === 0}
                        >
                          <MoveUp className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => moveField(field.id, "down")}
                          disabled={index === fields.length - 1}
                        >
                          <MoveDown className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingField(editingField === field.id ? null : field.id)}
                        >
                          {editingField === field.id ? "Свернуть" : "Редактировать"}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteField(field.id)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>

                    {editingField === field.id && (
                      <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                        <div>
                          <Label>Код поля *</Label>
                          <Input
                            value={field.code}
                            onChange={(e) => updateField(field.id, { code: e.target.value })}
                            placeholder="name_full"
                          />
                        </div>
                        <div>
                          <Label>Название поля *</Label>
                          <Input
                            value={field.label}
                            onChange={(e) => updateField(field.id, { label: e.target.value })}
                            placeholder="Полное наименование"
                          />
                        </div>
                        <div>
                          <Label>Тип поля</Label>
                          <Select
                            value={field.fieldType}
                            onValueChange={(value) => updateField(field.id, { fieldType: value as FieldType })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="text">Текст</SelectItem>
                              <SelectItem value="textarea">Многострочный текст</SelectItem>
                              <SelectItem value="number">Число</SelectItem>
                              <SelectItem value="date">Дата</SelectItem>
                              <SelectItem value="email">Email</SelectItem>
                              <SelectItem value="phone">Телефон</SelectItem>
                              <SelectItem value="select">Выбор из списка</SelectItem>
                              <SelectItem value="inn">ИНН (с валидацией)</SelectItem>
                              <SelectItem value="ogrn">ОГРН (с валидацией)</SelectItem>
                              <SelectItem value="bik">БИК (с валидацией)</SelectItem>
                              <SelectItem value="account">Банковский счёт</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Placeholder</Label>
                          <Input
                            value={field.placeholder || ""}
                            onChange={(e) => updateField(field.id, { placeholder: e.target.value })}
                            placeholder="Введите значение..."
                          />
                        </div>
                        <div className="col-span-2">
                          <Label>Подсказка</Label>
                          <Textarea
                            value={field.helpText || ""}
                            onChange={(e) => updateField(field.id, { helpText: e.target.value })}
                            placeholder="Дополнительная информация для пользователя"
                            rows={2}
                          />
                        </div>
                        <div className="col-span-2 flex gap-4">
                          <div className="flex items-center gap-2">
                            <Checkbox
                              id={`required-${field.id}`}
                              checked={field.required}
                              onCheckedChange={(checked) => updateField(field.id, { required: checked as boolean })}
                            />
                            <Label htmlFor={`required-${field.id}`}>Обязательное поле</Label>
                          </div>
                          <div className="flex items-center gap-2">
                            <Checkbox
                              id={`autofill-${field.id}`}
                              checked={field.autofillFromOrg}
                              onCheckedChange={(checked) => updateField(field.id, { autofillFromOrg: checked as boolean })}
                            />
                            <Label htmlFor={`autofill-${field.id}`}>Автозаполнение из организации</Label>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button onClick={handleSave} disabled={loading} className="flex-1">
              {loading ? "Сохранение..." : "Сохранить настройки"}
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push(`/admin/templates/${templateCode}`)}
              className="flex-1"
            >
              Отмена
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
