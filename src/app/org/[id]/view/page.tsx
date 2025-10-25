"use client";

import { useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useUser } from "@/hooks/useUser";
import { useOrganizations } from "@/hooks/useOrganizations";

export default function OrganizationViewPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const orgId = resolvedParams.id;

  const { user, isLoading: userLoading } = useUser();
  const { getById, isLoading: orgsLoading } = useOrganizations();

  useEffect(() => {
    if (!userLoading && !user) {
      router.push("/auth/login");
    }
  }, [user, userLoading, router]);

  if (userLoading || orgsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user) return null;

  const organization = getById(orgId);

  if (!organization) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Организация не найдена</h1>
          <Button onClick={() => router.push("/org")}>
            Вернуться к списку
          </Button>
        </div>
      </div>
    );
  }

  const InfoRow = ({ label, value }: { label: string; value?: string }) => (
    <div className="grid grid-cols-3 gap-4 py-3 border-b last:border-b-0">
      <div className="text-sm font-medium text-muted-foreground">{label}</div>
      <div className="col-span-2 text-sm">{value || "—"}</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-muted/50">
      <header className="border-b bg-background">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">{organization.name_full}</h1>
              <p className="text-sm text-muted-foreground mt-1">
                {organization.subject_type === "legal_entity" ? "Юридическое лицо" : "Индивидуальный предприниматель"}
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => router.push(`/org/${orgId}/edit`)}>
                Редактировать
              </Button>
              <Button variant="outline" onClick={() => router.push("/org")}>
                Назад к списку
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Статус */}
          {organization.is_default && (
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
              <Badge variant="default" className="mb-2">Организация по умолчанию</Badge>
              <p className="text-sm text-muted-foreground">
                Эта организация автоматически выбирается при создании новых документов
              </p>
            </div>
          )}

          {/* Основная информация */}
          <Card>
            <CardHeader>
              <CardTitle>Основная информация</CardTitle>
            </CardHeader>
            <CardContent>
              <InfoRow label="Полное наименование" value={organization.name_full} />
              <InfoRow label="Краткое наименование" value={organization.name_short} />
              <InfoRow label="Тип субъекта" value={organization.subject_type === "legal_entity" ? "Юридическое лицо" : "ИП"} />
            </CardContent>
          </Card>

          {/* Реквизиты */}
          <Card>
            <CardHeader>
              <CardTitle>Реквизиты</CardTitle>
            </CardHeader>
            <CardContent>
              <InfoRow label="ИНН" value={organization.inn} />
              {organization.subject_type === "legal_entity" && (
                <>
                  <InfoRow label="КПП" value={organization.kpp} />
                  <InfoRow label="ОГРН" value={organization.ogrn} />
                </>
              )}
              {organization.subject_type === "sole_proprietor" && (
                <InfoRow label="ОГРНИП" value={organization.ogrnip} />
              )}
              <InfoRow label="ОКПО" value={organization.okpo} />
              <InfoRow label="ОКВЭД" value={organization.okved} />
            </CardContent>
          </Card>

          {/* Адреса и контакты */}
          <Card>
            <CardHeader>
              <CardTitle>Адреса и контакты</CardTitle>
            </CardHeader>
            <CardContent>
              <InfoRow label="Юридический адрес" value={organization.address_legal} />
              <InfoRow label="Почтовый адрес" value={organization.address_postal} />
              <InfoRow label="Телефон" value={organization.phone} />
              <InfoRow label="Email" value={organization.email} />
              <InfoRow label="Веб-сайт" value={organization.website} />
            </CardContent>
          </Card>

          {/* Руководитель */}
          <Card>
            <CardHeader>
              <CardTitle>Руководитель и полномочия</CardTitle>
            </CardHeader>
            <CardContent>
              <InfoRow label="Должность" value={organization.head_title} />
              <InfoRow label="ФИО" value={organization.head_fio} />
              <InfoRow label="Действует на основании" value={organization.authority_base} />
              {organization.authority_base === "Доверенности" && (
                <>
                  <InfoRow label="Номер доверенности" value={organization.poa_number} />
                  <InfoRow label="Дата доверенности" value={organization.poa_date} />
                </>
              )}
            </CardContent>
          </Card>

          {/* Банковские реквизиты */}
          <Card>
            <CardHeader>
              <CardTitle>Банковские реквизиты</CardTitle>
            </CardHeader>
            <CardContent>
              <InfoRow label="Наименование банка" value={organization.bank_name} />
              <InfoRow label="БИК" value={organization.bank_bik} />
              <InfoRow label="Корреспондентский счёт" value={organization.bank_ks} />
              <InfoRow label="Расчётный счёт" value={organization.bank_rs} />
            </CardContent>
          </Card>

          {/* Дополнительно */}
          {(organization.seal_note || organization.notes) && (
            <Card>
              <CardHeader>
                <CardTitle>Дополнительная информация</CardTitle>
              </CardHeader>
              <CardContent>
                {organization.seal_note && <InfoRow label="Примечание о печати" value={organization.seal_note} />}
                {organization.notes && <InfoRow label="Заметки" value={organization.notes} />}
              </CardContent>
            </Card>
          )}

          {/* Метаданные */}
          <Card>
            <CardHeader>
              <CardTitle>Служебная информация</CardTitle>
            </CardHeader>
            <CardContent>
              <InfoRow label="ID" value={organization.id} />
              <InfoRow
                label="Дата создания"
                value={organization.createdAt ? new Date(organization.createdAt).toLocaleString("ru-RU") : undefined}
              />
              <InfoRow
                label="Дата изменения"
                value={organization.updatedAt ? new Date(organization.updatedAt).toLocaleString("ru-RU") : undefined}
              />
            </CardContent>
          </Card>

          {/* Действия */}
          <div className="flex gap-4">
            <Button onClick={() => router.push(`/org/${orgId}/edit`)} className="flex-1">
              Редактировать организацию
            </Button>
            <Button variant="outline" onClick={() => router.push("/org")} className="flex-1">
              Вернуться к списку
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
