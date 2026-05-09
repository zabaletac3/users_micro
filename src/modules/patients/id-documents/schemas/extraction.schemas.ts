import { z } from 'zod';

/**
 * Unified extraction schema shared by all document-type agents.
 * Fields absent in a given document type are returned as null.
 * Uses .nullable() instead of .optional() because OpenAI structured output
 * requires all properties in `required` and does not support `undefined`.
 */
export const extractedFieldsSchema = z.object({
  documentType: z
    .enum(['CC', 'TI', 'CE', 'PA', 'PPT', 'NIT'])
    .describe('Sigla del tipo de documento identificado'),

  documentNumber: z
    .string()
    .describe('Número del documento tal cual aparece, sin puntos ni espacios'),

  firstName: z.string().nullable().describe('Primer nombre'),
  middleName: z.string().nullable().describe('Segundo nombre (si aplica)'),
  firstLastName: z.string().nullable().describe('Primer apellido'),
  secondLastName: z.string().nullable().describe('Segundo apellido (si aplica)'),

  birthDate: z.string().nullable().describe('Fecha de nacimiento en formato YYYY-MM-DD'),

  gender: z.enum(['male', 'female']).nullable().describe('Sexo: "male" o "female"'),

  bloodType: z
    .enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'])
    .nullable()
    .describe('Grupo sanguíneo y RH (ej: "O+", "A-")'),

  birthCountry: z.string().nullable().describe('País de nacimiento'),
  birthDepartment: z.string().nullable().describe('Departamento de nacimiento'),
  birthCity: z.string().nullable().describe('Ciudad/municipio de nacimiento'),

  expeditionDate: z.string().nullable().describe('Fecha de expedición en formato YYYY-MM-DD'),

  expeditionPlace: z.string().nullable().describe('Lugar de expedición'),

  height: z.number().nullable().describe('Estatura en centímetros'),
});

export type ExtractedFields = z.infer<typeof extractedFieldsSchema>;
