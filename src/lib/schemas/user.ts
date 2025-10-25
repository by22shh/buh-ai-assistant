import { z } from 'zod';

/**
 * Схема для обновления профиля
 */
export const updateUserSchema = z.object({
  firstName: z.string()
    .max(100, 'Имя не может превышать 100 символов')
    .optional()
    .nullable(),

  lastName: z.string()
    .max(100, 'Фамилия не может превышать 100 символов')
    .optional()
    .nullable(),

  email: z.string()
    .email('Неверный формат email')
    .optional()
    .nullable(),

  position: z.string()
    .max(200, 'Должность не может превышать 200 символов')
    .optional()
    .nullable(),

  company: z.string()
    .max(200, 'Компания не может превышать 200 символов')
    .optional()
    .nullable(),
});

/**
 * Схема для логина
 */
export const loginUserSchema = z.object({
  phone: z.string()
    .regex(/^\+?[0-9]{10,15}$/, 'Неверный формат телефона'),

  firstName: z.string().max(100).optional().nullable(),
  lastName: z.string().max(100).optional().nullable(),
  email: z.string().email().optional().nullable(),
  position: z.string().max(200).optional().nullable(),
  company: z.string().max(200).optional().nullable(),
});

/**
 * Типы
 */
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type LoginUserInput = z.infer<typeof loginUserSchema>;
