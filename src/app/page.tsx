"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useUser } from "@/hooks/useUser";
import { FileText, Calculator, Shield, MessageSquare, BarChart3, Building2, CheckCircle2 } from "lucide-react";

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
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">
            Бухгалтерский ИИ-помощник
          </h1>
          <nav className="hidden md:flex gap-6 items-center">
            <a href="#about" className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors">О продукте</a>
            <a href="#features" className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors">Функционал</a>
            <a href="#for-whom" className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors">Для кого</a>
            <a href="#how-it-works" className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors">Как работает</a>
            <a href="#faq" className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors">FAQ</a>
            <a href="#templates" className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors">Шаблоны</a>
          </nav>
          <Button 
            onClick={handleLoginClick} 
            disabled={isLoading}
            className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-medium shadow-md hover:shadow-lg transition-all"
          >
            {isLoading ? "Загрузка..." : "Войти через Email"}
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-white">
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="max-w-3xl">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              ИИ-помощник для бухгалтеров
        </h2>
            <p className="text-lg md:text-xl text-gray-600 mb-8 leading-relaxed">
              Освободите сотни часов в месяц от рутинных действий с помощью ИИ
            </p>
          <Button 
            size="lg" 
            onClick={handleLoginClick}
            disabled={isLoading}
              className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-medium text-base px-8 py-6 shadow-lg hover:shadow-xl transition-all mb-4"
          >
              {isLoading ? "Загрузка..." : "Войти через Email"}
          </Button>
            <p className="text-sm text-gray-500">
              Быстрый старт без регистрации, демо на 5 документов, безопасное хранение данных
          </p>
          </div>
        </div>
      </section>

      {/* Features Section - 6 карточек */}
      <section id="features" className="py-16 md:py-24 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Что умеет ИИ-помощник</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Card 1: Обработка документов */}
            <Card className="bg-white border border-gray-200 hover:shadow-lg transition-shadow">
              <CardHeader className="space-y-3">
                <div className="w-12 h-12 rounded-lg bg-yellow-100 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-yellow-600" />
                </div>
                <CardTitle className="text-lg font-semibold text-gray-900">Обработка документов</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600 mb-4">
                  Автоматическое создание и заполнение документов по готовым шаблонам
                </CardDescription>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span>Договоры</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span>Акты</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span>Счета</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span>Накладные</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Card 2: Проверка реквизитов */}
            <Card className="bg-white border border-gray-200 hover:shadow-lg transition-shadow">
              <CardHeader className="space-y-3">
                <div className="w-12 h-12 rounded-lg bg-yellow-100 flex items-center justify-center">
                  <Shield className="w-6 h-6 text-yellow-600" />
                </div>
                <CardTitle className="text-lg font-semibold text-gray-900">Проверка реквизитов</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600 mb-4">
                  Валидация российских реквизитов и автоматическая проверка данных организации
                </CardDescription>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span>ИНН проверка</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span>КПП валидация</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span>ОГРН контроль</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span>Банковские реквизиты</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Card 3: ИИ-консультант */}
            <Card className="bg-white border border-gray-200 hover:shadow-lg transition-shadow">
              <CardHeader className="space-y-3">
                <div className="w-12 h-12 rounded-lg bg-yellow-100 flex items-center justify-center">
                  <MessageSquare className="w-6 h-6 text-yellow-600" />
                </div>
                <CardTitle className="text-lg font-semibold text-gray-900">ИИ-консультант</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600 mb-4">
                  Редактирование и доработка текста документов с помощью ИИ
                </CardDescription>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span>Правки текста</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span>Добавление пунктов</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span>Улучшение формулировок</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span>Редактирование в чате</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Card 4: Управление организациями */}
            <Card className="bg-white border border-gray-200 hover:shadow-lg transition-shadow">
              <CardHeader className="space-y-3">
                <div className="w-12 h-12 rounded-lg bg-yellow-100 flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-yellow-600" />
                </div>
                <CardTitle className="text-lg font-semibold text-gray-900">Управление организациями</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600 mb-4">
                  Хранение и управление реквизитами организаций с автоматическим заполнением
                </CardDescription>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span>Юридические лица</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span>Индивидуальные предприниматели</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span>Автозаполнение реквизитов</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span>Безопасное хранение</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Card 5: Экспорт документов */}
            <Card className="bg-white border border-gray-200 hover:shadow-lg transition-shadow">
              <CardHeader className="space-y-3">
                <div className="w-12 h-12 rounded-lg bg-yellow-100 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-yellow-600" />
                </div>
                <CardTitle className="text-lg font-semibold text-gray-900">Экспорт документов</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600 mb-4">
                  Скачивание готовых документов в различных форматах
                </CardDescription>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span>DOCX формат</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span>PDF формат</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span>Архив документов</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span>Профессиональное форматирование</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Card 6: Веб-доступ */}
            <Card className="bg-white border border-gray-200 hover:shadow-lg transition-shadow">
              <CardHeader className="space-y-3">
                <div className="w-12 h-12 rounded-lg bg-yellow-100 flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-yellow-600" />
                </div>
                <CardTitle className="text-lg font-semibold text-gray-900">Веб-доступ</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600 mb-4">
                  Работа с документами через веб-интерфейс в любое время и в любом месте
                </CardDescription>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span>Доступ с любого устройства</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span>Быстрая авторизация</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span>Синхронизация данных</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span>Безопасное облачное хранение</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How it works - 4 шага */}
      <section id="how-it-works" className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Как это работает</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Step 1 */}
            <div className="flex gap-6 items-start">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-yellow-400 flex items-center justify-center font-bold text-gray-900 text-lg">
                1
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg text-gray-900 mb-2">Подключитесь через Email</h3>
                <p className="text-gray-600 leading-relaxed">
                  Введите email, получите 6-значный код на почту и авторизуйтесь. Никаких дополнительных регистраций.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex gap-6 items-start">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-yellow-400 flex items-center justify-center font-bold text-gray-900 text-lg">
                2
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg text-gray-900 mb-2">Выберите шаблон документа</h3>
                <p className="text-gray-600 leading-relaxed">
                  Выберите нужный тип документа из каталога шаблонов. Система автоматически подготовит форму для заполнения.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex gap-6 items-start">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-yellow-400 flex items-center justify-center font-bold text-gray-900 text-lg">
                3
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg text-gray-900 mb-2">ИИ обрабатывает данные</h3>
                <p className="text-gray-600 leading-relaxed">
                  Отредактируйте текст документа в чате с ИИ, добавьте реквизиты. Система проверит данные и выполнит необходимые расчеты.
                </p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="flex gap-6 items-start">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-yellow-400 flex items-center justify-center font-bold text-gray-900 text-lg">
                4
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg text-gray-900 mb-2">Получите готовый результат</h3>
                <p className="text-gray-600 leading-relaxed">
                  Заполненные документы готовы к использованию или отправке. Скачайте в формате DOCX или PDF.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* For whom section */}
      <section id="for-whom" className="py-16 md:py-24 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Для кого наш продукт</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {/* Бухгалтеры */}
            <Card className="bg-white border border-gray-200">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center mb-4">
                  <FileText className="w-6 h-6 text-gray-700" />
                </div>
                <CardTitle className="text-xl font-semibold text-gray-900">Бухгалтеры</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600 mb-4">
                  Автоматизация рутинных задач, минимизация ошибок при заполнении документов
                </CardDescription>
                <div className="border-l-4 border-green-500 pl-4">
                  <p className="text-sm text-gray-700 italic">
                    "Создала договор за 5 минут вместо обычных 30 минут!"
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Предприниматели */}
            <Card className="bg-white border border-gray-200">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center mb-4">
                  <Building2 className="w-6 h-6 text-gray-700" />
                </div>
                <CardTitle className="text-xl font-semibold text-gray-900">Предприниматели</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600 mb-4">
                  Самостоятельное ведение бухгалтерии без лишней головной боли
                </CardDescription>
                <div className="border-l-4 border-green-500 pl-4">
                  <p className="text-sm text-gray-700 italic">
                    "Открыл ИП и оформил все документы без единого похода к бухгалтеру!"
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Онлайн-компании */}
            <Card className="bg-white border border-gray-200">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center mb-4">
                  <BarChart3 className="w-6 h-6 text-gray-700" />
                </div>
                <CardTitle className="text-xl font-semibold text-gray-900">Онлайн-компании</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600 mb-4">
                  Масштабирование документооборота без увеличения штата бухгалтерии
                </CardDescription>
                <div className="border-l-4 border-green-500 pl-4">
                  <p className="text-sm text-gray-700 italic">
                    "Сократили время на документооборот на 75% при росте компании в 2 раза!"
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Try Free Section */}
      <section id="try-free" className="py-16 md:py-24 bg-yellow-50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Попробуйте бесплатно</h2>
            <p className="text-lg text-gray-700 mb-6">
              Обработайте 5 документов бесплатно — оцените удобство сервиса!
            </p>
            <p className="text-base text-gray-600 mb-8">
              Присоединяйтесь к тысячам бухгалтеров и предпринимателей, которые уже оценили преимущества нашего ИИ-помощника
            </p>
            <Button
              size="lg"
              onClick={handleLoginClick}
              disabled={isLoading}
              className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-medium text-base px-8 py-6 shadow-lg hover:shadow-xl transition-all"
            >
              {isLoading ? "Загрузка..." : "Войти через Email"}
            </Button>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Часто задаваемые вопросы</h2>
          </div>
          <div className="max-w-3xl mx-auto space-y-6">
            <Card className="bg-white border border-gray-200">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900">Как начать работу?</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600">
                  Просто введите ваш email, получите код на почту и войдите в систему. Никаких сложных регистраций не требуется.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="bg-white border border-gray-200">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900">Сколько стоит использование?</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600">
                  Вы можете бесплатно обработать 5 документов. После этого доступны платные тарифы с неограниченным количеством документов.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="bg-white border border-gray-200">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900">Безопасно ли хранить реквизиты?</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600">
                  Да, все данные хранятся в соответствии с требованиями 152-ФЗ. Мы используем современные методы шифрования и защиты данных.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="bg-white border border-gray-200">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900">Какие форматы документов поддерживаются?</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600">
                  Вы можете скачать готовые документы в форматах DOCX и PDF. Все документы имеют профессиональное форматирование.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h3 className="text-xl font-bold mb-2 text-gray-900">
              Бухгалтерский ИИ-помощник
            </h3>
            <p className="text-sm text-gray-600">
              Современный AI-ассистент для автоматизации бухгалтерской работы
            </p>
          </div>
          <div className="flex flex-wrap gap-6 justify-center mb-6">
            <a href="#" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
              Политика конфиденциальности
            </a>
            <a href="#" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
              Условия использования
            </a>
            <a href="#" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
              Поддержка
            </a>
          </div>
          <p className="text-center text-sm text-gray-500">
            &copy; 2025 Бухгалтерский ИИ-помощник. Все права защищены.
          </p>
        </div>
      </footer>
    </div>
  );
}
