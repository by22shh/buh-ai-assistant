export const FIELD_TYPES = [
  "text",
  "number",
  "date",
  "email",
  "phone",
  "select",
  "textarea",
  "inn",
  "ogrn",
  "bik",
  "account",
] as const;

export type FieldType = (typeof FIELD_TYPES)[number];

export interface FieldOption {
  value: string;
  label: string;
}

export interface RequisiteField {
  id: string;
  code: string; // name_full, inn, etc
  label: string; // "Полное наименование"
  fieldType: FieldType;
  required: boolean;
  autofillFromOrg: boolean; // подтягивать из организации
  placeholder?: string;
  helpText?: string;
  validation?: {
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    customValidator?: string; // название функции валидатора
  };
  options?: FieldOption[]; // для select
  order: number; // порядок отображения
}

export interface TemplateRequisites {
  templateCode: string;
  fields: RequisiteField[];
  placeholderBindings?: TemplatePlaceholderBinding[];
  appendMode?: "auto" | "disabled";
  updatedAt?: string;
  updatedBy?: string;
}

export type PlaceholderSource = "requisite" | "organization" | "system" | "custom";

export interface TemplatePlaceholderBinding {
  name: string;
  label: string;
  source: PlaceholderSource;
  fieldCode?: string;
  defaultValue?: string;
  required?: boolean;
  autofillFromOrg?: boolean;
  fieldDefinition?: RequisiteField;
}

export interface TemplateRequisitesConfig {
  fields?: RequisiteField[];
  placeholderBindings?: TemplatePlaceholderBinding[];
  appendMode?: "auto" | "disabled";
  version?: string;
  lastUpdated?: string;
  updatedBy?: string;
}

// Предустановленные поля для быстрого добавления
export const PRESET_FIELDS: Omit<RequisiteField, 'id' | 'order'>[] = [
  {
    code: "name_full",
    label: "Полное наименование организации",
    fieldType: "text",
    required: true,
    autofillFromOrg: true,
    validation: { minLength: 2, maxLength: 150 }
  },
  {
    code: "name_short",
    label: "Краткое наименование",
    fieldType: "text",
    required: false,
    autofillFromOrg: true,
    validation: { maxLength: 80 }
  },
  {
    code: "inn",
    label: "ИНН",
    fieldType: "inn",
    required: true,
    autofillFromOrg: true,
    placeholder: "10 или 12 цифр"
  },
  {
    code: "kpp",
    label: "КПП",
    fieldType: "text",
    required: false,
    autofillFromOrg: true,
    placeholder: "9 цифр",
    validation: { minLength: 9, maxLength: 9, pattern: "^\\d{9}$" }
  },
  {
    code: "ogrn",
    label: "ОГРН",
    fieldType: "ogrn",
    required: false,
    autofillFromOrg: true,
    placeholder: "13 цифр"
  },
  {
    code: "ogrnip",
    label: "ОГРНИП",
    fieldType: "text",
    required: false,
    autofillFromOrg: true,
    placeholder: "15 цифр",
    validation: { minLength: 15, maxLength: 15, pattern: "^\\d{15}$" }
  },
  {
    code: "address_legal",
    label: "Юридический адрес",
    fieldType: "textarea",
    required: true,
    autofillFromOrg: true,
    validation: { minLength: 5, maxLength: 200 }
  },
  {
    code: "address_postal",
    label: "Почтовый адрес",
    fieldType: "textarea",
    required: false,
    autofillFromOrg: true,
    validation: { maxLength: 200 }
  },
  {
    code: "phone",
    label: "Телефон",
    fieldType: "phone",
    required: false,
    autofillFromOrg: true,
    placeholder: "+7 или 8XXXXXXXXXX"
  },
  {
    code: "email",
    label: "Email",
    fieldType: "email",
    required: true,
    autofillFromOrg: true
  },
  {
    code: "head_title",
    label: "Должность руководителя",
    fieldType: "text",
    required: true,
    autofillFromOrg: true,
    placeholder: "Генеральный директор"
  },
  {
    code: "head_fio",
    label: "ФИО руководителя",
    fieldType: "text",
    required: true,
    autofillFromOrg: true,
    placeholder: "Иванов Иван Иванович"
  },
  {
    code: "authority_base",
    label: "Действует на основании",
    fieldType: "select",
    required: true,
    autofillFromOrg: true,
    options: [
      { value: "Устава", label: "Устава" },
      { value: "Доверенности", label: "Доверенности" }
    ]
  },
  {
    code: "bank_bik",
    label: "БИК банка",
    fieldType: "bik",
    required: true,
    autofillFromOrg: true,
    placeholder: "9 цифр"
  },
  {
    code: "bank_name",
    label: "Наименование банка",
    fieldType: "text",
    required: true,
    autofillFromOrg: true
  },
  {
    code: "bank_ks",
    label: "Корреспондентский счёт",
    fieldType: "account",
    required: true,
    autofillFromOrg: true,
    placeholder: "20 цифр"
  },
  {
    code: "bank_rs",
    label: "Расчётный счёт",
    fieldType: "account",
    required: true,
    autofillFromOrg: true,
    placeholder: "20 цифр"
  }
];
