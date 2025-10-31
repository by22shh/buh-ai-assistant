"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useUser } from "@/hooks/useUser";
import { toast } from "sonner";

interface UserAccessData {
  userId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  current_access: {
    status: 'active' | 'inactive';
    start_date?: string;
    end_date?: string;
    updated_at?: string;
    updated_by?: string;
    admin_note?: string;
  };
  history: Array<{
    at: string;
    action: string;
    start_date?: string;
    end_date?: string;
    by: string;
    note?: string;
  }>;
  demoStatus?: {
    documentsUsed: number;
    documentsLimit: number;
    isActive: boolean;
  };
}

export default function UserAccessCardPage({ params }: { params: Promise<{ userId: string }> }) {
  const router = useRouter();
  const { user, isLoading: userLoading } = useUser();
  const resolvedParams = use(params);
  const userId = resolvedParams.userId;

  const [userData, setUserData] = useState<UserAccessData | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showRevokeDialog, setShowRevokeDialog] = useState(false);

  // Форма управления доступом
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [comment, setComment] = useState("");

  useEffect(() => {
    if (!userLoading && (!user || user.role !== "admin")) {
      router.push("/templates");
    }
  }, [user, userLoading, router]);

  useEffect(() => {
    if (user && user.role === "admin" && userId) {
      loadUserData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, userId]);

  const loadUserData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/access/${userId}`);
      if (!response.ok) {
        throw new Error('Ошибка при загрузке данных пользователя');
      }
      const data = await response.json();
      setUserData(data);

      // Заполняем форму текущими данными
      if (data.current_access.start_date) {
        setStartDate(new Date(data.current_access.start_date).toISOString().split('T')[0]);
      } else {
        setStartDate(new Date().toISOString().split('T')[0]);
      }

      if (data.current_access.end_date) {
        setEndDate(new Date(data.current_access.end_date).toISOString().split('T')[0]);
      }

      setComment(data.current_access.admin_note || "");
    } catch (error) {
      console.error('Error loading user data:', error);
      toast.error('Ошибка при загрузке данных пользователя');
    } finally {
      setLoading(false);
    }
  };

  const handleGrantAccess = async () => {
    if (!endDate) {
      toast.error('Укажите дату окончания доступа');
      return;
    }

    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);

    if (endDateObj <= startDateObj) {
      toast.error('Дата окончания должна быть не раньше даты начала');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`/api/admin/access/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          start_date: startDateObj.toISOString(),
          end_date: endDateObj.toISOString(),
          admin_note: comment,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка при сохранении доступа');
      }

      const data = await response.json();
      toast.success('Доступ успешно предоставлен');
      
      // Перезагружаем данные пользователя
      await loadUserData();
    } catch (error) {
      console.error('Error granting access:', error);
      toast.error(error instanceof Error ? error.message : 'Ошибка при предоставлении доступа');
    } finally {
      setSaving(false);
    }
  };

  const handleRevokeAccess = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/admin/access/${userId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          comment: 'Доступ отключен администратором',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка при отключении доступа');
      }

      toast.success('Доступ успешно отключен');
      
      // Перезагружаем данные пользователя
      await loadUserData();
      setShowRevokeDialog(false);
    } catch (error) {
      console.error('Error revoking access:', error);
      toast.error(error instanceof Error ? error.message : 'Ошибка при отключении доступа');
    } finally {
      setSaving(false);
    }
  };

  if (userLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user || user.role !== "admin") return null;

  if (!userData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-muted-foreground">Пользователь не найден</p>
          <Button onClick={() => router.push("/admin/access")} className="mt-4">
            Назад к списку
          </Button>
        </div>
      </div>
    );
  }

  const isActive = userData.current_access.status === 'active';
  const userName = userData.firstName && userData.lastName 
    ? `${userData.firstName} ${userData.lastName}`
    : userData.email;

  return (
    <>
      <div className="min-h-screen bg-muted/50">
        <header className="border-b bg-background">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">{userName}</h1>
                <p className="text-muted-foreground">{userData.email}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => router.push("/admin/access")}>
                  Назад к списку
                </Button>
              </div>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="grid gap-6">
            {/* Текущий статус */}
            <Card>
              <CardHeader>
                <CardTitle>Текущий статус</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge variant={isActive ? "default" : "secondary"}>
                    {isActive ? "Активен" : "Неактивен"}
                  </Badge>
                  {userData.current_access.end_date && (
                    <span className="text-sm text-muted-foreground">
                      до {new Date(userData.current_access.end_date).toLocaleDateString('ru-RU')}
                    </span>
                  )}
                </div>

                {userData.current_access.updated_by && (
                  <div className="text-sm">
                    <strong>Последнее изменение:</strong> {userData.current_access.updated_by}
                    {userData.current_access.updated_at && (
                      <span className="text-muted-foreground ml-1">
                        ({new Date(userData.current_access.updated_at).toLocaleString('ru-RU')})
                      </span>
                    )}
                  </div>
                )}

                {userData.current_access.admin_note && (
                  <div className="text-sm">
                    <strong>Комментарий:</strong> {userData.current_access.admin_note}
                  </div>
                )}

                {userData.demoStatus && (
                  <div className="text-sm text-muted-foreground">
                    <strong>Демо-статус:</strong> использовано {userData.demoStatus.documentsUsed} из {userData.demoStatus.documentsLimit} документов
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Форма управления доступом */}
            <Card>
              <CardHeader>
                <CardTitle>Выдать/продлить доступ</CardTitle>
                <CardDescription>
                  Установите период доступа для пользователя
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startDate">Дата начала</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="endDate">Дата окончания *</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="comment">Комментарий</Label>
                  <Textarea
                    id="comment"
                    placeholder="Причина предоставления доступа..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                  />
                </div>

                <div className="flex gap-2">
                  <Button 
                    onClick={handleGrantAccess}
                    disabled={saving}
                  >
                    {saving ? "Сохранение..." : "Сохранить доступ"}
                  </Button>

                  {isActive && (
                    <Button
                      variant="destructive"
                      onClick={() => setShowRevokeDialog(true)}
                      disabled={saving}
                    >
                      Отключить доступ
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* История изменений */}
            {userData.history && userData.history.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>История</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {userData.history.map((record, index) => (
                      <div key={index} className="border-b pb-4 last:border-b-0 last:pb-0">
                        <div className="text-sm">
                          <div className="font-medium">
                            {new Date(record.at).toLocaleString('ru-RU')} — {record.action} 
                            {record.start_date && record.end_date && (
                              <span> — период {new Date(record.start_date).toLocaleDateString('ru-RU')}–{new Date(record.end_date).toLocaleDateString('ru-RU')}</span>
                            )}
                            — {record.by}
                          </div>
                          {record.note && (
                            <div className="text-muted-foreground mt-1">
                              {record.note}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>

      {/* Диалог подтверждения отключения доступа */}
      <AlertDialog open={showRevokeDialog} onOpenChange={setShowRevokeDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Отключить доступ сейчас?</AlertDialogTitle>
            <AlertDialogDescription>
              Пользователь сразу потеряет возможность создавать новые документы. Продолжить?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRevokeAccess}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Отключить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}