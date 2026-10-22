import { z } from 'zod';

export const ESTADOS_PARTIDO = ['programado', 'finalizado'];

export const createPartidoSchema = z
  .object({
    localId: z
      .number({ required_error: 'El localId es obligatorio' })
      .int('El localId debe ser un entero')
      .positive('El localId debe ser positivo'),
    visitanteId: z
      .number({ required_error: 'El visitanteId es obligatorio' })
      .int('El visitanteId debe ser un entero')
      .positive('El visitanteId debe ser positivo'),
    fecha: z
      .string({ required_error: 'La fecha es obligatoria' })
      .date('La fecha debe tener formato YYYY-MM-DD válido'),
  })
  .refine((data) => data.localId !== data.visitanteId, {
    message: 'El equipo local y el visitante deben ser distintos',
    path: ['visitanteId'],
  });

export const updatePartidoSchema = z
  .object({
    localId: z.number().int().positive().optional(),
    visitanteId: z.number().int().positive().optional(),
    fecha: z.string().date('La fecha debe tener formato YYYY-MM-DD válido').optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Debe enviar al menos un campo para actualizar',
  })
  .refine(
    (data) => {
      if (data.localId !== undefined && data.visitanteId !== undefined) {
        return data.localId !== data.visitanteId;
      }
      return true;
    },
    {
      message: 'El equipo local y el visitante deben ser distintos',
      path: ['visitanteId'],
    }
  );

export const finalizarPartidoSchema = z.object({
  golesLocal: z
    .number({ required_error: 'Los goles del local son obligatorios' })
    .int('Los goles deben ser un número entero')
    .min(0, 'Los goles no pueden ser negativos'),
  golesVisitante: z
    .number({ required_error: 'Los goles del visitante son obligatorios' })
    .int('Los goles deben ser un número entero')
    .min(0, 'Los goles no pueden ser negativos'),
});

export const partidoIdParamSchema = z.object({
  id: z
    .string()
    .regex(/^\d+$/, 'El ID debe ser un número entero')
    .transform(Number),
});

export const partidoQuerySchema = z.object({
  estado: z.enum(ESTADOS_PARTIDO).optional(),
  equipoId: z
    .string()
    .regex(/^\d+$/, 'El equipoId debe ser un número entero')
    .transform(Number)
    .optional(),
});
