"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useUser } from "@/hooks/useUser";
import { useOrganizations } from "@/hooks/useOrganizations";
import type { SubjectType, AuthorityBase, OrganizationFormData } from "@/lib/types/organization";
import { toast } from "sonner";
import { validateINN10, validateINN12, validateOGRN, validateOGRNIP, validateBankKS, validateBankRS, validateEmail, normalizePhone } from "@/lib/utils/validators";

export default function EditOrganizationPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const orgId = resolvedParams.id;
  const { organizations, updateOrganization, isLoading: orgsLoading } = useOrganizations();

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<OrganizationFormData>({
    is_default: false,
    subject_type: "legal_entity",
    name_full: "",
    name_short: "",
    inn: "",
    kpp: "",
    ogrn: "",
    ogrnip: "",
    okpo: "",
    okved: "",
    address_legal: "",
    address_postal: "",
    phone: "",
    email: "",
    website: "",
    head_title: "",
    head_fio: "",
    authority_base: "Устава",
    poa_number: "",
    poa_date: "",
    bank_bik: "",
    bank_name: "",
    bank_ks: "",
    bank_rs: "",
    seal_note: "",
    notes: "",
  });

  const { user, isLoading: userLoading } = useUser();

  useEffect(() => {
    if (!userLoading && !user) {
      router.push("/auth/login");
      return;
    }

    // Загрузка данных организации из API
    if (!orgsLoading && organizations.length > 0 && user) {
      const org = organizations.find(o => o.id === orgId);
      if (!org) {
        toast.error("Организация не найдена");
        router.push("/org");
        return;
      }

      // Заполняем форму данными организации
      setFormData({
        is_default: org.is_default || false,
        subject_type: org.subject_type,
        name_full: org.name_full,
        name_short: org.name_short,
        inn: org.inn,
        kpp: org.kpp,
        ogrn: org.ogrn,
        ogrnip: org.ogrnip,
        okpo: org.okpo,
        okved: org.okved,
        address_legal: org.address_legal,
        address_postal: org.address_postal,
        phone: org.phone,
        email: org.email,
        website: org.website,
        head_title: org.head_title,
        head_fio: org.head_fio,
        authority_base: org.authority_base,
        poa_number: org.poa_number,
        poa_date: org.poa_date,
        bank_bik: org.bank_bik,
        bank_name: org.bank_name,
        bank_ks: org.bank_ks,
        bank_rs: org.bank_rs,
        seal_note: org.seal_note,
        notes: org.notes
      });
    }
  }, [user, userLoading, router, orgId, orgsLoading, organizations]);

  if (userLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  // Loading state
  if (orgsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Загрузка...</p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Валидация
    if (formData.subject_type === "legal_entity") {
      if (!validateINN10(formData.inn)) {
        toast.error("ИНН юрлица должен содержать 10 цифр и проходить контрольную сумму");
        setLoading(false);
        return;
      }
      if (formData.kpp && !/^\d{9}$/.test(formData.kpp)) {
        toast.error("КПП должен содержать 9 цифр");
        setLoading(false);
        return;
      }
      if (formData.ogrn && !validateOGRN(formData.ogrn)) {
        toast.error("ОГРН должен содержать 13 цифр и проходить контрольную сумму");
        setLoading(false);
        return;
      }
    } else {
      if (!validateINN12(formData.inn)) {
        toast.error("ИНН ИП должен содержать 12 цифр и проходить контрольную сумму");
        setLoading(false);
        return;
      }
      if (formData.ogrnip && !validateOGRNIP(formData.ogrnip)) {
        toast.error("ОГРНИП должен содержать 15 цифр и проходить контрольную сумму");
        setLoading(false);
        return;
      }
    }

    if (!validateEmail(formData.email)) {
      toast.error("Некорректный формат email");
      setLoading(false);
      return;
    }

    // ВРЕМЕННО: Отключена клиентская валидация банковских счетов
    // Валидация будет происходить на сервере
    // if (!validateBankKS(formData.bank_bik, formData.bank_ks)) {
    //   toast.error("Корреспондентский счет не проходит контрольную проверку с БИК");
    //   setLoading(false);
    //   return;
    // }

    // if (!validateBankRS(formData.bank_bik, formData.bank_rs)) {
    //   toast.error("Расчетный счет не проходит контрольную проверку с БИК");
    //   setLoading(false);
    //   return;
    // }

    // Нормализация телефона
    if (formData.phone) {
      formData.phone = normalizePhone(formData.phone);
    }

    try {
      await updateOrganization(orgId, formData as any);
      // Toast показывается автоматически в hook
      router.push(`/org/${orgId}/view`);
    } catch (error) {
      // Ошибка обработана в hook
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/50">
      <header className="border-b bg-background">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold">Редактировать организацию</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Основные данные</CardTitle>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="is_default"
                    checked={formData.is_default}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, is_default: checked as boolean })
                    }
                  />
                  <Label htmlFor="is_default">Сделать по умолчанию</Label>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="subject_type">Тип субъекта *</Label>
                <Select
                  value={formData.subject_type}
                  onValueChange={(value) =>
                    setFormData({ ...formData, subject_type: value as SubjectType })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="legal_entity">Юридическое лицо</SelectItem>
                    <SelectItem value="sole_proprietor">Индивидуальный предприниматель</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="name_full">Полное наименование *</Label>
                <Input
                  id="name_full"
                  value={formData.name_full}
                  onChange={(e) => setFormData({ ...formData, name_full: e.target.value })}
                  required
                  minLength={2}
                  maxLength={150}
                />
              </div>

              <div>
                <Label htmlFor="name_short">Краткое наименование</Label>
                <Input
                  id="name_short"
                  value={formData.name_short || ""}
                  onChange={(e) => setFormData({ ...formData, name_short: e.target.value })}
                  maxLength={80}
                />
              </div>

              <div>
                <Label htmlFor="inn">ИНН *</Label>
                <Input
                  id="inn"
                  value={formData.inn}
                  onChange={(e) => setFormData({ ...formData, inn: e.target.value })}
                  required
                  placeholder={formData.subject_type === "legal_entity" ? "10 цифр" : "12 цифр"}
                />
              </div>

              {formData.subject_type === "legal_entity" && (
                <>
                  <div>
                    <Label htmlFor="kpp">КПП *</Label>
                    <Input
                      id="kpp"
                      value={formData.kpp || ""}
                      onChange={(e) => setFormData({ ...formData, kpp: e.target.value })}
                      required={formData.subject_type === "legal_entity"}
                      placeholder="9 цифр"
                    />
                  </div>
                  <div>
                    <Label htmlFor="ogrn">ОГРН *</Label>
                    <Input
                      id="ogrn"
                      value={formData.ogrn || ""}
                      onChange={(e) => setFormData({ ...formData, ogrn: e.target.value })}
                      required={formData.subject_type === "legal_entity"}
                      placeholder="13 цифр"
                    />
                  </div>
                </>
              )}

              {formData.subject_type === "sole_proprietor" && (
                <div>
                  <Label htmlFor="ogrnip">ОГРНИП *</Label>
                  <Input
                    id="ogrnip"
                    value={formData.ogrnip || ""}
                    onChange={(e) => setFormData({ ...formData, ogrnip: e.target.value })}
                    required={formData.subject_type === "sole_proprietor"}
                    placeholder="15 цифр"
                  />
                </div>
              )}

              <div>
                <Label htmlFor="okpo">ОКПО</Label>
                <Input
                  id="okpo"
                  value={formData.okpo || ""}
                  onChange={(e) => setFormData({ ...formData, okpo: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="okved">ОКВЭД</Label>
                <Input
                  id="okved"
                  value={formData.okved || ""}
                  onChange={(e) => setFormData({ ...formData, okved: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Адреса и контакты</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="address_legal">Юридический адрес *</Label>
                <Textarea
                  id="address_legal"
                  value={formData.address_legal}
                  onChange={(e) => setFormData({ ...formData, address_legal: e.target.value })}
                  required
                  minLength={5}
                  maxLength={200}
                />
              </div>

              <div>
                <Label htmlFor="address_postal">Почтовый адрес</Label>
                <Textarea
                  id="address_postal"
                  value={formData.address_postal || ""}
                  onChange={(e) => setFormData({ ...formData, address_postal: e.target.value })}
                  maxLength={200}
                />
              </div>

              <div>
                <Label htmlFor="phone">Телефон</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone || ""}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+7 или 8XXXXXXXXXX"
                />
              </div>

              <div>
                <Label htmlFor="email">E-mail *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="website">Веб-сайт</Label>
                <Input
                  id="website"
                  type="url"
                  value={formData.website || ""}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  placeholder="https://example.com"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Руководитель и полномочия</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="head_title">Должность руководителя *</Label>
                <Input
                  id="head_title"
                  value={formData.head_title}
                  onChange={(e) => setFormData({ ...formData, head_title: e.target.value })}
                  required
                  placeholder="Генеральный директор"
                />
              </div>

              <div>
                <Label htmlFor="head_fio">ФИО руководителя *</Label>
                <Input
                  id="head_fio"
                  value={formData.head_fio}
                  onChange={(e) => setFormData({ ...formData, head_fio: e.target.value })}
                  required
                  placeholder="Иванов Иван Иванович"
                />
              </div>

              <div>
                <Label htmlFor="authority_base">Действует на основании *</Label>
                <Select
                  value={formData.authority_base}
                  onValueChange={(value) =>
                    setFormData({ ...formData, authority_base: value as AuthorityBase })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Устава">Устава</SelectItem>
                    <SelectItem value="Доверенности">Доверенности</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.authority_base === "Доверенности" && (
                <>
                  <div>
                    <Label htmlFor="poa_number">Номер доверенности *</Label>
                    <Input
                      id="poa_number"
                      value={formData.poa_number || ""}
                      onChange={(e) => setFormData({ ...formData, poa_number: e.target.value })}
                      required={formData.authority_base === "Доверенности"}
                    />
                  </div>
                  <div>
                    <Label htmlFor="poa_date">Дата доверенности *</Label>
                    <Input
                      id="poa_date"
                      type="date"
                      value={formData.poa_date || ""}
                      onChange={(e) => setFormData({ ...formData, poa_date: e.target.value })}
                      required={formData.authority_base === "Доверенности"}
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Банковские реквизиты</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="bank_bik">БИК *</Label>
                <Input
                  id="bank_bik"
                  value={formData.bank_bik}
                  onChange={(e) => setFormData({ ...formData, bank_bik: e.target.value })}
                  required
                  placeholder="9 цифр"
                />
              </div>

              <div>
                <Label htmlFor="bank_name">Наименование банка *</Label>
                <Input
                  id="bank_name"
                  value={formData.bank_name}
                  onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="bank_ks">Корреспондентский счёт *</Label>
                <Input
                  id="bank_ks"
                  value={formData.bank_ks}
                  onChange={(e) => setFormData({ ...formData, bank_ks: e.target.value })}
                  required
                  placeholder="20 цифр"
                />
              </div>

              <div>
                <Label htmlFor="bank_rs">Расчётный счёт *</Label>
                <Input
                  id="bank_rs"
                  value={formData.bank_rs}
                  onChange={(e) => setFormData({ ...formData, bank_rs: e.target.value })}
                  required
                  placeholder="20 цифр"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Дополнительная информация</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="seal_note">Примечание о печати</Label>
                <Textarea
                  id="seal_note"
                  value={formData.seal_note || ""}
                  onChange={(e) => setFormData({ ...formData, seal_note: e.target.value })}
                  placeholder="Например: Без печати"
                />
              </div>

              <div>
                <Label htmlFor="notes">Заметки</Label>
                <Textarea
                  id="notes"
                  value={formData.notes || ""}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Дополнительная информация"
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "Сохранение..." : "Сохранить изменения"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(`/org/${orgId}/view`)}
              className="flex-1"
            >
              Отмена
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
