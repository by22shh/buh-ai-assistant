import { z } from 'zod';
import { validateWebsite } from '@/lib/utils/validators';

/**
 * Схема для формы создания/редактирования организации
 * Включает все поля, которые есть в UI формах
 */
export const organizationFormSchema = z.object({
  is_default: z.boolean().default(false),

  subject_type: z.enum(['legal_entity', 'sole_proprietor']),

  name_full: z.string()
    .min(2, 'Минимум 2 символа')
    .max(150, 'Максимум 150 символов'),

  name_short: z.string()
    .max(80, 'Максимум 80 символов')
    .optional()
    .or(z.literal('')),

  inn: z.string()
    .min(1, 'ИНН обязателен')
    .regex(/^\d{10}$|^\d{12}$/, 'ИНН должен содержать 10 или 12 цифр'),

  kpp: z.string()
    .regex(/^\d{9}$/, 'КПП должен содержать 9 цифр')
    .optional()
    .or(z.literal('')),

  ogrn: z.string()
    .regex(/^\d{13}$/, 'ОГРН должен содержать 13 цифр')
    .optional()
    .or(z.literal('')),

  ogrnip: z.string()
    .regex(/^\d{15}$/, 'ОГРНИП должен содержать 15 цифр')
    .optional()
    .or(z.literal('')),

  okpo: z.string()
    .max(20)
    .optional()
    .or(z.literal('')),

  okved: z.string()
    .max(50)
    .optional()
    .or(z.literal('')),

  address_legal: z.string()
    .min(5, 'Минимум 5 символов')
    .max(200, 'Максимум 200 символов'),

  address_postal: z.string()
    .max(200, 'Максимум 200 символов')
    .optional()
    .or(z.literal('')),

  phone: z.string()
    .optional()
    .or(z.literal('')),

  email: z.string()
    .email('Неверный формат email')
    .min(1, 'Email обязателен'),

  website: z.string()
    .refine(
      (val) => !val || val === '' || validateWebsite(val),
      { message: 'Неверный формат URL или доменного имени' }
    )
    .optional()
    .or(z.literal('')),

  head_title: z.string()
    .min(1, 'Должность руководителя обязательна'),

  head_fio: z.string()
    .min(1, 'ФИО руководителя обязательно'),

  authority_base: z.enum(['Устава', 'Доверенности']),

  poa_number: z.string()
    .optional()
    .or(z.literal('')),

  poa_date: z.string()
    .optional()
    .or(z.literal('')),

  bank_bik: z.string()
    .regex(/^\d{9}$/, 'БИК должен содержать 9 цифр')
    .min(1, 'БИК обязателен'),

  bank_name: z.string()
    .min(1, 'Наименование банка обязательно'),

  bank_ks: z.string()
    .regex(/^\d{20}$/, 'Корр. счёт должен содержать 20 цифр')
    .min(1, 'Корр. счёт обязателен'),

  bank_rs: z.string()
    .regex(/^\d{20}$/, 'Расч. счёт должен содержать 20 цифр')
    .min(1, 'Расч. счёт обязателен'),

  seal_note: z.string()
    .optional()
    .or(z.literal('')),

  notes: z.string()
    .optional()
    .or(z.literal('')),
})
// Кастомная валидация в зависимости от типа субъекта
.refine(
  (data) => {
    if (data.subject_type === 'legal_entity') {
      return !!data.kpp && !!data.ogrn;
    }
    return true;
  },
  {
    message: 'КПП и ОГРН обязательны для юридического лица',
    path: ['kpp'],
  }
)
.refine(
  (data) => {
    if (data.subject_type === 'sole_proprietor') {
      return !!data.ogrnip;
    }
    return true;
  },
  {
    message: 'ОГРНИП обязателен для ИП',
    path: ['ogrnip'],
  }
)
.refine(
  (data) => {
    if (data.authority_base === 'Доверенности') {
      return !!data.poa_number && !!data.poa_date;
    }
    return true;
  },
  {
    message: 'Номер и дата доверенности обязательны',
    path: ['poa_number'],
  }
);

export type OrganizationFormData = z.infer<typeof organizationFormSchema>;
