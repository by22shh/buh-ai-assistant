"use client";

import { useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useUser } from "@/hooks/useUser";
import { getTemplateByCode } from "@/lib/data/templates";
import { getCategoryByCode } from "@/lib/data/categories";
import { getTagByCode } from "@/lib/data/tags";

export default function TemplateViewPage({ params }: { params: Promise<{ code: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const templateCode = resolvedParams.code;

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

  const category = getCategoryByCode(template.category);

  return (
    <div className="min-h-screen bg-muted/50">
      <header className="border-b bg-background">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">{template.nameRu}</h1>
              <p className="text-sm text-muted-foreground font-mono mt-1">{template.code}</p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => router.push(`/admin/templates/${template.code}/edit`)}
              >
                Редактировать
              </Button>
              <Button variant="outline" onClick={() => router.push("/admin/templates")}>
                Назад
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Основная информация</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Название</Label>
                <p className="text-lg font-medium">{template.nameRu}</p>
              </div>

              <div>
                <Label>Код шаблона</Label>
                <p className="font-mono text-sm">{template.code}</p>
              </div>

              <div>
                <Label>Описание</Label>
                <p className="text-muted-foreground">{template.shortDescription}</p>
              </div>

              <div>
                <Label>Категория</Label>
                <div className="mt-1">
                  <Badge variant="outline">{category?.nameRu}</Badge>
                </div>
              </div>

              <div>
                <Label>Версия</Label>
                <p>{template.version}</p>
              </div>

              <div>
                <Label>Статус</Label>
                <div className="mt-1">
                  <Badge variant={template.isEnabled ? "default" : "secondary"}>
                    {template.isEnabled ? "Активен" : "Отключен"}
                  </Badge>
                </div>
              </div>

              <div>
                <Label>Диалог с ИИ</Label>
                <div className="mt-1">
                  <Badge variant={template.hasBodyChat ? "default" : "secondary"}>
                    {template.hasBodyChat ? "Требуется" : "Не требуется"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Теги ({template.tags.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {template.tags.map((tagCode) => {
                  const tag = getTagByCode(tagCode);
                  return (
                    <Badge key={tagCode} variant="secondary">
                      {tag?.nameRu}
                    </Badge>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button
              onClick={() => router.push(`/admin/templates/${template.code}/edit`)}
              className="flex-1"
            >
              Редактировать шаблон
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push(`/admin/templates/${template.code}/requisites`)}
              className="flex-1"
            >
              Настроить реквизиты
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <p className="text-sm font-medium text-muted-foreground mb-1">{children}</p>;
}
