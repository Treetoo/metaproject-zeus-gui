import { Method } from '@/modules/api/model';
import { type Publication } from '@/modules/publication/model';
import { request } from '@/modules/api/request';

export type AddPublicationRequest = {
	projectId: number;
	publications: Publication[];
};

/**
 * Adds multiple publications to a project.
 */
export const addPublications = async ({ projectId, publications }: AddPublicationRequest) => {
	const payload = publications.map(publication => ({
		title: publication.title,
		authors: publication.authors,
		journal: publication.journal,
		year: publication.year,
		source: publication.source ?? 'manual',
		...(publication.uniqueId ? { uniqueId: publication.uniqueId } : {})
	}));

	await request(`/projects/${projectId}/publications`, {
		method: Method.POST,
		json: {
			publications: payload
		}
	});
};
