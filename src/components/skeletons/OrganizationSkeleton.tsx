import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function OrganizationSkeleton() {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-3">
            {/* Название */}
            <div className="flex items-center gap-2">
              <Skeleton className="h-6 w-2/3" />
              <Skeleton className="h-5 w-20" />
            </div>
            {/* Краткое название */}
            <Skeleton className="h-4 w-1/2" />
            {/* ИНН и Email */}
            <div className="space-y-1">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-48" />
            </div>
          </div>
          {/* Кнопки */}
          <div className="flex gap-2">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function OrganizationListSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <OrganizationSkeleton key={i} />
      ))}
    </div>
  );
}
