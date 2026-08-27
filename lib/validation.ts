import { z, ZodSchema } from 'zod';

/**
 * Validates input against a Zod schema.
 * Throws a structured error if validation fails.
 */
export function validateInput<T>(schema: ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    const message = result.error.errors.map(e => e.message).join(', ');
    throw Object.assign(new Error(message), { code: 'VALIDATION_ERROR', status: 400 });
  }
  return result.data;
}

// ─── Schemas ─────────────────────────────────────────────────────────────────

export const referralApplySchema = z.object({
  referralCode: z
    .string({ required_error: 'Referral code is required' })
    .min(3, 'Referral code must be at least 3 characters')
    .max(20, 'Referral code is too long')
    .trim(),
});

export const emailSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});