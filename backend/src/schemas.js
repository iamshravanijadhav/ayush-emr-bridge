import { z } from 'zod';

export const patientSchema = z.object({
  displayName: z.string().trim().min(2).max(100),
  birthYear: z.number().int().min(1900).max(new Date().getFullYear()).optional(),
  sex: z.enum(['female', 'male', 'other', 'not_recorded']).default('not_recorded')
});

export const encounterSchema = z.object({
  system: z.enum(['MODERN_MEDICINE', 'AYUSH']),
  ayushDiscipline: z.enum(['Ayurveda', 'Yoga', 'Unani', 'Siddha', 'Homeopathy', 'Other']).optional(),
  encounterDate: z.string().date(),
  diagnosisTerm: z.string().trim().min(2).max(200),
  diagnosisCode: z.string().trim().max(80).optional().or(z.literal('')),
  terminologySystem: z.string().trim().min(2).max(80),
  medicines: z.array(z.string().trim().min(1).max(160)).max(20).default([]),
  notes: z.string().trim().max(2000).optional().default('')
}).superRefine((value, ctx) => {
  if (value.system === 'AYUSH' && !value.ayushDiscipline) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['ayushDiscipline'], message: 'Choose an AYUSH discipline.' });
  }
});

export const reviewDecisionSchema = z.object({
  decision: z.enum(['approve', 'reject']),
  reviewerNotes: z.string().trim().max(1000).optional().default('')
});
