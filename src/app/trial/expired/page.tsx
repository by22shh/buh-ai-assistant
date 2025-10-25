"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";

export default function TrialExpiredPage() {
  const router = useRouter();

  const triedFeatures = [
    "Создание документов по готовым шаблонам (25 видов)",
    "Удобный каталог с категориями и тегами",
    "Получение текста документа через диалог с ассистентом",
    "Автоматическая подстановка реквизитов из выбранной организации",
    "Экспорт готовых документов в DOCX и PDF",
    "Хранение и скачивание из личного архива",
  ];

  const fullVersionFeatures = [
    "Неограниченное создание новых документов в рамках тарифа",
    "Полный доступ ко всем шаблонам и их обновлениям",
    "Быстрый сценарий «заполнил → скачал» без ограничений на экспорт",
    "Помощь команды при настройке и ответы на вопросы",
  ];

  return (
    <div className="min-h-screen bg-muted/50 flex items-center justify-center px-4">
      <div className="max-w-4xl w-full space-y-6">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-3xl">Ваш демо-период закончился</CardTitle>
            <p className="text-muted-foreground mt-2">
              Чтобы продолжить пользоваться сервисом, свяжитесь с менеджером в Telegram.
            </p>
          </CardHeader>
          <CardContent className="space-y-8">
            {/* Что успели попробовать */}
            <div>
              <h3 className="text-xl font-semibold mb-4">Что вы уже успели попробовать</h3>
              <div className="space-y-2">
                {triedFeatures.map((feature, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
              <p className="text-sm text-muted-foreground mt-4">
                <strong>Примечание:</strong> подписание документов на платформе не предусмотрено — мы формируем корректные файлы для скачивания.
              </p>
            </div>

            {/* Что будет в полной версии */}
            <div>
              <h3 className="text-xl font-semibold mb-4">Что будет в полной версии</h3>
              <div className="space-y-2">
                {fullVersionFeatures.map((feature, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <span className="text-primary text-lg flex-shrink-0">⭐</span>
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button size="lg" onClick={() => window.open("https://t.me/", "_blank")}>
                Написать в Telegram
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => router.push("/docs")}
              >
                Перейти в архив
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
