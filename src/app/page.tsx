"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useUser } from "@/hooks/useUser";

export default function Home() {
  const router = useRouter();
  const { user, isLoading } = useUser();

  // Если пользователь уже авторизован, сразу редиректим на нужную страницу
  useEffect(() => {
    if (!isLoading && user) {
      const redirectUrl = user.role === "admin" ? "/admin/templates" : "/templates";
      router.push(redirectUrl);
    }
  }, [user, isLoading, router]);

  // Обработчик клика на кнопку "Войти"
  const handleLoginClick = (e: React.MouseEvent) => {
    e.preventDefault();

    // Если пользователь уже авторизован, редиректим сразу
    if (user) {
      const redirectUrl = user.role === "admin" ? "/admin/templates" : "/templates";
      router.push(redirectUrl);
    } else {
      // Иначе идем на страницу логина
      router.push("/auth/login");
    }
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-lg bg-background/80 border-b border-border/50">
        <div className="container mx-auto px-4 py-5 flex items-center justify-between">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Линии ИИ: Бухгалтерия
          </h1>
          <nav className="hidden md:flex gap-8">
            <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Функционал</a>
            <a href="#how-it-works" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Как работает</a>
            <a href="#try-free" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Попробовать</a>
          </nav>
          <Button onClick={handleLoginClick} disabled={isLoading} className="shadow-md hover:shadow-lg transition-shadow">
            {isLoading ? "Загрузка..." : "Войти через Email"}
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/3 via-white to-white">
        <div className="container mx-auto px-4 py-20 md:py-32 text-center relative">
          <div className="inline-block mb-6 px-4 py-2 bg-primary/10 rounded-full">
            <p className="text-sm font-medium text-primary">Современный AI-ассистент для бухгалтеров</p>
          </div>
          <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
            Автоматизируйте бухгалтерскую<br />
            <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              рутину с ИИ-помощником
            </span>
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-3xl mx-auto leading-relaxed">
            Автоматизируйте рутину: шаблоны, безопасные реквизиты и правки в чате с ИИ.
            <br />
            <span className="inline-flex items-center gap-2 mt-2 text-primary font-semibold">
              5 документов бесплатно
            </span> — без карты и сложной регистрации.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              size="lg"
              className="w-full sm:w-auto text-base px-8 py-6 shadow-lg hover:shadow-xl transition-all"
              onClick={handleLoginClick}
              disabled={isLoading}
            >
              {isLoading ? "Загрузка..." : "Начать бесплатно"}
            </Button>
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <svg className="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Вход через Email — быстро и безопасно
            </p>
          </div>
        </div>
      </section>

      {/* Features Section - 3 карточки */}
      <section id="features" className="py-20 md:py-28">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Что умеет помощник</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Все необходимые инструменты для эффективной работы с документами
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-2 hover:border-primary/50 transition-all hover:shadow-lg bg-gradient-to-br from-card to-primary/5">
              <CardHeader className="space-y-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                </div>
                <CardTitle className="text-xl">Документы по шаблонам</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base leading-relaxed">
                  Создавайте договоры и акты из проверенных шаблонов за минуты.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-secondary/50 transition-all hover:shadow-lg bg-gradient-to-br from-card to-secondary/5">
              <CardHeader className="space-y-3">
                <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center">
                  <svg className="w-6 h-6 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <CardTitle className="text-xl">Безопасные реквизиты</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base leading-relaxed">
                  Добавляйте и подставляйте данные в соответствии с 152-ФЗ.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-accent/50 transition-all hover:shadow-lg bg-gradient-to-br from-card to-accent/5">
              <CardHeader className="space-y-3">
                <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                  <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                </div>
                <CardTitle className="text-xl">Редактор с ИИ</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base leading-relaxed">
                  Правьте текст простыми запросами: «Добавь пункт про отказ от упущенной выгоды».
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How it works - 5 шагов */}
      <section id="how-it-works" className="bg-muted/20 py-20 md:py-28">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Как это работает</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Простой и понятный процесс работы с документами
            </p>
          </div>
          <div className="max-w-3xl mx-auto space-y-8">
            {[
              {
                step: 1,
                title: "Войдите через Email",
                description: "получите 6-значный код на почту",
                color: "primary"
              },
              {
                step: 2,
                title: "Выберите тип документа",
                description: "с которым будете работать",
                color: "secondary"
              },
              {
                step: 3,
                title: "Отредактируйте документ в режиме чата",
                description: "пример: «Добавь пункт \"Отказ от упущенной выгоды\"»",
                color: "accent"
              },
              {
                step: 4,
                title: "Безопасно добавьте реквизиты",
                description: "всё согласно 152-ФЗ",
                color: "primary"
              },
              {
                step: 5,
                title: "Получите готовый документ",
                description: "скачайте или поделитесь",
                color: "secondary"
              }
            ].map((item, index) => (
              <div key={item.step} className="relative">
                {index < 4 && (
                  <div className="absolute left-5 top-16 w-0.5 h-8 bg-gradient-to-b from-primary/20 to-transparent"></div>
                )}
                <div className="flex gap-6 items-start bg-white p-6 rounded-2xl border border-border hover:border-primary/30 transition-all hover:shadow-md">
                  <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary text-primary-foreground flex items-center justify-center font-bold shadow-md">
                    {item.step}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{item.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Try Free Section */}
      <section id="try-free" className="py-20 md:py-28">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 rounded-3xl p-12 md:p-16 text-center border-2 border-primary/15 shadow-lg">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Попробуйте бесплатно прямо сейчас</h2>
            <p className="text-lg md:text-xl text-muted-foreground mb-8">
              Обработайте до <span className="font-bold text-primary">5 документов</span> и оцените скорость и удобство сервиса
            </p>
            <Link href="/auth/login">
              <Button size="lg" className="text-base px-8 py-6 shadow-lg hover:shadow-xl transition-all">
                Начать бесплатно
              </Button>
            </Link>
            <p className="mt-6 text-sm text-muted-foreground flex items-center justify-center gap-2">
              <svg className="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Никаких телефонов и мессенджеров — только Email
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/10 py-12">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h3 className="text-xl font-bold mb-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Линии ИИ: Бухгалтерия
            </h3>
            <p className="text-sm text-muted-foreground">
              Современный AI-ассистент для автоматизации бухгалтерской работы
            </p>
          </div>
          <div className="flex flex-wrap gap-6 justify-center mb-6">
            <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
              Политика конфиденциальности
            </a>
            <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
              Условия использования
            </a>
            <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
              Поддержка
            </a>
          </div>
          <p className="text-center text-sm text-muted-foreground">
            &copy; 2025 Линии ИИ: Бухгалтерия. Все права защищены.
          </p>
        </div>
      </footer>
    </div>
  );
}
