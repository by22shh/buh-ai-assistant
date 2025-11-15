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
import { Mail, ArrowLeft } from "lucide-react";
import Link from "next/link";

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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md">
        {/* Back to home link */}
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Вернуться на главную</span>
        </Link>

        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-2xl font-bold text-gray-900 mb-2">Вход в систему</CardTitle>
            <CardDescription className="text-gray-600">
              {step === "email"
                ? "Введите email для получения кода"
                : `Код отправлен на ${email}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {step === "email" ? (
              <form onSubmit={handleEmailSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-700 font-medium">
                    Email адрес
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoFocus
                      className="pl-10 h-12 border-gray-300 focus:border-yellow-400 focus:ring-yellow-400"
                    />
                  </div>
                </div>
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}
                <Button 
                  type="submit" 
                  className="w-full h-12 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-medium shadow-md hover:shadow-lg transition-all" 
                  disabled={loading}
                >
                  {loading ? "Отправка..." : "Получить код"}
                </Button>
              </form>
            ) : (
              <div className="space-y-6">
                <form onSubmit={handleCodeSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="code" className="text-gray-700 font-medium">
                      6-значный код
                    </Label>
                    <Input
                      id="code"
                      type="text"
                      placeholder="123456"
                      value={code}
                      onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      maxLength={6}
                      required
                      autoFocus
                      className="h-12 text-center text-2xl tracking-widest border-gray-300 focus:border-yellow-400 focus:ring-yellow-400"
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      Проверьте почту и введите код, который мы отправили
                    </p>
                  </div>
                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <p className="text-sm text-red-600">{error}</p>
                    </div>
                  )}
                  <Button 
                    type="submit" 
                    className="w-full h-12 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-medium shadow-md hover:shadow-lg transition-all" 
                    disabled={loading}
                  >
                    {loading ? "Проверка..." : "Войти"}
                  </Button>
                </form>

                <div className="space-y-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setStep("email");
                      setCode("");
                      setToken("");
                      setError("");
                    }}
                    className="w-full h-11 border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    Изменить email
                  </Button>

                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => handleEmailSubmit(new Event('submit') as any)}
                      disabled={loading}
                      className="text-sm text-yellow-600 hover:text-yellow-700 hover:underline transition-colors"
                    >
                      Отправить код повторно
                    </button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Additional info */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            Нет аккаунта? Код будет отправлен на указанный email
          </p>
        </div>
      </div>
    </div>
  );
}
