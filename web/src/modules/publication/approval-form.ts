import z from 'zod';

export const approvalSchema = z.object({
	weight: z.number().int().min(1).max(3).optional(),
	reviewerNote: z.string().optional()
});

export type ApprovalFormData = z.infer<typeof approvalSchema>;
