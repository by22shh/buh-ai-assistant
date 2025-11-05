"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
// Переводим каталог на загрузку из БД через публичный API
import { categories, getCategoryByCode } from "@/lib/data/categories";
import { tags, getTagByCode } from "@/lib/data/tags";
import { useUser } from "@/hooks/useUser";
import { useDocuments } from "@/hooks/useDocuments";

export default function TemplatesPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<"az" | "date">("az");

  const { user, isLoading } = useUser();
  const { createDocument } = useDocuments();

  // Проверка авторизации
  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/auth/login");
    }
  }, [user, isLoading, router]);

  // Loading state
  if (isLoading) {
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

  const demoStatus = user.demoStatus;

  const [templatesFromDb, setTemplatesFromDb] = useState<any[]>([]);

  useEffect(() => {
    async function loadTemplates() {
      try {
        const res = await fetch('/api/templates');
        if (res.ok) {
          const list = await res.json();
          setTemplatesFromDb(list);
        }
      } catch (e) {}
    }
    loadTemplates();
  }, []);

  // Фильтрация шаблонов
  const filteredTemplates = templatesFromDb.filter((template) => {
    if (!template.isEnabled) return false;

    // Поиск
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesName = template.nameRu.toLowerCase().includes(query);
      const matchesDesc = template.shortDescription.toLowerCase().includes(query);
      const matchesTags = template.tags.some((tagCode: string) => {
        const tag = getTagByCode(tagCode);
        return tag?.nameRu.toLowerCase().includes(query);
      });
      if (!matchesName && !matchesDesc && !matchesTags) return false;
    }

    // Категория
    if (selectedCategory && template.category !== selectedCategory) {
      return false;
    }

    // Теги (AND-логика)
    if (selectedTags.length > 0) {
      if (!selectedTags.every((tag) => template.tags.includes(tag))) {
        return false;
      }
    }

    return true;
  });

  // Сортировка
  const sortedTemplates = [...filteredTemplates].sort((a, b) => {
    if (sortBy === "az") {
      return a.nameRu.localeCompare(b.nameRu, "ru");
    }
    return 0; // По дате обновления (пока не реализовано)
  });

  const handleTemplateSelect = async (templateCode: string) => {
    const template = templatesFromDb.find((t) => t.code === templateCode);
    if (!template) return;

    // Проверка доступа: сначала временный доступ, затем демо-лимит
    // Если пользователь - админ, пропускаем проверку
    if (user.role !== "admin") {
      // Проверяем временный доступ (приоритет над демо-лимитом)
      const now = new Date();
      const hasTemporaryAccess = user.accessUntil && new Date(user.accessUntil) > now;
      
      // Если нет временного доступа - проверяем демо-лимит
      if (!hasTemporaryAccess && demoStatus && !demoStatus.isActive) {
        router.push("/trial/expired");
        return;
      }
    }

    // Создаём документ в БД и переходим по реальному id
    try {
      const created = await createDocument({
        templateCode: template.code,
        templateVersion: template.version,
        title: template.nameRu,
        hasBodyChat: !!template.hasBodyChat,
      } as any);

      const newId = (created as any)?.id;
      if (!newId) {
        // Если по какой-то причине id не вернулся, уходим в архив
        router.push('/docs');
        return;
      }

      if (template.hasBodyChat) {
        router.push(`/doc/${newId}/body?template=${templateCode}`);
      } else {
        router.push(`/doc/${newId}/requisites?template=${templateCode}`);
      }
    } catch (e) {
      // Ошибка уже показана хуком
    }
  };

  const toggleTag = (tagCode: string) => {
    if (selectedTags.includes(tagCode)) {
      setSelectedTags(selectedTags.filter((t) => t !== tagCode));
    } else {
      if (selectedTags.length < 5) {
        setSelectedTags([...selectedTags, tagCode]);
      }
    }
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory(null);
    setSelectedTags([]);
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold">Шаблоны</h1>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => router.push("/docs")}>
                Мой архив
              </Button>
              <Button variant="outline" onClick={() => router.push("/org")}>
                Организации
              </Button>
              <Button variant="outline" onClick={() => router.push("/profile")}>
                Профиль
              </Button>
            </div>
          </div>

          {/* Демо-статус */}
          {user.role !== "admin" && demoStatus && (
            <div className="bg-muted/50 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">
                    {demoStatus.isActive ? "Демо-доступ активен" : "Демо-доступ истек"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Использовано {demoStatus.documentsUsed} из {demoStatus.documentsLimit} документов
                  </p>
                </div>
              </div>
              <div className="mt-2 w-full bg-muted-foreground/20 rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all"
                  style={{
                    width: `${Math.min((demoStatus.documentsUsed / demoStatus.documentsLimit) * 100, 100)}%`
                  }}
                />
              </div>
            </div>
          )}

          {/* Поиск */}
          <div className="mb-4">
            <Input
              placeholder="Поиск по названию, описанию или тегам..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-2xl"
            />
          </div>

          {/* Категории */}
          <div className="mb-4">
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedCategory === null ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(null)}
              >
                Все
              </Button>
              {categories.map((cat) => (
                <Button
                  key={cat.code}
                  variant={selectedCategory === cat.code ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(cat.code)}
                >
                  {cat.nameRu}
                </Button>
              ))}
            </div>
          </div>

          {/* Теги */}
          <div className="mb-4">
            <p className="text-sm font-medium mb-2">Фильтр по тегам (выбрано: {selectedTags.length}/5):</p>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <Button
                  key={tag.code}
                  variant={selectedTags.includes(tag.code) ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleTag(tag.code)}
                  disabled={selectedTags.length >= 5 && !selectedTags.includes(tag.code)}
                >
                  {tag.nameRu}
                </Button>
              ))}
            </div>
          </div>

          {/* Кнопка сброса фильтров */}
          {(searchQuery || selectedCategory || selectedTags.length > 0) && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Сбросить фильтры
            </Button>
          )}
        </div>
      </header>

      {/* Шаблоны */}
      <main className="container mx-auto px-4 py-8">
        {sortedTemplates.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-lg text-muted-foreground mb-4">
              Ничего не найдено
            </p>
            <Button onClick={clearFilters}>Сбросить фильтры</Button>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6">
            {sortedTemplates.map((template) => {
              const category = getCategoryByCode(template.category);
              return (
                <Card key={template.code} className="flex flex-col">
                  <CardHeader>
                    <CardTitle className="text-lg">{template.nameRu}</CardTitle>
                    <CardDescription className="text-sm">
                      {template.shortDescription}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col">
                    <div className="space-y-3 flex-1">
                      <div>
                        <Badge variant="outline">{category?.nameRu}</Badge>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {template.tags.slice(0, 5).map((tagCode: string) => {
                          const tag = getTagByCode(tagCode);
                          return (
                            <Badge key={tagCode} variant="secondary" className="text-xs">
                              {tag?.nameRu}
                            </Badge>
                          );
                        })}
                      </div>
                    </div>
                    <Button
                      className="w-full mt-4"
                      onClick={() => handleTemplateSelect(template.code)}
                    >
                      Использовать документ
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
