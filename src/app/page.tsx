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
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Линии ИИ: Бухгалтерия</h1>
          <nav className="hidden md:flex gap-6">
            <a href="#features" className="text-sm hover:underline">Функционал</a>
            <a href="#how-it-works" className="text-sm hover:underline">Как работает</a>
            <a href="#try-free" className="text-sm hover:underline">Попробовать</a>
          </nav>
          <Button onClick={handleLoginClick} disabled={isLoading}>
            {isLoading ? "Загрузка..." : "Войти через Email"}
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 md:py-24 text-center">
        <h2 className="text-4xl md:text-6xl font-bold mb-6">
          Автоматизируйте бухгалтерскую рутину с ИИ-помощником
        </h2>
        <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
          Автоматизируйте рутину: шаблоны, безопасные реквизиты и правки в чате с ИИ.
          <br />
          <strong className="text-primary">5 документов бесплатно</strong> — без карты и сложной регистрации.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button 
            size="lg" 
            className="w-full sm:w-auto"
            onClick={handleLoginClick}
            disabled={isLoading}
          >
            {isLoading ? "Загрузка..." : "Начать бесплатно"}
          </Button>
          <p className="text-sm text-muted-foreground">
            Вход через Email — быстро и безопасно
          </p>
        </div>
      </section>

      {/* Features Section - 3 карточки */}
      <section id="features" className="bg-muted/50 py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Что умеет помощник</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>Документы по шаблонам</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Создавайте договоры и акты из проверенных шаблонов за минуты.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Безопасные реквизиты</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Добавляйте и подставляйте данные в соответствии с 152-ФЗ.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Редактор с ИИ</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Правьте текст простыми запросами: «Добавь пункт про отказ от упущенной выгоды».
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How it works - 5 шагов */}
      <section id="how-it-works" className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Как это работает</h2>
        <div className="max-w-3xl mx-auto space-y-6">
          {[
            {
              step: 1,
              title: "Войдите через Email",
              description: "получите 6-значный код на почту"
            },
            {
              step: 2,
              title: "Выберите тип документа",
              description: "с которым будете работать"
            },
            {
              step: 3,
              title: "Отредактируйте документ в режиме чата",
              description: "пример: «Добавь пункт \"Отказ от упущенной выгоды\"»"
            },
            {
              step: 4,
              title: "Безопасно добавьте реквизиты",
              description: "всё согласно 152-ФЗ"
            },
            {
              step: 5,
              title: "Получите готовый документ",
              description: "скачайте или поделитесь"
            }
          ].map((item) => (
            <div key={item.step} className="flex gap-4 items-start">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                {item.step}
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">{item.title}</h3>
                <p className="text-muted-foreground">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Try Free Section */}
      <section id="try-free" className="bg-muted/50 py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Попробуйте бесплатно прямо сейчас</h2>
          <p className="text-xl text-muted-foreground mb-8">
            Обработайте до <strong>5 документов</strong> и оцените скорость и удобство сервиса
          </p>
          <Link href="/auth/login">
            <Button size="lg">Начать бесплатно</Button>
          </Link>
          <p className="mt-4 text-sm text-muted-foreground">
            Никаких телефонов и мессенджеров — только Email
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; 2025 Линии ИИ: Бухгалтерия. Все права защищены.</p>
          <div className="mt-2 flex gap-4 justify-center">
            <a href="#" className="hover:underline">Политика конфиденциальности</a>
            <a href="#" className="hover:underline">Условия использования</a>
            <a href="#" className="hover:underline">Поддержка</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
