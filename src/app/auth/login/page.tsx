"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useUser } from "@/hooks/useUser";

export default function LoginPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, isLoading: isUserLoading } = useUser();
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Если пользователь уже авторизован, перенаправляем его
  useEffect(() => {
    if (!isUserLoading && user) {
      const redirectUrl = user.role === "admin" ? "/admin/templates" : "/templates";
      router.push(redirectUrl);
    }
  }, [user, isUserLoading, router]);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Введите корректный email адрес");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Ошибка при отправке кода');
      }

      setToken(data.token);
      setStep("code");

      // Показываем код только в development
      if (data.code) {
        toast.success(`Код отправлен на ${email}`, {
          description: `Код для тестирования: ${data.code}`,
          duration: 10000
        });
      } else {
        toast.success(`Код отправлен на ${email}`);
      }
    } catch (err: any) {
      setError(err.message || "Ошибка при отправке кода");
    } finally {
      setLoading(false);
    }
  };

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (code.length !== 6) {
      setError("Код должен содержать 6 цифр");
      setLoading(false);
      return;
    }

    try {
      const payload = token ? { email, code, token } : { email, code };
      const response = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include', // ВАЖНО: включаем cookies
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Неверный код');
      }

      // ВАЖНО: Сохраняем CSRF token в sessionStorage для немедленного доступа
      // Это предотвращает 403 ошибки при первом API запросе после логина
      if (data.csrfToken && typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem('csrf-token-temp', data.csrfToken);
      }

      // Показываем успешное сообщение
      toast.success(`Добро пожаловать${data.user?.firstName ? `, ${data.user.firstName}` : ''}!`);

      // Определяем URL для редиректа
      const redirectUrl = data.user?.role === "admin" ? "/admin/templates" : "/templates";

      // Обновляем кеш React Query перед редиректом
      queryClient.setQueryData(['user'], data.user);
      
      console.log('✅ Login successful, redirecting to:', redirectUrl);
      
      // Используем router.push вместо window.location.href для более плавного перехода
      // Но с небольшой задержкой для гарантии, что cookie сохранены
      setTimeout(() => {
        router.push(redirectUrl);
      }, 100);
    } catch (err: any) {
      setError(err.message || "Ошибка проверки кода");
      setLoading(false); // Только при ошибке
    }
    // Не сбрасываем loading здесь, чтобы кнопка оставалась disabled до редиректа
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl mb-2">Вход в систему</CardTitle>
          <CardDescription>
            {step === "email"
              ? "Введите email для получения кода"
              : `Код отправлен на ${email}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === "email" ? (
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email адрес</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Отправка..." : "Получить код"}
              </Button>
            </form>
          ) : (
            <div className="space-y-4">
              <form onSubmit={handleCodeSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="code">6-значный код</Label>
                  <Input
                    id="code"
                    type="text"
                    placeholder="123456"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    maxLength={6}
                    required
                    autoFocus
                  />
                  <p className="text-xs text-muted-foreground">
                    Проверьте почту и введите код, который мы отправили
                  </p>
                </div>
                {error && (
                  <p className="text-sm text-destructive">{error}</p>
                )}
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Проверка..." : "Войти"}
                </Button>
              </form>

              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setStep("email");
                  setCode("");
                  setToken("");
                  setError("");
                }}
                className="w-full"
              >
                Изменить email
              </Button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => handleEmailSubmit(new Event('submit') as any)}
                  disabled={loading}
                  className="text-sm text-primary hover:underline"
                >
                  Отправить код повторно
                </button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
