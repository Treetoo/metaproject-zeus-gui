import { HTTPError } from 'ky';

import { type Publication } from '@/modules/publication/model';
import { request } from '@/modules/api/request';

/**
 * Searches for a publication using a publication identifier (DOI, ISBN, etc.).
 * Returns null if no results found (404), throws otherwise.
 */
export const searchByPubId = async (id: string, type: string) => {
	try {
		return request<Publication>(
			`/publication-search/publication-id/${encodeURIComponent(type)}/${encodeURIComponent(id)}`
		);
	} catch (e) {
		if (e instanceof HTTPError && e.response.status === 404) {
			return null;
		}

		throw e;
	}
};
