"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useUser } from "@/hooks/useUser";
import { mockAccess } from "@/lib/store/mockData";
import { toast } from "sonner";

export default function UserAccessPage({ params }: { params: Promise<{ userId: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const targetUserId = resolvedParams.userId;

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

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

  const accessInfo = mockAccess.getByUserId(targetUserId);

  if (!accessInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Пользователь не найден</h1>
          <Button onClick={() => router.push("/admin/access")}>
            Вернуться к списку
          </Button>
        </div>
      </div>
    );
  }

  const now = new Date();
  const currentEndDate = accessInfo.current_access.end_date
    ? new Date(accessInfo.current_access.end_date)
    : null;
  const isActive = currentEndDate ? currentEndDate > now : false;

  const handleGrantAccess = () => {
    if (!startDate || !endDate) {
      toast.error("Укажите даты начала и окончания доступа");
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start >= end) {
      toast.error("Дата окончания должна быть позже даты начала");
      return;
    }

    setLoading(true);
    try {
      mockAccess.grant(targetUserId, start.toISOString(), end.toISOString(), user.id, note);
      toast.success("Доступ предоставлен/продлён");
      setStartDate("");
      setEndDate("");
      setNote("");
      setLoading(false);
      // Обновляем страницу
      window.location.reload();
    } catch (error) {
      toast.error("Ошибка при предоставлении доступа");
      setLoading(false);
    }
  };

  const handleRevokeAccess = () => {
    if (!confirm("Вы уверены что хотите отозвать доступ?")) return;

    setLoading(true);
    try {
      mockAccess.revoke(targetUserId, user.id);
      toast.success("Доступ отозван");
      setLoading(false);
      // Обновляем страницу
      window.location.reload();
    } catch (error) {
      toast.error("Ошибка при отзыве доступа");
      setLoading(false);
    }
  };

  const handleSetToToday = () => {
    const today = new Date();
    setStartDate(today.toISOString().split('T')[0]);
  };

  const handleSetEndIn30Days = () => {
    const future = new Date();
    future.setDate(future.getDate() + 30);
    setEndDate(future.toISOString().split('T')[0]);
  };

  const handleSetEndIn90Days = () => {
    const future = new Date();
    future.setDate(future.getDate() + 90);
    setEndDate(future.toISOString().split('T')[0]);
  };

  const handleSetEndIn365Days = () => {
    const future = new Date();
    future.setDate(future.getDate() + 365);
    setEndDate(future.toISOString().split('T')[0]);
  };

  return (
    <div className="min-h-screen bg-muted/50">
      <header className="border-b bg-background">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Управление доступом пользователя</h1>
              <p className="text-sm text-muted-foreground mt-1">
                {accessInfo.email || accessInfo.phone}
              </p>
            </div>
            <Button variant="outline" onClick={() => router.push("/admin/access")}>
              Назад к списку
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Текущий статус */}
          <Card>
            <CardHeader>
              <CardTitle>Текущий статус доступа</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Badge variant={isActive ? "default" : "secondary"} className="text-base px-4 py-1">
                  {isActive ? "Доступ активен" : "Доступ истёк"}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Дата начала</p>
                  <p>
                    {accessInfo.current_access.start_date
                      ? new Date(accessInfo.current_access.start_date).toLocaleDateString("ru-RU")
                      : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Дата окончания</p>
                  <p>
                    {accessInfo.current_access.end_date
                      ? new Date(accessInfo.current_access.end_date).toLocaleDateString("ru-RU")
                      : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Обновлено</p>
                  <p>
                    {accessInfo.current_access.updated_at
                      ? new Date(accessInfo.current_access.updated_at).toLocaleString("ru-RU")
                      : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Обновил</p>
                  <p>{accessInfo.current_access.updated_by || "—"}</p>
                </div>
              </div>

              {accessInfo.current_access.admin_note && (
                <div className="pt-4 border-t">
                  <p className="text-sm font-medium text-muted-foreground mb-1">Примечание администратора</p>
                  <p className="text-sm">{accessInfo.current_access.admin_note}</p>
                </div>
              )}

              {isActive && (
                <div className="pt-4">
                  <Button variant="destructive" onClick={handleRevokeAccess} disabled={loading}>
                    Отозвать доступ
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Форма предоставления/продления доступа */}
          <Card>
            <CardHeader>
              <CardTitle>Предоставить или продлить доступ</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start_date">Дата начала *</Label>
                  <div className="flex gap-2">
                    <Input
                      id="start_date"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleSetToToday}
                    >
                      Сегодня
                    </Button>
                  </div>
                </div>
                <div>
                  <Label htmlFor="end_date">Дата окончания *</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSetEndIn30Days}
                >
                  +30 дней
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSetEndIn90Days}
                >
                  +90 дней
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSetEndIn365Days}
                >
                  +1 год
                </Button>
              </div>

              <div>
                <Label htmlFor="note">Примечание администратора</Label>
                <Textarea
                  id="note"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Причина предоставления/продления доступа"
                  rows={3}
                />
              </div>

              <Button onClick={handleGrantAccess} disabled={loading}>
                {loading ? "Сохранение..." : "Предоставить/Продлить доступ"}
              </Button>
            </CardContent>
          </Card>

          {/* История изменений */}
          <Card>
            <CardHeader>
              <CardTitle>История изменений ({accessInfo.history.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {accessInfo.history.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  История изменений пуста
                </p>
              ) : (
                <div className="space-y-4">
                  {accessInfo.history.map((record, index) => (
                    <div
                      key={index}
                      className="border rounded-lg p-4 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <Badge variant={record.action === "grant_or_extend" ? "default" : "destructive"}>
                          {record.action === "grant_or_extend" ? "Предоставлен/Продлён" : "Отозван"}
                        </Badge>
                        <p className="text-sm text-muted-foreground">
                          {new Date(record.at).toLocaleString("ru-RU")}
                        </p>
                      </div>

                      {record.action === "grant_or_extend" && (
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-muted-foreground">Начало:</span>{" "}
                            {record.start_date
                              ? new Date(record.start_date).toLocaleDateString("ru-RU")
                              : "—"}
                          </div>
                          <div>
                            <span className="text-muted-foreground">Окончание:</span>{" "}
                            {record.end_date
                              ? new Date(record.end_date).toLocaleDateString("ru-RU")
                              : "—"}
                          </div>
                        </div>
                      )}

                      <div className="text-sm">
                        <span className="text-muted-foreground">Администратор:</span> {record.by}
                      </div>

                      {record.note && (
                        <div className="text-sm bg-muted p-2 rounded">
                          <span className="text-muted-foreground">Примечание:</span> {record.note}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Информация о пользователе */}
          <Card>
            <CardHeader>
              <CardTitle>Информация о пользователе</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">User ID</p>
                  <p className="text-sm font-mono">{accessInfo.userId}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Телефон</p>
                  <p className="text-sm">{accessInfo.phone}</p>
                </div>
                {accessInfo.email && (
                  <div className="col-span-2">
                    <p className="text-sm font-medium text-muted-foreground mb-1">Email</p>
                    <p className="text-sm">{accessInfo.email}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
