import z, { number } from 'zod';

// search by DOI
export const searchByPubIdSchema = z.object({
	publicationId: z.string()
});

export type SearchByPubIdSchema = z.infer<typeof searchByPubIdSchema>;

// search by ORCID
export const searchByResearcherIdSchema = z.object({
	researcherId: z.string()
});

export type SearchByResearcherIdSchema = z.infer<typeof searchByResearcherIdSchema>;

// add publication manually
export const manualPublicationSchema = z.object({
	title: z.string(),
	authors: z.string(),
	journal: z.string(),
	year: z.number().nullable(),
	projectId: z.number().optional(),
	url: z.string().url("Please enter a valid URL")
});

export type ManualPublicationSchema = z.infer<typeof manualPublicationSchema>;
