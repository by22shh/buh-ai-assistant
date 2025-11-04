"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { useDocuments } from "@/hooks/useDocuments";
import { useOrganizations } from "@/hooks/useOrganizations";
import { useUser } from "@/hooks/useUser";
import { getTemplateByCode } from "@/lib/data/templates";
import { toast } from "sonner";
import { FileText, Download, Eye, Search } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { DocumentPreview } from "@/components/DocumentPreview";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// Подтягиваем список шаблонов из БД для фильтров и отображения
import { DocumentListSkeleton, DocumentTableRowSkeleton } from "@/components/skeletons/DocumentSkeleton";

export default function DocumentsArchivePage() {
  const router = useRouter();
  const { user, isLoading: userLoading } = useUser();
  const { documents: allDocuments, isLoading: docsLoading, error: docsError } = useDocuments();
  const { organizations: userOrganizations, isLoading: orgsLoading } = useOrganizations();
  const [previewDocId, setPreviewDocId] = useState<string | null>(null);
  const [dbTemplates, setDbTemplates] = useState<any[]>([]);

  // Поиск и фильтры
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTemplate, setFilterTemplate] = useState<string>("all");
  const [filterOrg, setFilterOrg] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"date" | "name">("date");

  // Redirect if not logged in
  if (!userLoading && !user) {
    router.push("/auth/login");
    return null;
  }

  // Loading state
  if (userLoading || docsLoading || orgsLoading) {
    return (
      <div className="min-h-screen bg-muted/50">
        <header className="border-b bg-background">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <h1 className="text-xl md:text-2xl font-bold">Мой архив документов</h1>
              <div className="flex gap-2">
                <ThemeToggle />
                <Button disabled size="sm">Шаблоны</Button>
                <Button variant="outline" disabled size="sm">Выход</Button>
              </div>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          {/* Mobile skeleton */}
          <div className="block md:hidden">
            <DocumentListSkeleton />
          </div>

          {/* Desktop skeleton */}
          <div className="hidden md:block border rounded-lg bg-background overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Название</TableHead>
                  <TableHead>Шаблон</TableHead>
                  <TableHead>Версия</TableHead>
                  <TableHead>Организация</TableHead>
                  <TableHead>Создан</TableHead>
                  <TableHead className="text-right">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[1, 2, 3, 4].map((i) => (
                  <DocumentTableRowSkeleton key={i} />
                ))}
              </TableBody>
            </Table>
          </div>
        </main>
      </div>
    );
  }

  // User not found (shouldn't happen after redirect)
  if (!user) return null;

  // Error state
  if (docsError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <div className="p-6 text-center">
            <p className="text-destructive mb-4">Ошибка загрузки: {docsError}</p>
            <Button onClick={() => window.location.reload()}>
              Перезагрузить
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Load templates from DB for filters and labels
  useEffect(() => {
    async function loadTemplates() {
      try {
        const res = await fetch('/api/templates');
        if (res.ok) {
          const list = await res.json();
          setDbTemplates(list);
        }
      } catch (e) {}
    }
    loadTemplates();
  }, []);

  // Фильтрация и сортировка
  const documents = allDocuments
    .filter((doc) => {
      // Поиск по названию
      if (searchQuery) {
        const template = getTemplateByCode(doc.templateCode) || dbTemplates.find(t => t.code === doc.templateCode);
        const searchLower = searchQuery.toLowerCase();
        const titleMatch = doc.title?.toLowerCase().includes(searchLower);
        const templateMatch = template?.nameRu.toLowerCase().includes(searchLower);
        if (!titleMatch && !templateMatch) return false;
      }

      // Фильтр по шаблону
      if (filterTemplate !== "all" && doc.templateCode !== filterTemplate) {
        return false;
      }

      // Фильтр по организации
      if (filterOrg !== "all" && doc.organizationId !== filterOrg) {
        return false;
      }

      return true;
    })
    .sort((a, b) => {
      if (sortBy === "date") {
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      } else {
        const aTitle = a.title || (getTemplateByCode(a.templateCode)?.nameRu || dbTemplates.find(t => t.code === a.templateCode)?.nameRu || "");
        const bTitle = b.title || (getTemplateByCode(b.templateCode)?.nameRu || dbTemplates.find(t => t.code === b.templateCode)?.nameRu || "");
        return aTitle.localeCompare(bTitle);
      }
    });

  const handleDownload = async (docId: string, format: "docx" | "pdf") => {
    const doc = documents.find(d => d.id === docId);
    if (!doc) {
      toast.error('Документ не найден');
      return;
    }

    const template = getTemplateByCode(doc.templateCode);
    const organization = doc.organizationId
      ? userOrganizations.find(o => o.id === doc.organizationId)
      : null;

    toast.loading(`Генерация ${format.toUpperCase()}...`);

    try {
      const endpoint = format === 'docx'
        ? '/api/documents/generate-docx'
        : '/api/documents/generate-pdf';

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bodyText: doc.bodyText || 'Текст документа не найден',
          requisites: doc.requisites || {},
          templateName: template?.nameRu || doc.templateCode,
          organization: organization
        })
      });

      if (!response.ok) {
        throw new Error('Ошибка генерации документа');
      }

      // Получаем blob
      const blob = await response.blob();

      // Создаём ссылку для скачивания
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${template?.nameRu || 'document'}_${Date.now()}.${format}`;
      document.body.appendChild(a);
      a.click();

      // Очищаем
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success(`Файл ${format.toUpperCase()} скачан`);
    } catch (error) {
      console.error('Download error:', error);
      toast.error(`Ошибка при скачивании ${format.toUpperCase()}`);
    }
  };

  return (
    <div className="min-h-screen bg-muted/50">
      <header className="border-b bg-background">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl md:text-2xl font-bold">Мой архив документов</h1>
            <div className="flex gap-2">
              <ThemeToggle />
              <Button onClick={() => router.push("/templates")} size="sm" className="md:size-default">
                <span className="hidden sm:inline">К шаблонам</span>
                <span className="sm:hidden">Шаблоны</span>
              </Button>
              <Button variant="outline" onClick={() => router.push("/profile")} size="sm" className="hidden sm:inline-flex md:size-default">
                Профиль
              </Button>
              <Button
                variant="outline"
                onClick={async () => {
                  await fetch('/api/auth/logout', { method: 'POST' });
                  router.push("/");
                }}
                size="sm"
                className="md:size-default"
              >
                Выход
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Поиск и фильтры */}
        {allDocuments.length > 0 && (
          <Card className="p-4 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Поиск */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Поиск по названию..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Фильтр по шаблону */}
              <Select value={filterTemplate} onValueChange={setFilterTemplate}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="Все шаблоны" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все шаблоны</SelectItem>
                  {(dbTemplates.length ? dbTemplates : []).map((t: any) => (
                    <SelectItem key={t.code} value={t.code}>
                      {t.nameRu}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Фильтр по организации */}
              <Select value={filterOrg} onValueChange={setFilterOrg}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="Все организации" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все организации</SelectItem>
                  {userOrganizations.filter(org => org.id).map((org) => (
                    <SelectItem key={org.id!} value={org.id!}>
                      {org.name_short || org.name_full}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Сортировка */}
              <Select value={sortBy} onValueChange={(val) => setSortBy(val as "date" | "name")}>
                <SelectTrigger className="w-full md:w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">По дате ↓</SelectItem>
                  <SelectItem value="name">По названию ↑</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Результаты поиска */}
            {(searchQuery || filterTemplate !== "all" || filterOrg !== "all") && (
              <div className="mt-3 text-sm text-muted-foreground">
                Найдено документов: {documents.length} из {allDocuments.length}
                {(searchQuery || filterTemplate !== "all" || filterOrg !== "all") && (
                  <Button
                    variant="link"
                    size="sm"
                    className="ml-2 h-auto p-0"
                    onClick={() => {
                      setSearchQuery("");
                      setFilterTemplate("all");
                      setFilterOrg("all");
                    }}
                  >
                    Сбросить фильтры
                  </Button>
                )}
              </div>
            )}
          </Card>
        )}

        {documents.length === 0 && allDocuments.length === 0 ? (
          <Card className="p-12 text-center">
            <FileText className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">У вас пока нет документов</h2>
            <p className="text-muted-foreground mb-6">
              Создайте свой первый документ из каталога шаблонов
            </p>
            <Button onClick={() => router.push("/templates")}>
              Вернуться к выбору шаблона
            </Button>
          </Card>
        ) : documents.length === 0 && allDocuments.length > 0 ? (
          <Card className="p-12 text-center">
            <Search className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Документы не найдены</h2>
            <p className="text-muted-foreground mb-6">
              По выбранным фильтрам нет документов. Попробуйте изменить параметры поиска.
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery("");
                setFilterTemplate("all");
                setFilterOrg("all");
              }}
            >
              Сбросить фильтры
            </Button>
          </Card>
        ) : (
          <>
            {/* Мобильная версия - карточки */}
            <div className="block md:hidden space-y-4">
              {documents.map((doc) => {
                const template = getTemplateByCode(doc.templateCode) || dbTemplates.find(t => t.code === doc.templateCode);
                const organization = doc.organizationId
                  ? userOrganizations.find(o => o.id === doc.organizationId)
                  : null;

                return (
                  <Card key={doc.id} className="p-4">
                    <div className="space-y-3">
                      <div>
                        <h3 className="font-semibold">{doc.title || `${template?.nameRu || doc.templateCode}`}</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {template?.nameRu || doc.templateCode}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {doc.templateVersion}
                        </code>
                        {organization && (
                          <span className="text-xs bg-muted px-2 py-1 rounded">
                            {organization.name_short || organization.name_full}
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-muted-foreground">
                        {doc.createdAt
                          ? new Date(doc.createdAt).toLocaleString("ru-RU", {
                              year: "numeric",
                              month: "2-digit",
                              day: "2-digit",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "—"}
                      </div>

                      <div className="flex flex-col gap-2 pt-2">
                        <Button
                          size="sm"
                          onClick={() => setPreviewDocId(doc.id)}
                          className="w-full"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Предпросмотр
                        </Button>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDownload(doc.id, "docx")}
                            className="flex-1"
                          >
                            <Download className="w-4 h-4 mr-1" />
                            DOCX
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDownload(doc.id, "pdf")}
                            className="flex-1"
                          >
                            <Download className="w-4 h-4 mr-1" />
                            PDF
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>

            {/* Десктопная версия - таблица */}
            <div className="hidden md:block border rounded-lg bg-background overflow-hidden">
              <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Название</TableHead>
                  <TableHead>Шаблон</TableHead>
                  <TableHead>Версия</TableHead>
                  <TableHead>Организация</TableHead>
                  <TableHead>Создан</TableHead>
                  <TableHead className="text-right">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map((doc) => {
                  const template = getTemplateByCode(doc.templateCode);
                  const organization = doc.organizationId
                    ? userOrganizations.find(o => o.id === doc.organizationId)
                    : null;

                  return (
                    <TableRow key={doc.id}>
                      <TableCell className="font-medium">
                        {doc.title || `${template?.nameRu || doc.templateCode}`}
                      </TableCell>
                      <TableCell>
                        {template?.nameRu || doc.templateCode}
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {doc.templateVersion}
                        </code>
                      </TableCell>
                      <TableCell>
                        {organization?.name_short || organization?.name_full || "—"}
                      </TableCell>
                      <TableCell>
                        {doc.createdAt
                          ? new Date(doc.createdAt).toLocaleString("ru-RU", {
                              year: "numeric",
                              month: "2-digit",
                              day: "2-digit",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            size="sm"
                            onClick={() => setPreviewDocId(doc.id)}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            Предпросмотр
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDownload(doc.id, "docx")}
                          >
                            <Download className="w-4 h-4 mr-1" />
                            DOCX
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDownload(doc.id, "pdf")}
                          >
                            <Download className="w-4 h-4 mr-1" />
                            PDF
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            </div>
          </>
        )}

        {documents.length > 0 && (
          <div className="mt-6 text-center text-sm text-muted-foreground">
            <p>Всего документов: {documents.length}</p>
          </div>
        )}
      </main>

      {/* Предпросмотр документа */}
      {previewDocId && (() => {
        const doc = documents.find(d => d.id === previewDocId);
        if (!doc) return null;

                  const template = getTemplateByCode(doc.templateCode) || dbTemplates.find(t => t.code === doc.templateCode);
        const organization = doc.organizationId
          ? userOrganizations.find(o => o.id === doc.organizationId)
          : null;

        return (
          <DocumentPreview
            open={!!previewDocId}
            onOpenChange={(open) => !open && setPreviewDocId(null)}
            templateName={template?.nameRu || doc.templateCode}
            templateVersion={doc.templateVersion}
            bodyText={doc.bodyText || ""}
            requisites={doc.requisites || {}}
            organization={organization}
            onDownloadDOCX={() => {
              setPreviewDocId(null);
              handleDownload(doc.id, "docx");
            }}
            onDownloadPDF={() => {
              setPreviewDocId(null);
              handleDownload(doc.id, "pdf");
            }}
          />
        );
      })()}
    </div>
  );
}
