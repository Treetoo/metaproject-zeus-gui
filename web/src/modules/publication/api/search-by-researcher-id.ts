import { HTTPError } from 'ky';

import { type Publication } from '@/modules/publication/model';
import { request } from '@/modules/api/request';

export type OrcidWorksListDto = {
	orcid: string;
	works: Publication[];
};

export const searchByResearcherId = async (orcid: string) => {
	try {
		return request<OrcidWorksListDto>(`/publication-search/researcher-id/${encodeURIComponent(orcid)}`);
	} catch (e) {
		if (e instanceof HTTPError && e.response.status === 404) {
			return null;
		}
		throw e;
	}
};
