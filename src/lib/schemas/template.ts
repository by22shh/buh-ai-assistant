import { z } from 'zod';

/**
 * Схема для создания шаблона
 */
export const createTemplateSchema = z.object({
  code: z.string()
    .min(1, 'Код шаблона обязателен')
    .max(50, 'Код шаблона не может превышать 50 символов')
    .regex(/^[a-z0-9_-]+$/, 'Код шаблона может содержать только строчные буквы, цифры, дефисы и подчёркивания'),

  nameRu: z.string()
    .min(1, 'Название обязательно')
    .max(200, 'Название не может превышать 200 символов'),

  shortDescription: z.string()
    .min(1, 'Краткое описание обязательно')
    .max(500, 'Краткое описание не может превышать 500 символов'),

  hasBodyChat: z.boolean().default(false),

  category: z.string()
    .min(1, 'Категория обязательна')
    .max(100, 'Категория не может превышать 100 символов'),

  tags: z.array(z.string().max(50, 'Тег не может превышать 50 символов')).default([]),

  isEnabled: z.boolean().default(true),

  version: z.string()
    .min(1, 'Версия обязательна')
    .max(20, 'Версия не может превышать 20 символов'),
});

/**
 * Схема для обновления шаблона (все поля опциональны)
 */
export const updateTemplateSchema = z.object({
  nameRu: z.string()
    .min(1, 'Название обязательно')
    .max(200, 'Название не может превышать 200 символов')
    .optional(),

  shortDescription: z.string()
    .min(1, 'Краткое описание обязательно')
    .max(500, 'Краткое описание не может превышать 500 символов')
    .optional(),

  hasBodyChat: z.boolean().optional(),

  category: z.string()
    .min(1, 'Категория обязательна')
    .max(100, 'Категория не может превышать 100 символов')
    .optional(),

  tags: z.array(z.string().max(50, 'Тег не может превышать 50 символов')).optional(),

  isEnabled: z.boolean().optional(),

  version: z.string()
    .min(1, 'Версия обязательна')
    .max(20, 'Версия не может превышать 20 символов')
    .optional(),
});

/**
 * Схема для конфигурации реквизитов шаблона
 */
export const templateConfigSchema = z.object({
  templateCode: z.string()
    .min(1, 'Код шаблона обязателен')
    .max(50, 'Код шаблона не может превышать 50 символов'),

  requisitesConfig: z.record(z.string(), z.any()).optional().nullable(),
});

/**
 * Типы
 */
export type CreateTemplateInput = z.infer<typeof createTemplateSchema>;
export type UpdateTemplateInput = z.infer<typeof updateTemplateSchema>;
export type TemplateConfigInput = z.infer<typeof templateConfigSchema>;

const PLACEHOLDER_CODE_REGEX = /^[a-zA-Z][a-zA-Z0-9._:-]{1,63}$/;

const fieldTypeEnum = z.enum([
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
]);

const fieldOptionSchema = z.object({
  value: z.string().min(1).max(200),
  label: z.string().min(1).max(200),
});

export const placeholderBindingSchema = z.object({
  name: z.string().regex(PLACEHOLDER_CODE_REGEX, "Некорректный код плейсхолдера"),
  label: z.string().min(1, "Название обязательно").max(200, "Название не может превышать 200 символов"),
  source: z.enum(["requisite", "organization", "system", "custom"]),
  fieldCode: z.string().min(1).max(100).optional(),
  defaultValue: z.string().max(500).optional(),
  required: z.boolean().optional(),
  autofillFromOrg: z.boolean().optional(),
  fieldDefinition: z
    .object({
      id: z.string().optional(),
      code: z.string().regex(PLACEHOLDER_CODE_REGEX, "Некорректный код поля"),
      label: z.string().min(1).max(200),
      fieldType: fieldTypeEnum,
      required: z.boolean(),
      autofillFromOrg: z.boolean(),
      placeholder: z.string().max(200).optional(),
      helpText: z.string().max(500).optional(),
      validation: z
        .object({
          minLength: z.number().int().min(0).optional(),
          maxLength: z.number().int().min(0).optional(),
          pattern: z.string().max(200).optional(),
          customValidator: z.string().max(100).optional(),
        })
        .optional(),
      options: z.array(fieldOptionSchema).optional(),
      order: z.number().int().min(0).optional(),
    })
    .optional(),
});

export const finalizeTemplateBodySchema = z.object({
  templateCode: z.string().min(1),
  uploadId: z.string().uuid().optional(),
  placeholders: z.array(placeholderBindingSchema),
  appendMode: z.enum(["auto", "disabled"]).default("auto"),
  previewText: z.string().optional(),
});

export type PlaceholderBindingInput = z.infer<typeof placeholderBindingSchema>;
export type FinalizeTemplateBodyInput = z.infer<typeof finalizeTemplateBodySchema>;

















