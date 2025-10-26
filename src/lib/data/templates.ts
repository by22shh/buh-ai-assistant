import { getTagByCode } from './tags';

export interface Template {
  code: string;
  nameRu: string;
  shortDescription: string;
  hasBodyChat: boolean;
  category: string;
  tags: string[];
  isEnabled: boolean;
  version: string;
}

export const templates: Template[] = [
  {
    code: "payment_order",
    nameRu: "Платёжное поручение (входящее/исходящее)",
    shortDescription: "Нужно для оформления безналичного перевода между организациями или ИП: фиксирует, кто, кому и за что перечисляет деньги.",
    hasBodyChat: false,
    category: "payments_and_settlements",
    tags: ["bank", "payment"],
    isEnabled: true,
    version: "v1.0"
  },
  {
    code: "invoice",
    nameRu: "Счёт на оплату",
    shortDescription: "Передаёт покупателю реквизиты и состав заказа, чтобы он мог корректно оплатить товары или услуги в срок.",
    hasBodyChat: false,
    category: "payments_and_settlements",
    tags: ["payment", "delivery", "services_works"],
    isEnabled: true,
    version: "v1.0"
  },
  {
    code: "upd",
    nameRu: "Универсальный передаточный документ (УПД)",
    shortDescription: "Подтверждает передачу товаров/работ/услуг и содержит данные для бухгалтерии и налогового учёта в одном документе.",
    hasBodyChat: false,
    category: "primary_documents",
    tags: ["delivery", "services_works", "contractor", "customer"],
    isEnabled: true,
    version: "v1.0"
  },
  {
    code: "torg12",
    nameRu: "Товарная накладная (ТОРГ-12)",
    shortDescription: "Фиксирует отгрузку и приёмку товаров: что, в каком количестве и на какую сумму передано покупателю.",
    hasBodyChat: false,
    category: "primary_documents",
    tags: ["delivery", "customer"],
    isEnabled: true,
    version: "v1.0"
  },
  {
    code: "vat_invoice",
    nameRu: "Счёт-фактура (в том числе электронный)",
    shortDescription: "Основание для учёта НДС: показывает стоимость, ставки и суммы налога по поставке.",
    hasBodyChat: false,
    category: "payments_and_settlements",
    tags: ["payment", "taxes_reporting"],
    isEnabled: true,
    version: "v1.0"
  },
  {
    code: "act_services",
    nameRu: "Акт выполненных работ / оказанных услуг",
    shortDescription: "Подтверждает факт и объём оказанных услуг или выполненных работ, служит базой для расчётов.",
    hasBodyChat: true,
    category: "primary_documents",
    tags: ["services_works", "contractor", "customer"],
    isEnabled: true,
    version: "v1.0"
  },
  {
    code: "order_t1",
    nameRu: "Приказ о приёме/увольнении (Т-1)",
    shortDescription: "Оформляет кадровое решение компании: назначение на должность или прекращение трудовых отношений.",
    hasBodyChat: false,
    category: "hr_and_personnel",
    tags: ["hr", "payroll"],
    isEnabled: true,
    version: "v1.0"
  },
  {
    code: "employment_contract",
    nameRu: "Трудовой договор с сотрудником",
    shortDescription: "Фиксирует условия работы: обязанности, режим, оплату, гарантии и ответственность сторон.",
    hasBodyChat: true,
    category: "hr_and_personnel",
    tags: ["contract", "hr", "payroll"],
    isEnabled: true,
    version: "v1.0"
  },
  {
    code: "timesheet_t13",
    nameRu: "Табель учёта рабочего времени (Т-13)",
    shortDescription: "Учитывает явки, неявки и часы сотрудников за период — основа для расчёта зарплаты и отчётности.",
    hasBodyChat: false,
    category: "hr_and_personnel",
    tags: ["hr", "payroll"],
    isEnabled: true,
    version: "v1.0"
  },
  {
    code: "payroll_slip",
    nameRu: "Расчётный листок по заработной плате",
    shortDescription: "Показывает сотруднику из чего сложилась зарплата: начисления, удержания, налоги и итог к выплате.",
    hasBodyChat: false,
    category: "hr_and_personnel",
    tags: ["payroll", "hr"],
    isEnabled: true,
    version: "v1.0"
  },
  {
    code: "application_leave_advance_trip",
    nameRu: "Заявление на отпуск / аванс / командировку",
    shortDescription: "Стандартная форма обращения сотрудника для оформления отпуска, выдачи аванса или служебной поездки.",
    hasBodyChat: false,
    category: "hr_and_personnel",
    tags: ["hr", "leave_trip"],
    isEnabled: true,
    version: "v1.0"
  },
  {
    code: "letter_tax_bank",
    nameRu: "Письмо в налоговую / банк (типовое)",
    shortDescription: "Деловое обращение по стандартным вопросам: запросы, пояснения, уведомления с ссылками на основания.",
    hasBodyChat: true,
    category: "taxes_and_reporting",
    tags: ["business_letter", "taxes_reporting", "bank"],
    isEnabled: true,
    version: "v1.0"
  },
  {
    code: "accounting_services_contract",
    nameRu: "Договор оказания бухгалтерских услуг / аутсорсинга",
    shortDescription: "Закрепляет условия предоставления бухуслуг: объём работ, сроки, стоимость и ответственность сторон.",
    hasBodyChat: true,
    category: "contracts_and_legal",
    tags: ["contract", "services_works", "contractor", "customer", "confidentiality"],
    isEnabled: true,
    version: "v1.0"
  },
  {
    code: "outsourcing_services_contract",
    nameRu: "Договор оказания услуг по аутсорсингу",
    shortDescription: "Определяет, какие услуги и в какие сроки оказывает исполнитель, а также требования к результату и расчётам.",
    hasBodyChat: true,
    category: "contracts_and_legal",
    tags: ["contract", "services_works", "contractor", "customer"],
    isEnabled: true,
    version: "v1.0"
  },
  {
    code: "contract_with_sole_proprietor",
    nameRu: "Договор с ИП или самозанятым",
    shortDescription: "Формализует сотрудничество с исполнителем-физлицом: предмет работ, сроки, порядок оплаты и права на результат.",
    hasBodyChat: true,
    category: "contracts_and_legal",
    tags: ["contract", "sole_proprietor", "services_works"],
    isEnabled: true,
    version: "v1.0"
  },
  {
    code: "power_of_attorney_accountant_manager",
    nameRu: "Доверенность на бухгалтера или управляющего",
    shortDescription: "Передаёт представителю право действовать от имени компании в конкретных операциях (например, по счёту или в банке).",
    hasBodyChat: true,
    category: "primary_documents",
    tags: ["bank", "hr"],
    isEnabled: true,
    version: "v1.0"
  },
  {
    code: "llc_charter",
    nameRu: "Устав ООО / изменения в устав",
    shortDescription: "Определяет правила работы компании: цели, органы управления, доли участников и порядок принятия решений.",
    hasBodyChat: true,
    category: "contracts_and_legal",
    tags: ["charter_corporate", "contract"],
    isEnabled: true,
    version: "v1.0"
  },
  {
    code: "nda",
    nameRu: "Типовой NDA с сотрудниками и контрагентами",
    shortDescription: "Защищает конфиденциальную информацию: что считается тайной, как её использовать и какая ответственность за разглашение.",
    hasBodyChat: true,
    category: "contracts_and_legal",
    tags: ["contract", "confidentiality"],
    isEnabled: true,
    version: "v1.0"
  },
  {
    code: "pko",
    nameRu: "ПКО (приходный кассовый ордер)",
    shortDescription: "Оформляет поступление наличных в кассу и фиксирует основание, сумму и дату внесения.",
    hasBodyChat: false,
    category: "cash_operations",
    tags: ["cash", "payment"],
    isEnabled: true,
    version: "v1.0"
  },
  {
    code: "rko",
    nameRu: "РКО (расходный кассовый ордер)",
    shortDescription: "Оформляет выдачу наличных из кассы и указывает кому, сколько и по какому основанию выданы средства.",
    hasBodyChat: false,
    category: "cash_operations",
    tags: ["cash", "payment"],
    isEnabled: true,
    version: "v1.0"
  },
  {
    code: "kudir",
    nameRu: "КУДиР",
    shortDescription: "Сводит доходы и расходы предпринимателя/организации на упрощённой системе — основа для налогового учёта.",
    hasBodyChat: false,
    category: "taxes_and_reporting",
    tags: ["taxes_reporting"],
    isEnabled: true,
    version: "v1.0"
  },
  {
    code: "usn_declaration",
    nameRu: "Декларация по УСН",
    shortDescription: "Отражает налоговую базу и расчёт налога при упрощённой системе налогообложения за отчётный период.",
    hasBodyChat: false,
    category: "taxes_and_reporting",
    tags: ["taxes_reporting"],
    isEnabled: true,
    version: "v1.0"
  },
  {
    code: "ndfl3_declaration",
    nameRu: "Декларация 3-НДФЛ",
    shortDescription: "Нужна физлицам для декларирования доходов и заявлений на вычеты, а также расчёта налога к возврату или доплате.",
    hasBodyChat: false,
    category: "taxes_and_reporting",
    tags: ["taxes_reporting"],
    isEnabled: true,
    version: "v1.0"
  },
  {
    code: "ndfl6_declaration",
    nameRu: "Декларация 6-НДФЛ",
    shortDescription: "Отчётность налогового агента по начисленному и удержанному НДФЛ и срокам перечислений.",
    hasBodyChat: false,
    category: "taxes_and_reporting",
    tags: ["taxes_reporting"],
    isEnabled: true,
    version: "v1.0"
  },
  {
    code: "rsv_calculation",
    nameRu: "Расчёт по страховым взносам (РСВ)",
    shortDescription: "Показывает начисленные и уплаченные страховые взносы за периоды, включая льготы и базы для расчёта.",
    hasBodyChat: false,
    category: "taxes_and_reporting",
    tags: ["taxes_reporting"],
    isEnabled: true,
    version: "v1.0"
  }
];

export const getTemplateByCode = (code: string): Template | undefined => {
  return templates.find(t => t.code === code);
};

export const getTemplatesByCategory = (categoryCode: string): Template[] => {
  return templates.filter(t => t.category === categoryCode && t.isEnabled);
};

export const getTemplatesByTags = (tagCodes: string[]): Template[] => {
  if (tagCodes.length === 0) return templates.filter(t => t.isEnabled);
  return templates.filter(t =>
    t.isEnabled && tagCodes.every(tag => t.tags.includes(tag))
  );
};

export const searchTemplates = (query: string): Template[] => {
  const lowerQuery = query.toLowerCase();
  return templates.filter(t =>
    t.isEnabled && (
      t.nameRu.toLowerCase().includes(lowerQuery) ||
      t.shortDescription.toLowerCase().includes(lowerQuery) ||
      t.tags.some(tag => {
        const tagObj = getTagByCode(tag);
        return tagObj?.nameRu.toLowerCase().includes(lowerQuery);
      })
    )
  );
};
