"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useUser } from "@/hooks/useUser";
import { categories } from "@/lib/data/categories";
import { tags } from "@/lib/data/tags";
import { toast } from "sonner";

export default function CreateTemplatePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    code: "",
    nameRu: "",
    shortDescription: "",
    hasBodyChat: false,
    category: "",
    tags: [] as string[],
    isEnabled: true,
    version: "v1.0"
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // В production здесь будет API вызов
    toast.info("Функция создания шаблонов будет доступна в следующей версии");
    setTimeout(() => {
      setLoading(false);
      router.push("/admin/templates");
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
            <h1 className="text-2xl font-bold">Создать шаблон</h1>
            <Button variant="outline" onClick={() => router.push("/admin/templates")}>
              Назад к шаблонам
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
                <Label htmlFor="code">Код шаблона *</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="payment_order"
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Латиница, цифры и подчеркивания. Например: payment_order
                </p>
              </div>

              <div>
                <Label htmlFor="nameRu">Название на русском *</Label>
                <Input
                  id="nameRu"
                  value={formData.nameRu}
                  onChange={(e) => setFormData({ ...formData, nameRu: e.target.value })}
                  placeholder="Платёжное поручение"
                  required
                />
              </div>

              <div>
                <Label htmlFor="shortDescription">Краткое описание *</Label>
                <Textarea
                  id="shortDescription"
                  value={formData.shortDescription}
                  onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                  placeholder="Нужно для оформления безналичного перевода..."
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
                    <SelectValue placeholder="Выберите категорию" />
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
                  placeholder="v1.0"
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

          <div className="flex gap-4">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "Создание..." : "Создать шаблон"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/admin/templates")}
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
