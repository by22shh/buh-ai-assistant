"use client";

import { useEffect, useState, use } from "react";
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
import { ConfirmDialog } from "@/components/ConfirmDialog";

export default function AdminTemplateEditPage({ params }: { params: Promise<{ code: string }> }) {
  const router = useRouter();
  const { user, isLoading } = useUser();
  const resolvedParams = use(params);
  const templateCode = resolvedParams.code;

  const [originalTemplate, setOriginalTemplate] = useState<Template | null>(null);
  const [isFetching, setIsFetching] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

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

  useEffect(() => {
    if (originalTemplate) {
      setFormData(originalTemplate);
    }
  }, [originalTemplate]);

  // Загружаем шаблон из БД
  useEffect(() => {
    async function loadDbTemplate() {
      if (!user || user.role !== 'admin') return;
      setIsFetching(true);
      try {
        const res = await fetch(`/api/admin/templates/${templateCode}`);
        if (res.ok) {
          const dbTemplate = await res.json();
          setOriginalTemplate(dbTemplate);
          setFormData((prev) => ({ ...prev, ...dbTemplate }));
          setNotFound(false);
        } else if (res.status === 404) {
          setOriginalTemplate(null);
          setNotFound(true);
        }
      } catch (e) {
        // оставляем текущее состояние
      } finally {
        setIsFetching(false);
      }
    }
    loadDbTemplate();
  }, [user, templateCode]);

  const handleSave = async () => {
    if (!formData.nameRu || !formData.code || !formData.shortDescription) {
      toast.error("Заполните все обязательные поля");
      return;
    }

    setSaving(true);
    try {
      await api.put(`/api/admin/templates/${templateCode}`, {
        nameRu: formData.nameRu,
        shortDescription: formData.shortDescription,
        hasBodyChat: formData.hasBodyChat,
        category: formData.category,
        tags: formData.tags || [],
        isEnabled: formData.isEnabled,
        version: formData.version,
      });

      toast.success("Изменения сохранены!");
      router.push(`/admin/templates/${formData.code}`);
    } catch (error) {
      console.error('Error saving template:', error);
      const message = error instanceof Error ? error.message : "Ошибка при сохранении изменений";
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

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/api/admin/templates/${templateCode}`);
      toast.success("Шаблон удалён");
      router.push("/admin/templates");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Не удалось удалить шаблон";
      toast.error(message);
    } finally {
      setDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user || user.role !== "admin") return null;

  if (isFetching) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (notFound || !originalTemplate) {
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
              <h1 className="text-2xl font-bold">Редактирование шаблона</h1>
              <p className="text-muted-foreground">Код: {templateCode}</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="destructive"
                onClick={() => setIsDeleteOpen(true)}
              >
                Удалить
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "Сохранение..." : "Сохранить"}
              </Button>
              <Button variant="outline" onClick={() => router.push(`/admin/templates/${templateCode}`)}>
                Отмена
              </Button>
            </div>
          </div>
        </div>
      </header>

      <ConfirmDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        onConfirm={handleDelete}
        title="Удалить шаблон?"
        description="Это действие нельзя отменить. Шаблон будет окончательно удалён."
        confirmText="Удалить"
        cancelText="Отмена"
        variant="destructive"
        loading={deleting}
      />

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="grid gap-6">
          {/* Основная информация */}
          <Card>
            <CardHeader>
              <CardTitle>Основная информация</CardTitle>
              <CardDescription>
                Базовые настройки шаблона
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="code">Код шаблона *</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                    placeholder="template_code_123"
                    disabled // Обычно код не меняется
                  />
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
                <Label htmlFor="nameRu">Название *</Label>
                <Input
                  id="nameRu"
                  value={formData.nameRu}
                  onChange={(e) => setFormData(prev => ({ ...prev, nameRu: e.target.value }))}
                  placeholder="Название шаблона"
                />
              </div>

              <div>
                <Label htmlFor="shortDescription">Описание *</Label>
                <Textarea
                  id="shortDescription"
                  value={formData.shortDescription}
                  onChange={(e) => setFormData(prev => ({ ...prev, shortDescription: e.target.value }))}
                  placeholder="Краткое описание шаблона..."
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
                <Label htmlFor="category">Категория</Label>
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
                <div className="grid grid-cols-2 gap-4 mt-2">
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
            <Button variant="outline" onClick={() => router.push(`/admin/templates/${templateCode}`)}>
              Отмена
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Сохранение..." : "Сохранить изменения"}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}