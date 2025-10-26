"use client";

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, FileText } from "lucide-react";
import type { Organization } from "@/lib/types";

interface DocumentPreviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templateName: string;
  templateVersion: string;
  bodyText: string;
  requisites: Record<string, any>;
  organization?: Organization | null;
  onDownloadDOCX: () => void;
  onDownloadPDF: () => void;
}

export function DocumentPreview({
  open,
  onOpenChange,
  templateName,
  templateVersion,
  bodyText,
  requisites,
  organization,
  onDownloadDOCX,
  onDownloadPDF,
}: DocumentPreviewProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              <DialogTitle>{templateName}</DialogTitle>
            </div>
            <Badge variant="secondary">{templateVersion}</Badge>
          </div>
          <DialogDescription>
            Предпросмотр документа перед скачиванием
          </DialogDescription>
        </DialogHeader>

        {/* Контент документа */}
        <div className="flex-1 overflow-y-auto border rounded-lg p-6 bg-muted/30">
          {/* Заголовок */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold">{templateName}</h1>
            {templateVersion && (
              <p className="text-sm text-muted-foreground mt-1">
                Версия: {templateVersion}
              </p>
            )}
          </div>

          {/* Тело документа */}
          <div className="prose prose-sm max-w-none dark:prose-invert mb-8">
            <div className="whitespace-pre-wrap break-words">
              {bodyText || "Текст документа отсутствует"}
            </div>
          </div>

          {/* Реквизиты */}
          {(organization || Object.keys(requisites).length > 0) && (
            <div className="border-t pt-6 mt-8">
              <h2 className="text-xl font-semibold mb-4">РЕКВИЗИТЫ</h2>

              {/* Информация об организации */}
              {organization && (
                <div className="space-y-2 mb-4">
                  {organization.name_full && (
                    <div className="grid grid-cols-[200px_1fr] gap-2">
                      <span className="text-muted-foreground">Полное наименование:</span>
                      <span>{organization.name_full}</span>
                    </div>
                  )}
                  {organization.inn && (
                    <div className="grid grid-cols-[200px_1fr] gap-2">
                      <span className="text-muted-foreground">ИНН:</span>
                      <span>{organization.inn}</span>
                    </div>
                  )}
                  {organization.kpp && (
                    <div className="grid grid-cols-[200px_1fr] gap-2">
                      <span className="text-muted-foreground">КПП:</span>
                      <span>{organization.kpp}</span>
                    </div>
                  )}
                  {organization.ogrn && (
                    <div className="grid grid-cols-[200px_1fr] gap-2">
                      <span className="text-muted-foreground">ОГРН:</span>
                      <span>{organization.ogrn}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Дополнительные реквизиты */}
              {Object.entries(requisites).map(([key, value]) => {
                if (!value || typeof value !== 'string') return null;

                const label = formatRequisiteLabel(key);
                return (
                  <div key={key} className="grid grid-cols-[200px_1fr] gap-2 mb-2">
                    <span className="text-muted-foreground">{label}:</span>
                    <span>{value}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Закрыть
          </Button>
          <Button variant="outline" onClick={onDownloadDOCX}>
            <Download className="w-4 h-4 mr-2" />
            Скачать DOCX
          </Button>
          <Button onClick={onDownloadPDF}>
            <Download className="w-4 h-4 mr-2" />
            Скачать PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Вспомогательная функция для форматирования меток реквизитов
function formatRequisiteLabel(key: string): string {
  const labels: Record<string, string> = {
    bank_name: 'Наименование банка',
    bank_bik: 'БИК',
    bank_corr_account: 'Корр. счёт',
    settlement_account: 'Расчётный счёт',
    legal_address: 'Юридический адрес',
    postal_address: 'Почтовый адрес',
    phone: 'Телефон',
    email: 'Email',
    ceo_name: 'Руководитель (ФИО)',
    ceo_position: 'Должность',
    accountant_name: 'Главный бухгалтер (ФИО)'
  };

  return labels[key] || key;
}
