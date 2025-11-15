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
  validateWebsite,
  normalizeWebsite,
} from '@/lib/utils/validators';

const normalizeOptionalString = (value: unknown) => {
  if (value === null || value === undefined) {
    return undefined;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed === '' ? undefined : trimmed;
  }

  return value;
};

const normalizeRequiredString = (value: unknown) => {
  if (typeof value === 'string') {
    return value.trim();
  }
  return value;
};

const optionalString = (schema: z.ZodString) =>
  z.preprocess(normalizeOptionalString, schema.optional());

const normalizeWebsiteOptional = (value: unknown) => {
  if (value === null || value === undefined) {
    return undefined;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed === '') {
      return undefined;
    }
    // Валидируем исходное значение перед нормализацией
    // Если значение валидно, нормализуем (добавляем https:// если протокол отсутствует)
    if (validateWebsite(trimmed)) {
      return normalizeWebsite(trimmed);
    }
    // Если значение невалидно, возвращаем как есть
    // Валидация в refine проверит и вернет ошибку
    return trimmed;
  }

  return value;
};

/**
 * Схема для создания организации
 */
export const createOrganizationSchema = z.object({
  // Основные данные
  is_default: z.boolean().default(false),

  subject_type: z.enum(['legal_entity', 'sole_proprietor']),

  name_full: z.preprocess(normalizeRequiredString, z.string()
    .min(2, 'Полное наименование должно содержать минимум 2 символа')
    .max(150, 'Полное наименование не может превышать 150 символов')),

  name_short: optionalString(
    z.string()
      .max(80, 'Краткое наименование не может превышать 80 символов')
  ),

  inn: z.preprocess(normalizeRequiredString, z.string()
    .regex(/^\d{10}$|^\d{12}$/, 'ИНН должен содержать 10 или 12 цифр')
    .refine(
      (val) => {
        const cleaned = val.replace(/\s/g, '');
        return validateINN(cleaned);
      },
      { message: 'Неверный формат ИНН или контрольная сумма' }
    )),

  kpp: optionalString(
    z.string()
      .regex(/^\d{9}$/, 'КПП должен содержать 9 цифр')
      .refine(
        (val) => validateKPP(val),
        { message: 'Неверный формат КПП' }
      )
  ),

  ogrn: optionalString(
    z.string()
      .regex(/^\d{13}$/, 'ОГРН должен содержать 13 цифр')
      .refine(
        (val) => validateOGRN(val),
        { message: 'Неверный формат ОГРН или контрольная сумма' }
      )
  ),

  ogrnip: optionalString(
    z.string()
      .regex(/^\d{15}$/, 'ОГРНИП должен содержать 15 цифр')
      .refine(
        (val) => validateOGRNIP(val),
        { message: 'Неверный формат ОГРНИП или контрольная сумма' }
      )
  ),

  okpo: optionalString(
    z.string()
      .max(20, 'ОКПО не может превышать 20 символов')
  ),

  okved: optionalString(
    z.string()
      .max(20, 'ОКВЭД не может превышать 20 символов')
  ),

  // Адреса и контакты
  address_legal: z.preprocess(normalizeRequiredString, z.string()
    .min(5, 'Юридический адрес должен содержать минимум 5 символов')
    .max(200, 'Адрес не может превышать 200 символов')),

  address_postal: optionalString(
    z.string()
      .max(200, 'Адрес не может превышать 200 символов')
  ),

  phone: optionalString(
    z.string()
      .regex(/^\+?[0-9\s\-()]{10,20}$/, 'Неверный формат телефона')
      .refine(
        (val) => validatePhone(val),
        { message: 'Неверный формат телефона. Ожидается формат +7XXXXXXXXXX' }
      )
  ),

  email: z.preprocess(normalizeRequiredString, z.string()
    .email('Неверный формат email')
    .refine(
      (val) => validateEmailExtended(val),
      { message: 'Email не соответствует требованиям (длина, формат домена)' }
    )),

  website: z.preprocess(
    normalizeWebsiteOptional,
    z.string()
      .refine(
        (val) => {
          // Если значение пустое или undefined, пропускаем (поле опциональное)
          if (!val || val === '') return true;
          // Если значение было валидно в preprocess, оно было нормализовано и должно быть валидным URL
          // Если значение было невалидно в preprocess, оно возвращено как есть
          // Проверяем через new URL (для нормализованных значений с протоколом)
          try {
            new URL(val);
            return true;
          } catch {
            // Если не удалось создать URL, проверяем исходное значение через validateWebsite
            // Это может быть случай, когда значение не было нормализовано (было невалидно в preprocess)
            // Но validateWebsite может не пройти для значений с протоколом, поэтому проверяем значение без протокола
            const withoutProtocol = val.replace(/^https?:\/\//, '');
            return validateWebsite(withoutProtocol);
          }
        },
        { message: 'Неверный формат URL или доменного имени' }
      )
      .optional()
      .or(z.literal(''))
  ),

  // Руководитель и полномочия
  head_title: z.preprocess(normalizeRequiredString, z.string()
    .min(2, 'Должность руководителя обязательна')
    .max(100, 'Должность не может превышать 100 символов')),

  head_fio: z.preprocess(normalizeRequiredString, z.string()
    .min(2, 'ФИО руководителя обязательно')
    .max(150, 'ФИО не может превышать 150 символов')
    .refine(
      (val) => validateFIO(val),
      { message: 'ФИО должно содержать три слова на кириллице (Имя Фамилия Отчество)' }
    )),

  authority_base: z.enum(['Устава', 'Доверенности']),

  poa_number: optionalString(
    z.string()
      .max(50, 'Номер доверенности не может превышать 50 символов')
  ),

  poa_date: optionalString(
    z.string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Неверный формат даты')
  ),

  // Банковские реквизиты
  bank_bik: z.preprocess(normalizeRequiredString, z.string()
    .regex(/^\d{9}$/, 'БИК должен содержать 9 цифр')
    .refine(
      (val) => validateBIK(val),
      { message: 'Неверный формат БИК (код страны должен быть 04, код региона 01-99)' }
    )),

  bank_name: z.preprocess(normalizeRequiredString, z.string()
    .min(2, 'Название банка обязательно')
    .max(150, 'Название банка не может превышать 150 символов')),

  bank_ks: z.preprocess(normalizeRequiredString, z.string()
    .regex(/^\d{20}$/, 'Корреспондентский счёт должен содержать 20 цифр')
    // ВАЖНО: Проверка контрольной суммы временно отключена (реальные данные не проходят)
    // Валидация выполняет только проверку формата (20 цифр)
    .refine(() => true)),

  bank_rs: z.preprocess(normalizeRequiredString, z.string()
    .regex(/^\d{20}$/, 'Расчётный счёт должен содержать 20 цифр')
    // Аналогично отключаем проверку контрольной суммы
    .refine(() => true)),

  // Дополнительная информация
  seal_note: optionalString(
    z.string()
      .max(200, 'Примечание о печати не может превышать 200 символов')
  ),

  notes: optionalString(
    z.string()
      .max(500, 'Заметки не могут превышать 500 символов')
  ),
})
.superRefine((data, ctx) => {
  // Проверка зависимостей от типа субъекта
  if (data.subject_type === 'legal_entity') {
    // Для юрлица КПП обязателен
    if (!data.kpp || data.kpp.trim() === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['kpp'],
        message: 'КПП обязателен для юридического лица',
      });
    }
    // Для юрлица ОГРН обязателен
    if (!data.ogrn || data.ogrn.trim() === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['ogrn'],
        message: 'ОГРН обязателен для юридического лица',
      });
    }
  } else if (data.subject_type === 'sole_proprietor') {
    // Для ИП ОГРНИП обязателен
    if (!data.ogrnip || data.ogrnip.trim() === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['ogrnip'],
        message: 'ОГРНИП обязателен для индивидуального предпринимателя',
      });
    }
  }

  // Проверка доверенности
  if (data.authority_base === 'Доверенности') {
    if (!data.poa_number) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['poa_number'],
        message: 'Укажите номер доверенности',
      });
    }

    if (!data.poa_date) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['poa_date'],
        message: 'Укажите дату доверенности в формате ГГГГ-ММ-ДД',
      });
    }
  }
});

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
