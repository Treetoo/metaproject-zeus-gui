import z from 'zod';

// search by DOI
export const searchByPubIdSchema = z.object({
	doi: z.string()
});

export type SearchByPubIdSchema = z.infer<typeof searchByPubIdSchema>;

// search by ORCID
export const searchByResearcherIdSchema = z.object({
	orcid: z.string()
});

export type SearchByResearcherIdSchema = z.infer<typeof searchByResearcherIdSchema>;

// add publication manually
export const manualPublicationSchema = z.object({
	title: z.string(),
	authors: z.string(),
	journal: z.string(),
	year: z.number().min(0).max(2200),
	projectId: z.string({ required_error: "Please select a project" }).min(1, "Please select a project")
});

export type ManualPublicationSchema = z.infer<typeof manualPublicationSchema>;
