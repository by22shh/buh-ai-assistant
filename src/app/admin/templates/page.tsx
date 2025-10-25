"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { templates } from "@/lib/data/templates";
import { categories, getCategoryByCode } from "@/lib/data/categories";
import { getTagByCode } from "@/lib/data/tags";
import { useUser } from "@/hooks/useUser";

export default function AdminTemplatesPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const { user, isLoading } = useUser();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/auth/login");
      return;
    }

    if (!isLoading && user && user.role !== "admin") {
      router.push("/templates");
      return;
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

  const filteredTemplates = templates.filter((template) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      template.nameRu.toLowerCase().includes(query) ||
      template.code.toLowerCase().includes(query)
    );
  });

  return (
    <div className="min-h-screen">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold">Шаблоны (Admin)</h1>
            <div className="flex gap-2">
              <Button onClick={() => router.push("/admin/templates/create")}>
                + Создать шаблон
              </Button>
              <Button variant="outline" onClick={() => router.push("/admin/access")}>
                Управление доступами
              </Button>
              <Button
                variant="outline"
                onClick={async () => {
                  await fetch('/api/auth/logout', { method: 'POST' });
                  router.push("/");
                }}
              >
                Выход
              </Button>
            </div>
          </div>

          <Input
            placeholder="Поиск по названию или коду..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-2xl"
          />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredTemplates.map((template) => {
            const category = getCategoryByCode(template.category);
            return (
              <Card key={template.code}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-lg">{template.nameRu}</CardTitle>
                    <Badge variant={template.isEnabled ? "default" : "secondary"}>
                      {template.isEnabled ? "Вкл" : "Выкл"}
                    </Badge>
                  </div>
                  <CardDescription className="text-xs font-mono">
                    {template.code}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    {template.shortDescription}
                  </p>
                  <div>
                    <Badge variant="outline" className="text-xs">
                      {category?.nameRu}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {template.tags.slice(0, 3).map((tagCode) => {
                      const tag = getTagByCode(tagCode);
                      return (
                        <Badge key={tagCode} variant="secondary" className="text-xs">
                          {tag?.nameRu}
                        </Badge>
                      );
                    })}
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => router.push(`/admin/templates/${template.code}`)}
                    >
                      Просмотр
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => router.push(`/admin/templates/${template.code}/edit`)}
                    >
                      Настройки
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </main>
    </div>
  );
}
