import { z } from 'zod';

export const createEquipoSchema = z.object({
  nombre: z
    .string({ required_error: 'El nombre es obligatorio' })
    .trim()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres'),
  barrio: z
    .string({ required_error: 'El barrio es obligatorio' })
    .trim()
    .min(2, 'El barrio debe tener al menos 2 caracteres')
    .max(100, 'El barrio no puede exceder 100 caracteres'),
  colores: z
    .string({ required_error: 'Los colores son obligatorios' })
    .trim()
    .min(2, 'Los colores deben tener al menos 2 caracteres')
    .max(100, 'Los colores no pueden exceder 100 caracteres'),
  fechaFundacion: z
    .string({ required_error: 'La fecha de fundación es obligatoria' })
    .date('La fecha de fundación debe ser una fecha válida con formato YYYY-MM-DD'),
});

export const updateEquipoSchema = createEquipoSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Debe enviar al menos un campo para actualizar',
  });

export const equipoIdParamSchema = z.object({
  id: z
    .string()
    .regex(/^\d+$/, 'El ID debe ser un número entero')
    .transform(Number),
});
