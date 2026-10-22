import { z } from 'zod';

export const POSICIONES = ['ARQUERO', 'DEFENSOR', 'MEDIOCAMPISTA', 'DELANTERO'];

export const createJugadorSchema = z.object({
  nombre: z
    .string({ required_error: 'El nombre es obligatorio' })
    .trim()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres'),
  apellido: z
    .string({ required_error: 'El apellido es obligatorio' })
    .trim()
    .min(2, 'El apellido debe tener al menos 2 caracteres')
    .max(100, 'El apellido no puede exceder 100 caracteres'),
  dni: z
    .string({ required_error: 'El DNI es obligatorio' })
    .trim()
    .regex(/^\d{7,8}$/, 'El DNI debe contener 7 u 8 dígitos numéricos sin puntos'),
  numeroCamiseta: z
    .number({ required_error: 'El número de camiseta es obligatorio' })
    .int('El número de camiseta debe ser un entero')
    .min(1, 'El número de camiseta debe ser al menos 1')
    .max(99, 'El número de camiseta no puede ser mayor a 99'),
  posicion: z.enum(POSICIONES, {
    errorMap: () => ({
      message: `La posición debe ser una de las siguientes: ${POSICIONES.join(', ')}`,
    }),
  }),
  equipoId: z
    .number({ required_error: 'El equipoId es obligatorio' })
    .int('El equipoId debe ser un entero')
    .positive('El equipoId debe ser un ID positivo'),
});

export const updateJugadorSchema = createJugadorSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Debe enviar al menos un campo para actualizar',
  });

export const jugadorIdParamSchema = z.object({
  id: z
    .string()
    .regex(/^\d+$/, 'El ID debe ser un número entero')
    .transform(Number),
});

export const jugadorQuerySchema = z.object({
  equipoId: z
    .string()
    .regex(/^\d+$/, 'El equipoId debe ser un número entero')
    .transform(Number)
    .optional(),
  posicion: z.enum(POSICIONES).optional(),
});
