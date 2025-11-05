"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useUser } from "@/hooks/useUser";
import { toast } from "sonner";
import { User, Mail, Briefcase, Building2, Phone } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ProfileSkeleton } from "@/components/skeletons/ProfileSkeleton";
import { profileFormSchema, type ProfileFormData } from "@/lib/schemas/profileForm";

export default function ProfilePage() {
  const router = useRouter();
  const { user, isLoading, updateProfile, logout, isLoggingOut } = useUser();

  const [editing, setEditing] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      position: "",
      company: "",
    },
  });

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/auth/login");
      return;
    }

    if (user) {
      reset({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        position: user.position || "",
        company: user.company || "",
      });
    }
  }, [user, isLoading, router, reset]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-muted/50">
        <header className="border-b bg-background">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold">Личный кабинет</h1>
              <div className="flex gap-2">
                <ThemeToggle />
                <Button disabled variant="outline">К шаблонам</Button>
                <Button disabled variant="outline">Организации</Button>
                <Button disabled variant="outline">Архив</Button>
              </div>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          <ProfileSkeleton />
        </main>
      </div>
    );
  }

  if (!user) return null;

  const onSubmit = async (data: ProfileFormData) => {
    try {
      await updateProfile(data);
      setEditing(false);
      // Toast показывается автоматически в hook
    } catch (error) {
      // Ошибка обработана в hook
    }
  };

  const handleCancel = () => {
    // Откатываем изменения
    reset({
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      email: user.email || "",
      position: user.position || "",
      company: user.company || "",
    });
    setEditing(false);
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.push("/auth/login");
    } catch (error) {
      // Ошибка уже обработана в hook
    }
  };

  return (
    <div className="min-h-screen bg-muted/50">
      <header className="border-b bg-background">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Личный кабинет</h1>
            <div className="flex gap-2">
              <ThemeToggle />
              <Button onClick={() => router.push("/templates")} variant="outline">
                К шаблонам
              </Button>
              <Button onClick={() => router.push("/org")} variant="outline">
                Организации
              </Button>
              <Button onClick={() => router.push("/docs")} variant="outline">
                Архив
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Информация об аккаунте */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Информация об аккаунте
                  </CardTitle>
                  <CardDescription className="mt-2">
                    Ваш номер телефона и роль в системе
                  </CardDescription>
                </div>
                {user.role === "admin" && (
                  <Badge variant="default" className="text-base px-4 py-1">
                    Администратор
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Телефон</p>
                  <p className="font-medium">{user.phone}</p>
                </div>
              </div>

              {user.demoStatus && (
                <div className="p-4 bg-muted rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium">Демо-доступ</p>
                    <Badge variant={user.demoStatus.isActive ? "default" : "destructive"}>
                      {user.demoStatus.isActive ? "Активен" : "Истёк"}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Использовано документов: {user.demoStatus.documentsUsed} из {user.demoStatus.documentsLimit}
                  </div>
                  <div className="mt-2 w-full bg-muted-foreground/20 rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{
                        width: `${Math.min((user.demoStatus.documentsUsed / user.demoStatus.documentsLimit) * 100, 100)}%`
                      }}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Личные данные */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Личные данные</CardTitle>
                {!editing && (
                  <Button onClick={() => setEditing(true)} variant="outline">
                    Редактировать
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {editing ? (
                <form onSubmit={handleSubmit(onSubmit)}>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="firstName">Имя</Label>
                        <Input
                          id="firstName"
                          placeholder="Иван"
                          {...register("firstName")}
                        />
                        {errors.firstName && (
                          <p className="text-sm text-destructive mt-1">
                            {errors.firstName.message}
                          </p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="lastName">Фамилия</Label>
                        <Input
                          id="lastName"
                          placeholder="Иванов"
                          {...register("lastName")}
                        />
                        {errors.lastName && (
                          <p className="text-sm text-destructive mt-1">
                            {errors.lastName.message}
                          </p>
                        )}
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="email">Email</Label>
                      <div className="flex items-center gap-2">
                        <Mail className="w-5 h-5 text-muted-foreground" />
                        <div className="flex-1">
                          <Input
                            id="email"
                            type="email"
                            placeholder="ivan@example.com"
                            {...register("email")}
                          />
                          {errors.email && (
                            <p className="text-sm text-destructive mt-1">
                              {errors.email.message}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="position">Должность</Label>
                      <div className="flex items-center gap-2">
                        <Briefcase className="w-5 h-5 text-muted-foreground" />
                        <div className="flex-1">
                          <Input
                            id="position"
                            placeholder="Главный бухгалтер"
                            {...register("position")}
                          />
                          {errors.position && (
                            <p className="text-sm text-destructive mt-1">
                              {errors.position.message}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="company">Компания</Label>
                      <div className="flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-muted-foreground" />
                        <div className="flex-1">
                          <Input
                            id="company"
                            placeholder="ООО «Рога и копыта»"
                            {...register("company")}
                          />
                          {errors.company && (
                            <p className="text-sm text-destructive mt-1">
                              {errors.company.message}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-4 pt-4">
                      <Button type="submit" disabled={isSubmitting} className="flex-1">
                        {isSubmitting ? "Сохранение..." : "Сохранить"}
                      </Button>
                      <Button type="button" onClick={handleCancel} variant="outline" className="flex-1">
                        Отмена
                      </Button>
                    </div>
                  </div>
                </form>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Имя</p>
                      <p className="font-medium">{user.firstName || "—"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Фамилия</p>
                      <p className="font-medium">{user.lastName || "—"}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Email
                    </p>
                    <p className="font-medium">{user.email || "—"}</p>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <Briefcase className="w-4 h-4" />
                      Должность
                    </p>
                    <p className="font-medium">{user.position || "—"}</p>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <Building2 className="w-4 h-4" />
                      Компания
                    </p>
                    <p className="font-medium">{user.company || "—"}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Действия */}
          <Card>
            <CardHeader>
              <CardTitle>Действия</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {user.role === "admin" && (
                <Button
                  onClick={() => router.push("/admin/templates")}
                  variant="outline"
                  className="w-full"
                >
                  Админ-панель
                </Button>
              )}
              <Button
                onClick={handleLogout}
                variant="destructive"
                className="w-full"
                disabled={isLoggingOut}
              >
                {isLoggingOut ? "Выходим..." : "Выйти из аккаунта"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
