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
import { useUser } from "@/hooks/useUser";
import { getTemplateByCode } from "@/lib/data/templates";
import { categories } from "@/lib/data/categories";
import { tags } from "@/lib/data/tags";
import { toast } from "sonner";

export default function EditTemplatePage({ params }: { params: Promise<{ code: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const templateCode = resolvedParams.code;

  const [loading, setLoading] = useState(false);
  const template = getTemplateByCode(templateCode);

  const [formData, setFormData] = useState({
    code: template?.code || "",
    nameRu: template?.nameRu || "",
    shortDescription: template?.shortDescription || "",
    hasBodyChat: template?.hasBodyChat || false,
    category: template?.category || "",
    tags: template?.tags || [] as string[],
    isEnabled: template?.isEnabled ?? true,
    version: template?.version || "v1.0"
  });

  const { user, isLoading } = useUser();

  useEffect(() => {
    if (!isLoading && (!user || user.role !== "admin")) {
      router.push("/templates");
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user || user.role !== "admin") return null;

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // В production здесь будет API вызов для сохранения изменений
    toast.info("Функция редактирования шаблонов будет доступна в следующей версии");

    setTimeout(() => {
      setLoading(false);
      router.push(`/admin/templates/${templateCode}`);
    }, 1000);
  };

  const toggleTag = (tagCode: string) => {
    if (formData.tags.includes(tagCode)) {
      setFormData({ ...formData, tags: formData.tags.filter(t => t !== tagCode) });
    } else {
      // ТЗ: Максимум 5 тегов
      if (formData.tags.length >= 5) {
        toast.error("Максимум 5 тегов можно выбрать");
        return;
      }
      setFormData({ ...formData, tags: [...formData.tags, tagCode] });
    }
  };

  return (
    <div className="min-h-screen bg-muted/50">
      <header className="border-b bg-background">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Редактировать шаблон</h1>
              <p className="text-sm text-muted-foreground font-mono mt-1">{template.code}</p>
            </div>
            <Button variant="outline" onClick={() => router.push(`/admin/templates/${templateCode}`)}>
              Отмена
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Основная информация</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="code">Код шаблона</Label>
                <Input
                  id="code"
                  value={formData.code}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Код шаблона нельзя изменить
                </p>
              </div>

              <div>
                <Label htmlFor="nameRu">Название на русском *</Label>
                <Input
                  id="nameRu"
                  value={formData.nameRu}
                  onChange={(e) => setFormData({ ...formData, nameRu: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="shortDescription">Краткое описание *</Label>
                <Textarea
                  id="shortDescription"
                  value={formData.shortDescription}
                  onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                  required
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="category">Категория *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.code} value={cat.code}>
                        {cat.nameRu}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="version">Версия</Label>
                <Input
                  id="version"
                  value={formData.version}
                  onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                />
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="hasBodyChat"
                  checked={formData.hasBodyChat}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, hasBodyChat: checked as boolean })
                  }
                />
                <Label htmlFor="hasBodyChat">Требуется диалог с ИИ для тела документа</Label>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="isEnabled"
                  checked={formData.isEnabled}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isEnabled: checked as boolean })
                  }
                />
                <Label htmlFor="isEnabled">Шаблон активен</Label>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Теги (выбрано: {formData.tags.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {tags.map((tag) => (
                  <div key={tag.code} className="flex items-center gap-2">
                    <Checkbox
                      id={`tag-${tag.code}`}
                      checked={formData.tags.includes(tag.code)}
                      onCheckedChange={() => toggleTag(tag.code)}
                    />
                    <Label htmlFor={`tag-${tag.code}`} className="text-sm cursor-pointer">
                      {tag.nameRu}
                    </Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              <strong>Примечание:</strong> В текущей версии изменения шаблонов сохраняются только в памяти браузера.
              Для полноценного редактирования требуется подключение backend API.
            </p>
          </div>

          <div className="flex gap-4">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "Сохранение..." : "Сохранить изменения"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(`/admin/templates/${templateCode}`)}
              className="flex-1"
            >
              Отмена
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
