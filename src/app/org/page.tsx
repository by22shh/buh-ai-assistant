"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useOrganizations } from "@/hooks/useOrganizations";
import { useUser } from "@/hooks/useUser";
import { OrganizationListSkeleton } from "@/components/skeletons/OrganizationSkeleton";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Trash2 } from "lucide-react";

export default function OrganizationsPage() {
  const router = useRouter();
  const { user, isLoading: userLoading } = useUser();
  const { organizations, isLoading, error, deleteOrganization } = useOrganizations();
  const [deleteOrgId, setDeleteOrgId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!userLoading && !user) {
      router.push("/auth/login");
    }
  }, [user, userLoading, router]);

  if (userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user) return null;

  const handleDelete = async () => {
    if (!deleteOrgId) return;

    setDeleting(true);
    try {
      await deleteOrganization(deleteOrgId);
      setDeleteOrgId(null);
    } catch (error) {
      // Ошибка уже обработана в hook
    } finally {
      setDeleting(false);
    }
  };

  const deleteOrg = organizations.find(org => org.id === deleteOrgId);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen">
        <header className="border-b">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold">Мои организации</h1>
              <div className="flex gap-2">
                <Button disabled>Создать организацию</Button>
                <Button variant="outline" disabled>К шаблонам</Button>
              </div>
            </div>
          </div>
        </header>
        <main className="container mx-auto px-4 py-8">
          <OrganizationListSkeleton />
        </main>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <p className="text-destructive mb-4">Ошибка загрузки: {error}</p>
            <Button onClick={() => window.location.reload()}>
              Перезагрузить
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Мои организации</h1>
            <div className="flex gap-2">
              <Button onClick={() => router.push("/org/create")}>
                Создать организацию
              </Button>
              <Button variant="outline" onClick={() => router.push("/templates")}>
                К шаблонам
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {organizations.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-lg text-muted-foreground mb-4">
              У вас пока нет организаций
            </p>
            <Button onClick={() => router.push("/org/create")}>
              Создать организацию
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {organizations.map((org) => (
              <Card key={org.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-xl font-semibold">{org.name_full}</h3>
                        {org.is_default && (
                          <Badge variant="default">По умолчанию</Badge>
                        )}
                      </div>
                      {org.name_short && (
                        <p className="text-muted-foreground text-sm mb-2">{org.name_short}</p>
                      )}
                      <div className="text-sm text-muted-foreground">
                        <p>ИНН: {org.inn}</p>
                        <p>{org.email}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => router.push(`/org/${org.id}/view`)}
                      >
                        Открыть
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => router.push(`/org/${org.id}/edit`)}
                      >
                        Редактировать
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setDeleteOrgId(org.id!)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        open={!!deleteOrgId}
        onOpenChange={(open) => !open && setDeleteOrgId(null)}
        onConfirm={handleDelete}
        title="Удалить организацию?"
        description={`Вы уверены, что хотите удалить "${deleteOrg?.name_full}"? Это действие нельзя отменить. Все документы этой организации останутся в архиве.`}
        confirmText="Удалить"
        cancelText="Отмена"
        variant="destructive"
        loading={deleting}
      />
    </div>
  );
}
