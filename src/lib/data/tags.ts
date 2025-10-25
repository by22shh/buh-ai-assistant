export interface Tag {
  code: string;
  nameRu: string;
  description: string;
}

export const tags: Tag[] = [
  { code: "bank", nameRu: "Банк", description: "Всё про банковские операции: реквизиты банка, БИК, р/с, к/с, взаимодействие с банком." },
  { code: "payment", nameRu: "Оплата", description: "Расчёты за товары/услуги: выставление, оплата, погашение, условия оплаты." },
  { code: "delivery", nameRu: "Поставка", description: "Отгрузка и передача материальных ценностей: товары, количество, условия поставки." },
  { code: "services_works", nameRu: "Услуги/работы", description: "Оказание услуг и выполнение работ: объём, период, результат, закрывающие документы." },
  { code: "business_letter", nameRu: "Деловое письмо", description: "Официальные обращения: письма в ФНС/банк и др. организации, запросы, пояснения." },
  { code: "hr", nameRu: "Кадры", description: "Кадровые процессы: приём/увольнение, приказы, заявления, кадровые данные." },
  { code: "payroll", nameRu: "Зарплата", description: "Начисления, удержания, налоги и сведения по оплате труда." },
  { code: "leave_trip", nameRu: "Отпуск/командировка", description: "Отпуска, командировки, авансы и связанные заявления." },
  { code: "contract", nameRu: "Договор", description: "Договорные отношения: условия, предмет, сроки, расчёты, ответственность." },
  { code: "confidentiality", nameRu: "Конфиденциальность", description: "Защита информации: NDA, режим неразглашения и исключения." },
  { code: "charter_corporate", nameRu: "Устав/корпоративное", description: "Уставные документы и корпоративное управление: цели, органы, доли, решения." },
  { code: "taxes_reporting", nameRu: "Налоги/отчётность", description: "Налоговые декларации, регистры, переписка с ФНС." },
  { code: "cash", nameRu: "Наличные/касса", description: "Операции с наличностью: приход/расход по кассе." },
  { code: "sole_proprietor", nameRu: "ИП/самозанятый", description: "Взаимодействие с исполнителями-физлицами и ИП." },
  { code: "contractor", nameRu: "Исполнитель/подрядчик", description: "Роль исполнителя/подрядчика в отношениях сторон." },
  { code: "customer", nameRu: "Заказчик/покупатель", description: "Роль второй стороны: заказчик, покупатель, клиент." }
];

export const getTagByCode = (code: string): Tag | undefined => {
  return tags.find(t => t.code === code);
};
