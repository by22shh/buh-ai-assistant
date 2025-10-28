"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useUser } from "@/hooks/useUser";
// TODO: Реализовать API для управления доступом пользователей
// import { mockAccess } from "@/lib/store/mockData";

export default function AdminAccessPage() {
  const router = useRouter();
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

  // TODO: Загружать данные доступа через API
  const accessRecords: any[] = [];

  return (
    <div className="min-h-screen">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Управление доступом/тарифом</h1>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => router.push("/admin/templates")}>
                К шаблонам
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
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {accessRecords.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-lg text-muted-foreground">
              Нет записей о доступах
            </p>
          </div>
        ) : (
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email/Телефон</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead>Последнее изменение</TableHead>
                  <TableHead className="text-right">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {accessRecords.map((record) => {
                  const now = new Date();
                  const endDate = record.current_access.end_date
                    ? new Date(record.current_access.end_date)
                    : null;
                  const isActive = endDate ? endDate > now : false;

                  return (
                    <TableRow key={record.userId}>
                      <TableCell>
                        <div>
                          {record.email || "—"}
                          <p className="text-sm text-muted-foreground">{record.phone}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={isActive ? "default" : "secondary"}>
                          {isActive
                            ? `Активен до ${endDate?.toLocaleDateString("ru-RU")}`
                            : record.current_access.end_date
                            ? "Доступ истёк"
                            : "Нет доступа"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {record.current_access.updated_at
                          ? new Date(record.current_access.updated_at).toLocaleDateString(
                              "ru-RU"
                            )
                          : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => router.push(`/admin/access/${record.userId}`)}
                        >
                          Открыть
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </main>
    </div>
  );
}
