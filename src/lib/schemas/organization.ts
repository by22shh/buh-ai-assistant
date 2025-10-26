import { z } from 'zod';

/**
 * Схема для создания организации
 */
export const createOrganizationSchema = z.object({
  name_full: z.string()
    .min(3, 'Полное наименование должно содержать минимум 3 символа')
    .max(500, 'Полное наименование не может превышать 500 символов'),

  name_short: z.string()
    .max(200, 'Краткое наименование не может превышать 200 символов')
    .optional()
    .nullable(),

  inn: z.string()
    .regex(/^\d{10}$|^\d{12}$/, 'ИНН должен содержать 10 или 12 цифр'),

  kpp: z.string()
    .regex(/^\d{9}$/, 'КПП должен содержать 9 цифр')
    .optional()
    .nullable(),

  ogrn: z.string()
    .regex(/^\d{13}$|^\d{15}$/, 'ОГРН должен содержать 13 или 15 цифр')
    .optional()
    .nullable(),

  legal_address: z.string()
    .max(500, 'Адрес не может превышать 500 символов')
    .optional()
    .nullable(),

  postal_address: z.string()
    .max(500, 'Адрес не может превышать 500 символов')
    .optional()
    .nullable(),

  phone: z.string()
    .regex(/^\+?[0-9\s\-()]{10,20}$/, 'Неверный формат телефона')
    .optional()
    .nullable(),

  email: z.string()
    .email('Неверный формат email')
    .optional()
    .nullable(),

  bank_name: z.string()
    .max(200, 'Название банка не может превышать 200 символов')
    .optional()
    .nullable(),

  bank_bik: z.string()
    .regex(/^\d{9}$/, 'БИК должен содержать 9 цифр')
    .optional()
    .nullable(),

  bank_corr_account: z.string()
    .regex(/^\d{20}$/, 'Корреспондентский счёт должен содержать 20 цифр')
    .optional()
    .nullable(),

  settlement_account: z.string()
    .regex(/^\d{20}$/, 'Расчётный счёт должен содержать 20 цифр')
    .optional()
    .nullable(),

  ceo_name: z.string()
    .max(200, 'ФИО руководителя не может превышать 200 символов')
    .optional()
    .nullable(),

  ceo_position: z.string()
    .max(200, 'Должность не может превышать 200 символов')
    .optional()
    .nullable(),

  accountant_name: z.string()
    .max(200, 'ФИО бухгалтера не может превышать 200 символов')
    .optional()
    .nullable(),
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
