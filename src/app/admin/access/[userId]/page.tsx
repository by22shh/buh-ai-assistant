"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useUser } from "@/hooks/useUser";

export default function UserAccessPage({ params }: { params: Promise<{ userId: string }> }) {
  const router = useRouter();
  const { user, isLoading } = useUser();

  useEffect(() => {
    if (!isLoading && (!user || user.role !== "admin")) {
      router.push("/templates");
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user || user.role !== "admin") return null;

  // Production: Админская страница временно недоступна
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center max-w-md">
        <h1 className="text-2xl font-bold mb-4">🚧 В разработке</h1>
        <p className="text-muted-foreground mb-4">
          Управление доступом пользователей временно недоступно.
          Ведется разработка API.
        </p>
        <Button onClick={() => router.push("/admin/access")}>
          ← Назад к списку
        </Button>
      </div>
    </div>
  );
}