"use client";

import { useState, useEffect, use, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { useUser } from "@/hooks/useUser";
import { useDocuments } from "@/hooks/useDocuments";
import { getTemplateByCode } from "@/lib/data/templates";
import { checkNoRequisites } from "@/lib/utils/requisitesGuard";
import { toast } from "sonner";
import { Paperclip, Send } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export default function DocumentBodyChatPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const resolvedParams = use(params);
  const docId = resolvedParams.id;
  const templateCode = searchParams.get("template");

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [bodyText, setBodyText] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { user, isLoading: userLoading } = useUser();
  const { updateDocument } = useDocuments();

  useEffect(() => {
    if (!userLoading && !user) {
      router.push("/auth/login");
      return;
    }
    if (!templateCode) {
      router.push("/templates");
      return;
    }

    // Приветственное сообщение от ИИ
    if (user && templateCode) {
      setMessages([
        {
          id: "welcome",
          role: "assistant",
          content: "Здравствуйте! Опишите содержание документа, и я помогу вам составить его тело. Вы можете описать своими словами, что должно быть в документе, или прикрепить файл (.docx, .pdf, .txt, .md) с примером.",
          timestamp: new Date(),
        },
      ]);
    }
  }, [user, userLoading, router, templateCode]);

  useEffect(() => {
    // Автоскролл к последнему сообщению
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const template = templateCode ? getTemplateByCode(templateCode) : null;
  const [dbTemplate, setDbTemplate] = useState<any | null>(null);

  useEffect(() => {
    async function loadTemplate() {
      if (!templateCode) return;
      try {
        const res = await fetch('/api/templates');
        if (res.ok) {
          const list = await res.json();
          const found = list.find((t: any) => t.code === templateCode);
          if (found) setDbTemplate(found);
        }
      } catch (e) {}
    }
    loadTemplate();
  }, [templateCode]);

  if (!template) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Шаблон не найден</p>
      </div>
    );
  }

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput("");

    // Проверка на наличие реквизитов
    const checkResult = checkNoRequisites(userMessage);
    if (!checkResult.ok) {
      toast.error(checkResult.message);
      return;
    }

    // Добавляем сообщение пользователя
    const userMsg: Message = {
      id: `user_${Date.now()}`,
      role: "user",
      content: userMessage,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);

    // Вызов OpenAI API
    setLoading(true);
    try {
      // Формируем историю для контекста
      const conversationHistory = messages
        .filter(m => m.id !== 'welcome')
        .map(m => ({ role: m.role, content: m.content }));

      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userPrompt: userMessage,
          templateName: template.nameRu,
          conversationHistory
        })
      });

      const data = await response.json();

      if (!data.success) {
        toast.error(data.error || 'Ошибка при генерации ответа');
        setLoading(false);
        return;
      }

      const aiResponse = data.text;
      const aiMsg: Message = {
        id: `ai_${Date.now()}`,
        role: "assistant",
        content: aiResponse,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMsg]);
      setBodyText(aiResponse);
    } catch (error) {
      console.error('AI chat error:', error);
      toast.error('Ошибка при обращении к ИИ');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Проверка формата
    if (!file.name.match(/\.(docx|pdf|txt|md)$/i)) {
      toast.error("Поддерживаются только файлы: .docx, .pdf, .txt, .md");
      return;
    }

    // Проверка размера (15 МБ)
    if (file.size > 15 * 1024 * 1024) {
      toast.error("Размер файла не должен превышать 15 МБ");
      return;
    }

    setLoading(true);
    toast.loading("Обработка файла...");

    // Парсинг через API route
    let fileText: string;
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/files/parse', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Ошибка при обработке файла');
      }

      fileText = data.text;
      toast.dismiss();
    } catch (error) {
      console.error('Ошибка при извлечении текста:', error);
      toast.dismiss();
      toast.error(error instanceof Error ? error.message : "Ошибка при чтении файла. Попробуйте другой формат.");
      setLoading(false);
      return;
    }

    // Проверка на наличие реквизитов
    const checkResult = checkNoRequisites(fileText);
    if (!checkResult.ok) {
      toast.error(checkResult.message);
      setLoading(false);
      return;
    }

    // Добавляем сообщение о загрузке файла
    const userMsg: Message = {
      id: `user_${Date.now()}`,
      role: "user",
      content: `📎 Загружен файл: ${file.name}\n\n${fileText.substring(0, 200)}${fileText.length > 200 ? "..." : ""}`,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);

    // Обработка файла через ИИ
    try {
      const conversationHistory = messages
        .filter(m => m.id !== 'welcome')
        .map(m => ({ role: m.role, content: m.content }));

      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userPrompt: `Обработай следующий текст и составь на его основе документ "${template.nameRu}":\n\n${fileText}`,
          templateName: template.nameRu,
          conversationHistory
        })
      });

      const data = await response.json();

      if (!data.success) {
        toast.error(data.error || 'Ошибка при обработке файла');
        setLoading(false);
        return;
      }

      const aiResponse = data.text;
      const aiMsg: Message = {
        id: `ai_${Date.now()}`,
        role: "assistant",
        content: aiResponse,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMsg]);
      setBodyText(aiResponse);
    } catch (error) {
      console.error('File processing error:', error);
      toast.error('Ошибка при обработке файла');
    } finally {
      setLoading(false);
    }

    // Сбрасываем input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleProceedToRequisites = async () => {
    if (!bodyText) {
      toast.error("Сначала получите текст документа от ИИ");
      return;
    }

    try {
      // Сохраняем bodyText в документ через API
      await updateDocument(docId, {
        bodyText,
        hasBodyChat: true,
      });

      // Переход к реквизитам
      router.push(`/doc/${docId}/requisites?template=${templateCode}&hasBody=true`);
    } catch (error) {
      // Ошибка обработана в hook
    }
  };

  const handleBack = () => {
    router.push("/templates");
  };

  if (userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-muted/50 flex flex-col">
      <header className="border-b bg-background sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 md:py-4">
          <h1 className="text-lg md:text-2xl font-bold">Тело документа — чат</h1>
          <p className="text-xs md:text-sm text-muted-foreground mt-1">
            {(template?.nameRu || dbTemplate?.nameRu || templateCode)} · {(template?.version || dbTemplate?.version || '')}
          </p>
        </div>
      </header>

      {/* Инфо-баннер */}
      <div className="bg-blue-50 border-b border-blue-200 py-2 md:py-3">
        <div className="container mx-auto px-4">
          <p className="text-xs md:text-sm text-blue-900">
            ℹ️ Реквизиты организации не отправляются в ИИ. Обрабатываем только текст тела.
          </p>
        </div>
      </div>

      {/* Лента чата */}
      <div className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-4 py-6 max-w-4xl space-y-6">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <Card
                className={`max-w-[85%] md:max-w-[80%] p-3 md:p-4 ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-background"
                }`}
              >
                <p className="text-xs md:text-sm whitespace-pre-wrap break-words">{message.content}</p>
                <p className="text-xs opacity-70 mt-2">
                  {message.timestamp.toLocaleTimeString("ru-RU", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </Card>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <Card className="max-w-[80%] p-4 bg-background">
                <div className="flex gap-2">
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce delay-100" />
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce delay-200" />
                </div>
              </Card>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Панель ввода */}
      <div className="border-t bg-background sticky bottom-0">
        <div className="container mx-auto px-4 py-4 max-w-4xl">
          <div className="flex gap-2 items-end">
            <input
              ref={fileInputRef}
              type="file"
              accept=".docx,.pdf,.txt,.md"
              className="hidden"
              onChange={handleFileUpload}
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
              title="Прикрепить файл"
            >
              <Paperclip className="w-4 h-4" />
            </Button>

            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Опишите содержание документа..."
              className="flex-1 min-h-[60px] max-h-[200px]"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              disabled={loading}
            />

            <Button onClick={handleSend} disabled={loading || !input.trim()} size="icon">
              <Send className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 sm:justify-between mt-4">
            <Button variant="outline" onClick={handleBack} size="sm" className="sm:size-default w-full sm:w-auto">
              <span className="hidden sm:inline">Назад к шаблонам</span>
              <span className="sm:hidden">Назад</span>
            </Button>

            <Button
              onClick={handleProceedToRequisites}
              disabled={!bodyText}
              size="sm"
              className={`w-full sm:w-auto sm:size-default ${!bodyText ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <span className="hidden sm:inline">Перейти к реквизитам →</span>
              <span className="sm:hidden">К реквизитам →</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Функция extractTextFromFile удалена - парсинг теперь на сервере (/api/files/parse)
