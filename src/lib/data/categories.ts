export interface Category {
  code: string;
  nameRu: string;
  description: string;
}

export const categories: Category[] = [
  {
    code: "payments_and_settlements",
    nameRu: "Платежи и расчёты",
    description: "Документы про безналичные расчёты, взаимодействие с банками и оплату поставок/услуг. Ищут, когда нужно «оформить платёж», «выставить счёт», «подтвердить расчёты»."
  },
  {
    code: "primary_documents",
    nameRu: "Первичные документы (первичка)",
    description: "Документы, фиксирующие хозяйственные операции (поставка, передача работ/услуг, полномочия). Основа бухгалтерского и налогового учёта (закрывающие документы)."
  },
  {
    code: "hr_and_personnel",
    nameRu: "Кадры и персонал",
    description: "Кадровые операции и взаимодействие с сотрудниками: приём/увольнение, договоры, заявления, учёт времени, зарплата."
  },
  {
    code: "contracts_and_legal",
    nameRu: "Договоры и юридические документы",
    description: "Долгие юридические тексты и корпоративные правила: договоры услуг, NDA, устав и изменения."
  },
  {
    code: "cash_operations",
    nameRu: "Касса",
    description: "Документы движения наличных денег: приход/расход из кассы."
  },
  {
    code: "taxes_and_reporting",
    nameRu: "Отчётность и налоги",
    description: "Регламентированная отчётность и налоговые регистры: декларации, расчёты, переписка с ФНС."
  }
];

export const getCategoryByCode = (code: string): Category | undefined => {
  return categories.find(c => c.code === code);
};
