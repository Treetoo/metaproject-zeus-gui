import z from 'zod';

// search by DOI
export const searchByDoiSchema = z.object({
	doi: z.string()
});

export type SearchByDoiSchema = z.infer<typeof searchByDoiSchema>;

// search by ORCID
export const searchByOrcidSchema = z.object({
	orcid: z.string()
});

export type SearchByOrcidSchema = z.infer<typeof searchByDoiSchema>;

// add publication manually
export const manualPublicationSchema = z.object({
	title: z.string(),
	authors: z.string(),
	journal: z.string(),
	year: z.number().min(0).max(2200)
});

export type ManualPublicationSchema = z.infer<typeof manualPublicationSchema>;
