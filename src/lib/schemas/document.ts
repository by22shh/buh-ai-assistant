import { z } from 'zod';

/**
 * Схема для создания документа
 */
export const createDocumentSchema = z.object({
  organizationId: z.string().uuid().optional().nullable(),

  title: z.string()
    .max(500, 'Название не может превышать 500 символов')
    .optional()
    .nullable(),

  templateCode: z.string()
    .min(1, 'Код шаблона обязателен')
    .max(50, 'Код шаблона не может превышать 50 символов'),

  templateVersion: z.string()
    .min(1, 'Версия шаблона обязательна')
    .max(20, 'Версия не может превышать 20 символов'),

  bodyText: z.string()
    .max(50000, 'Текст документа не может превышать 50000 символов')
    .optional()
    .nullable(),

  requisites: z.record(z.string(), z.any()).optional().nullable(),

  hasBodyChat: z.boolean().default(false),
});

/**
 * Схема для обновления документа
 */
export const updateDocumentSchema = z.object({
  organizationId: z.string().uuid().optional().nullable(),

  title: z.string()
    .max(500, 'Название не может превышать 500 символов')
    .optional()
    .nullable(),

  bodyText: z.string()
    .max(50000, 'Текст документа не может превышать 50000 символов')
    .optional()
    .nullable(),

  requisites: z.record(z.string(), z.any()).optional().nullable(),

  hasBodyChat: z.boolean().optional(),
});

/**
 * Типы
 */
export type CreateDocumentInput = z.infer<typeof createDocumentSchema>;
export type UpdateDocumentInput = z.infer<typeof updateDocumentSchema>;
