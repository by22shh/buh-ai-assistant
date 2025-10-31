"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useUser } from "@/hooks/useUser";
import { templates, getTemplateByCode } from "@/lib/data/templates";
import { categories, getCategoryByCode } from "@/lib/data/categories";
import { tags, getTagByCode } from "@/lib/data/tags";

export default function AdminTemplateViewPage({ params }: { params: Promise<{ code: string }> }) {
  const router = useRouter();
  const { user, isLoading } = useUser();
  const resolvedParams = use(params);
  const templateCode = resolvedParams.code;

  const [template, setTemplate] = useState(getTemplateByCode(templateCode));

  useEffect(() => {
    async function loadDbTemplate() {
      if (!user || user.role !== 'admin') return;
      try {
        const res = await fetch(`/api/admin/templates/${templateCode}`);
        if (res.ok) {
          const dbTemplate = await res.json();
          setTemplate((prev: any) => ({ ...prev, ...dbTemplate }));
          return;
        }
      } catch (e) {}
    }
    loadDbTemplate();
  }, [user, templateCode]);

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

  const category = getCategoryByCode(template.category);
  const templateTags = template.tags.map(tagCode => getTagByCode(tagCode)).filter(Boolean);

  return (
    <div className="min-h-screen bg-muted/50">
      <header className="border-b bg-background">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">{template.nameRu}</h1>
              <p className="text-muted-foreground">Код: {template.code}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => router.push(`/admin/templates/${template.code}/edit`)}>
                Редактировать
              </Button>
              <Button variant="outline" onClick={() => router.push(`/admin/templates/${template.code}/requisites`)}>
                Настройка реквизитов
              </Button>
              <Button variant="outline" onClick={() => router.push("/admin/templates")}>
                Назад к списку
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
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-1">Название</h4>
                  <p>{template.nameRu}</p>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-1">Код шаблона</h4>
                  <p className="font-mono text-sm">{template.code}</p>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-1">Описание</h4>
                <p>{template.shortDescription}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-1">Категория</h4>
                  <Badge variant="secondary">
                    {category?.nameRu || template.category}
                  </Badge>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-1">Версия</h4>
                  <Badge variant="outline">{template.version}</Badge>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-2">Теги</h4>
                <div className="flex flex-wrap gap-2">
                  {templateTags.map((tag) => (
                    <Badge key={tag?.code} variant="outline" className="text-xs">
                      {tag?.nameRu}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-1">Чат с ИИ</h4>
                  <Badge variant={template.hasBodyChat ? "default" : "secondary"}>
                    {template.hasBodyChat ? "Включен" : "Отключен"}
                  </Badge>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-1">Статус</h4>
                  <Badge variant={template.isEnabled ? "default" : "destructive"}>
                    {template.isEnabled ? "Активен" : "Отключен"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Техническая информация */}
          <Card>
            <CardHeader>
              <CardTitle>Техническая информация</CardTitle>
              <CardDescription>
                Данные для разработчиков и системных администраторов
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-1">JSON представление</h4>
                <pre className="bg-muted p-4 rounded-lg text-xs overflow-auto">
                  {JSON.stringify(template, null, 2)}
                </pre>
              </div>
            </CardContent>
          </Card>

          {/* Действия */}
          <Card>
            <CardHeader>
              <CardTitle>Действия</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => router.push(`/admin/templates/${template.code}/edit`)}>
                  Редактировать шаблон
                </Button>
                <Button variant="outline" onClick={() => router.push(`/admin/templates/${template.code}/requisites`)}>
                  Настроить реквизиты
                </Button>
                <Button variant="outline" onClick={() => router.push("/templates")}>
                  Посмотреть как пользователь
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}