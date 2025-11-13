"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useUser } from "@/hooks/useUser";
import { type Template } from "@/lib/data/templates";
import { categories } from "@/lib/data/categories";
import { tags } from "@/lib/data/tags";
import { toast } from "sonner";
import { api } from "@/lib/api-client";

export default function AdminTemplateCreatePage() {
  const router = useRouter();
  const { user, isLoading } = useUser();
  const [saving, setSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState<Partial<Template>>({
    code: "",
    nameRu: "",
    shortDescription: "",
    hasBodyChat: true,
    category: "",
    tags: [],
    isEnabled: true,
    version: "1.0",
  });

  useEffect(() => {
    if (!isLoading && (!user || user.role !== "admin")) {
      router.push("/templates");
    }
  }, [user, isLoading, router]);

  const generateCodeFromName = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^\w\s-]/g, '') // удаляем спецсимволы
      .replace(/\s+/g, '_') // пробелы в подчеркивания
      .replace(/[а-я]/g, (match) => { // транслитерация
        const translitMap: { [key: string]: string } = {
          'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo',
          'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
          'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
          'ф': 'f', 'х': 'h', 'ц': 'c', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch',
          'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya'
        };
        return translitMap[match] || match;
      });
  };

  const handleNameChange = (name: string) => {
    setFormData(prev => ({
      ...prev,
      nameRu: name,
      // Автогенерация кода если он пустой
      code: prev.code === "" ? generateCodeFromName(name) : prev.code
    }));
  };

  const handleSave = async () => {
    if (!formData.nameRu || !formData.code || !formData.shortDescription) {
      toast.error("Заполните все обязательные поля");
      return;
    }

    if (!formData.category) {
      toast.error("Выберите категорию");
      return;
    }

    // Проверяем уникальность кода
    // В реальном приложении это проверялось бы через API
    // Пока просто проверяем локально
    if (formData.code.length < 3) {
      toast.error("Код шаблона должен содержать минимум 3 символа");
      return;
    }

    setSaving(true);
    try {
      const created = await api.post(`/api/admin/templates`, {
        code: formData.code,
        nameRu: formData.nameRu,
        shortDescription: formData.shortDescription,
        hasBodyChat: formData.hasBodyChat,
        category: formData.category,
        tags: formData.tags || [],
        isEnabled: formData.isEnabled,
        version: formData.version || '1.0',
      });

      toast.success("Шаблон успешно создан!");
      router.push(`/admin/templates/${created?.code ?? formData.code}`);
    } catch (error) {
      console.error('Error creating template:', error);
      const message = error instanceof Error ? error.message : "Ошибка при создании шаблона";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleTagToggle = (tagCode: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      tags: checked 
        ? [...(prev.tags || []), tagCode]
        : (prev.tags || []).filter(t => t !== tagCode)
    }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user || user.role !== "admin") return null;

  return (
    <div className="min-h-screen bg-muted/50">
      <header className="border-b bg-background">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Создание нового шаблона</h1>
              <p className="text-muted-foreground">Добавьте новый шаблон документа в систему</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "Создание..." : "Создать шаблон"}
              </Button>
              <Button variant="outline" onClick={() => router.push("/admin/templates")}>
                Отмена
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="grid gap-6">
          {/* Основная информация */}
          <Card>
            <CardHeader>
              <CardTitle>Основная информация</CardTitle>
              <CardDescription>
                Базовые настройки нового шаблона
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="nameRu">Название шаблона *</Label>
                <Input
                  id="nameRu"
                  value={formData.nameRu}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="Например: Договор поставки товаров"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Код шаблона будет сгенерирован автоматически
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="code">Код шаблона *</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                    placeholder="contract_supply_goods"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Латинские буквы, цифры, подчеркивания
                  </p>
                </div>
                <div>
                  <Label htmlFor="version">Версия</Label>
                  <Input
                    id="version"
                    value={formData.version}
                    onChange={(e) => setFormData(prev => ({ ...prev, version: e.target.value }))}
                    placeholder="1.0"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="shortDescription">Описание *</Label>
                <Textarea
                  id="shortDescription"
                  value={formData.shortDescription}
                  onChange={(e) => setFormData(prev => ({ ...prev, shortDescription: e.target.value }))}
                  placeholder="Опишите для чего предназначен этот шаблон..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Категоризация */}
          <Card>
            <CardHeader>
              <CardTitle>Категоризация</CardTitle>
              <CardDescription>
                Настройка категории и тегов для классификации
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="category">Категория *</Label>
                <Select 
                  value={formData.category} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите категорию" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.code} value={category.code}>
                        {category.nameRu}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Теги</Label>
                <p className="text-sm text-muted-foreground mb-2">
                  Выберите подходящие теги для лучшей классификации
                </p>
                <div className="grid grid-cols-2 gap-4">
                  {tags.map((tag) => (
                    <div key={tag.code} className="flex items-center space-x-2">
                      <Checkbox
                        id={tag.code}
                        checked={formData.tags?.includes(tag.code) || false}
                        onCheckedChange={(checked) => handleTagToggle(tag.code, checked as boolean)}
                      />
                      <Label htmlFor={tag.code} className="text-sm">
                        {tag.nameRu}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Функциональность */}
          <Card>
            <CardHeader>
              <CardTitle>Функциональность</CardTitle>
              <CardDescription>
                Настройки возможностей шаблона
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hasBodyChat"
                  checked={formData.hasBodyChat || false}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, hasBodyChat: checked as boolean }))}
                />
                <Label htmlFor="hasBodyChat">
                  Включить чат с ИИ для правок текста
                </Label>
              </div>
              <p className="text-sm text-muted-foreground ml-6">
                Пользователи смогут использовать ИИ для редактирования и доработки текста документа
              </p>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isEnabled"
                  checked={formData.isEnabled || false}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isEnabled: checked as boolean }))}
                />
                <Label htmlFor="isEnabled">
                  Шаблон активен (доступен пользователям)
                </Label>
              </div>
              <p className="text-sm text-muted-foreground ml-6">
                Неактивные шаблоны не отображаются в каталоге пользователей
              </p>
            </CardContent>
          </Card>

          {/* Предварительный просмотр */}
          <Card>
            <CardHeader>
              <CardTitle>Предварительный просмотр</CardTitle>
              <CardDescription>
                Как шаблон будет выглядеть в каталоге
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg p-4 bg-background">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold">{formData.nameRu || "Название шаблона"}</h3>
                  <div className="flex gap-1">
                    <Badge variant="outline" className="text-xs">
                      {categories.find(c => c.code === formData.category)?.nameRu || "Категория"}
                    </Badge>
                    {formData.hasBodyChat && (
                      <Badge variant="secondary" className="text-xs">ИИ</Badge>
                    )}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  {formData.shortDescription || "Описание шаблона"}
                </p>
                <div className="flex flex-wrap gap-1">
                  {formData.tags?.map(tagCode => {
                    const tag = tags.find(t => t.code === tagCode);
                    return tag ? (
                      <Badge key={tagCode} variant="outline" className="text-xs">
                        {tag.nameRu}
                      </Badge>
                    ) : null;
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Действия */}
          <div className="flex justify-between">
            <Button variant="outline" onClick={() => router.push("/admin/templates")}>
              Отмена
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Создание..." : "Создать шаблон"}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}