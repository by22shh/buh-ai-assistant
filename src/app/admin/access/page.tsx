"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useUser } from "@/hooks/useUser";
import { toast } from "sonner";

interface AccessRecord {
  userId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  status: string;
  current_access: {
    status: 'active' | 'inactive';
    start_date?: string;
    end_date?: string;
    updated_by?: string;
    admin_note?: string;
  };
  demoStatus?: {
    documentsUsed: number;
    documentsLimit: number;
    isActive: boolean;
  };
  createdAt: string;
}

export default function AdminAccessPage() {
  const router = useRouter();
  const { user, isLoading, logout, isLoggingOut } = useUser();
  const [accessRecords, setAccessRecords] = useState<AccessRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [showGrantModal, setShowGrantModal] = useState(false);
  const [selectedUserEmail, setSelectedUserEmail] = useState("");

  useEffect(() => {
    if (!isLoading && (!user || user.role !== "admin")) {
      router.push("/templates");
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user && user.role === "admin") {
      loadAccessRecords();
    }
  }, [user]);

  const loadAccessRecords = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/access');
      if (!response.ok) {
        throw new Error('Ошибка при загрузке данных');
      }
      const data = await response.json();
      setAccessRecords(data);
    } catch (error) {
      console.error('Error loading access records:', error);
      toast.error('Ошибка при загрузке данных доступа');
    } finally {
      setLoading(false);
    }
  };

  const handleGrantAccessByEmail = async () => {
    if (!selectedUserEmail) {
      toast.error('Введите email пользователя');
      return;
    }

    try {
      // Ищем пользователя по email
      const response = await fetch('/api/admin/access/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: selectedUserEmail }),
      });

      const data = await response.json();

      if (!response.ok || !data.found) {
        toast.error(data.error || 'Пользователь не найден');
        return;
      }

      // Перенаправляем на страницу карточки пользователя
      setShowGrantModal(false);
      setSelectedUserEmail("");
      router.push(`/admin/access/${data.user.id}`);
    } catch (error) {
      console.error('Error searching user:', error);
      toast.error('Ошибка при поиске пользователя');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user || user.role !== "admin") return null;

  const handleLogout = async () => {
    try {
      await logout();
      router.push("/auth/login");
    } catch (error) {
      // Ошибка уже показана
    }
  };

  return (
    <>
      <div className="min-h-screen">
        <header className="border-b">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold">Управление доступом/тарифом</h1>
              <div className="flex gap-2">
                <Button onClick={() => setShowGrantModal(true)}>
                  Выдать доступ по e-mail
                </Button>
                <Button variant="outline" onClick={() => router.push("/admin/templates")}>
                  К шаблонам
                </Button>
                <Button
                  variant="outline"
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                >
                  {isLoggingOut ? "Выходим..." : "Выход"}
                </Button>
              </div>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
              <p className="text-muted-foreground">Загрузка данных...</p>
            </div>
          ) : accessRecords.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-lg text-muted-foreground mb-4">
                Нет записей о доступах
              </p>
              <Button onClick={() => setShowGrantModal(true)}>
                Выдать доступ по e-mail
              </Button>
            </div>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Почта</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead>Последнее изменение</TableHead>
                    <TableHead className="text-right">Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {accessRecords.map((record) => {
                    const userName = record.firstName && record.lastName 
                      ? `${record.firstName} ${record.lastName}`
                      : record.email;
                    
                    const statusVariant = record.current_access.status === 'active' ? 'default' : 'secondary';

                    return (
                      <TableRow key={record.userId}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{userName}</div>
                            <div className="text-sm text-muted-foreground">{record.email}</div>
                            {record.demoStatus && (
                              <div className="text-xs text-muted-foreground">
                                Демо: {record.demoStatus.documentsUsed}/{record.demoStatus.documentsLimit}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusVariant}>
                            {record.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {record.current_access.updated_by || "—"}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {record.current_access.end_date 
                              ? new Date(record.current_access.end_date).toLocaleDateString("ru-RU")
                              : "—"}
                          </div>
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

      {/* Модал для выдачи доступа по email */}
      <Dialog open={showGrantModal} onOpenChange={setShowGrantModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Выдать доступ по e-mail</DialogTitle>
            <DialogDescription>
              Введите email пользователя для предоставления доступа
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="user@example.com"
              value={selectedUserEmail}
              onChange={(e) => setSelectedUserEmail(e.target.value)}
              type="email"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowGrantModal(false)}>
              Отмена
            </Button>
            <Button onClick={handleGrantAccessByEmail}>
              Найти и предоставить доступ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
