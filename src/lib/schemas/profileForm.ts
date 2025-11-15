import { z } from 'zod';

/**
 * Схема для формы редактирования профиля
 */
export const profileFormSchema = z.object({
  firstName: z.string()
    .max(100, 'Максимум 100 символов')
    .optional()
    .or(z.literal('')),

  lastName: z.string()
    .max(100, 'Максимум 100 символов')
    .optional()
    .or(z.literal('')),

  phone: z.string()
    .regex(/^\+?[0-9]{10,15}$/, 'Неверный формат телефона')
    .optional()
    .or(z.literal('')),

  email: z.string()
    .email('Неверный формат email')
    .optional()
    .or(z.literal('')),

  position: z.string()
    .max(200, 'Максимум 200 символов')
    .optional()
    .or(z.literal('')),

  company: z.string()
    .max(200, 'Максимум 200 символов')
    .optional()
    .or(z.literal('')),
});

export type ProfileFormData = z.infer<typeof profileFormSchema>;
