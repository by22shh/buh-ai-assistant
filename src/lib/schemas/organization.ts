import { z } from 'zod';
import {
  validateINN,
  validateKPP,
  validateOGRN,
  validateOGRNIP,
  validateBIK,
  validateBankKSExtended,
  validateBankRSExtended,
  validatePhone,
  validateEmailExtended,
  validateFIO,
} from '@/lib/utils/validators';

/**
 * Схема для создания организации
 */
export const createOrganizationSchema = z.object({
  // Основные данные
  is_default: z.boolean().default(false),

  subject_type: z.enum(['legal_entity', 'sole_proprietor']),

  name_full: z.string()
    .min(2, 'Полное наименование должно содержать минимум 2 символа')
    .max(150, 'Полное наименование не может превышать 150 символов'),

  name_short: z.string()
    .max(80, 'Краткое наименование не может превышать 80 символов')
    .optional()
    .nullable(),

  inn: z.string()
    .regex(/^\d{10}$|^\d{12}$/, 'ИНН должен содержать 10 или 12 цифр')
    .refine(
      (val) => {
        const cleaned = val.replace(/\s/g, '');
        return validateINN(cleaned);
      },
      { message: 'Неверный формат ИНН или контрольная сумма' }
    ),

  kpp: z.string()
    .regex(/^\d{9}$/, 'КПП должен содержать 9 цифр')
    .optional()
    .nullable()
    .refine(
      (val) => !val || validateKPP(val),
      { message: 'Неверный формат КПП' }
    ),

  ogrn: z.string()
    .regex(/^\d{13}$/, 'ОГРН должен содержать 13 цифр')
    .optional()
    .nullable()
    .refine(
      (val) => !val || validateOGRN(val),
      { message: 'Неверный формат ОГРН или контрольная сумма' }
    ),

  ogrnip: z.string()
    .regex(/^\d{15}$/, 'ОГРНИП должен содержать 15 цифр')
    .optional()
    .nullable()
    .refine(
      (val) => !val || validateOGRNIP(val),
      { message: 'Неверный формат ОГРНИП или контрольная сумма' }
    ),

  okpo: z.string()
    .max(20, 'ОКПО не может превышать 20 символов')
    .optional()
    .nullable(),

  okved: z.string()
    .max(20, 'ОКВЭД не может превышать 20 символов')
    .optional()
    .nullable(),

  // Адреса и контакты
  address_legal: z.string()
    .min(5, 'Юридический адрес должен содержать минимум 5 символов')
    .max(200, 'Адрес не может превышать 200 символов'),

  address_postal: z.string()
    .max(200, 'Адрес не может превышать 200 символов')
    .optional()
    .nullable(),

  phone: z.string()
    .regex(/^\+?[0-9\s\-()]{10,20}$/, 'Неверный формат телефона')
    .optional()
    .nullable()
    .refine(
      (val) => !val || validatePhone(val),
      { message: 'Неверный формат телефона. Ожидается формат +7XXXXXXXXXX' }
    ),

  email: z.string()
    .email('Неверный формат email')
    .refine(
      (val) => validateEmailExtended(val),
      { message: 'Email не соответствует требованиям (длина, формат домена)' }
    ),

  website: z.string()
    .url('Неверный формат URL')
    .optional()
    .nullable(),

  // Руководитель и полномочия
  head_title: z.string()
    .min(2, 'Должность руководителя обязательна')
    .max(100, 'Должность не может превышать 100 символов'),

  head_fio: z.string()
    .min(2, 'ФИО руководителя обязательно')
    .max(150, 'ФИО не может превышать 150 символов')
    .refine(
      (val) => validateFIO(val),
      { message: 'ФИО должно содержать три слова на кириллице (Имя Фамилия Отчество)' }
    ),

  authority_base: z.enum(['Устава', 'Доверенности']),

  poa_number: z.string()
    .max(50, 'Номер доверенности не может превышать 50 символов')
    .optional()
    .nullable(),

  poa_date: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Неверный формат даты')
    .optional()
    .nullable(),

  // Банковские реквизиты
  bank_bik: z.string()
    .regex(/^\d{9}$/, 'БИК должен содержать 9 цифр')
    .refine(
      (val) => validateBIK(val),
      { message: 'Неверный формат БИК (код страны должен быть 04, код региона 01-99)' }
    ),

  bank_name: z.string()
    .min(2, 'Название банка обязательно')
    .max(150, 'Название банка не может превышать 150 символов'),

  bank_ks: z.string()
    .regex(/^\d{20}$/, 'Корреспондентский счёт должен содержать 20 цифр')
    .refine(
      (val, ctx) => {
        const bik = ctx.parent.bank_bik;
        if (!bik) return false;
        return validateBankKSExtended(val, bik);
      },
      { message: 'Неверный корреспондентский счёт или контрольная сумма (должен начинаться с 301 и соответствовать БИК)' }
    ),

  bank_rs: z.string()
    .regex(/^\d{20}$/, 'Расчётный счёт должен содержать 20 цифр')
    .refine(
      (val, ctx) => {
        const bik = ctx.parent.bank_bik;
        if (!bik) return false;
        return validateBankRSExtended(val, bik);
      },
      { message: 'Неверный расчётный счёт или контрольная сумма (должен соответствовать БИК)' }
    ),

  // Дополнительная информация
  seal_note: z.string()
    .max(200, 'Примечание о печати не может превышать 200 символов')
    .optional()
    .nullable(),

  notes: z.string()
    .max(500, 'Заметки не могут превышать 500 символов')
    .optional()
    .nullable(),
})
.refine(
  (data) => {
    const cleanedInn = data.inn.replace(/\s/g, '');
    
    // Для юридических лиц (legal_entity) должен быть ИНН-10, КПП и ОГРН
    if (data.subject_type === 'legal_entity') {
      if (cleanedInn.length !== 10) {
        return false;
      }
      // Юридическим лицам обязателен КПП
      if (!data.kpp) {
        return false;
      }
      // ОГРН должен быть указан для юридических лиц
      if (!data.ogrn) {
        return false;
      }
    }
    
    // Для ИП (sole_proprietor) должен быть ИНН-12 и ОГРНИП
    if (data.subject_type === 'sole_proprietor') {
      if (cleanedInn.length !== 12) {
        return false;
      }
      // ОГРНИП должен быть указан для ИП
      if (!data.ogrnip) {
        return false;
      }
    }
    
    return true;
  },
  {
    message: 'Несоответствие типа субъекта: юридические лица должны иметь ИНН-10, КПП и ОГРН; ИП должны иметь ИНН-12 и ОГРНИП',
    path: ['subject_type'],
  }
);

/**
 * Схема для обновления организации (все поля опциональны)
 */
export const updateOrganizationSchema = createOrganizationSchema.partial();

/**
 * Тип для создания организации
 */
export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>;

/**
 * Тип для обновления организации
 */
export type UpdateOrganizationInput = z.infer<typeof updateOrganizationSchema>;
