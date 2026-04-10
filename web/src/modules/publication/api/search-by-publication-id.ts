import { HTTPError } from 'ky';

import { type Publication } from '@/modules/publication/model';
import { request } from '@/modules/api/request';

export const searchByPubId = async (id: string) => {
	try {
		return request<Publication>(`/publication-search/publication-id/${encodeURIComponent(id)}`);
	} catch (e) {
		if (e instanceof HTTPError && e.response.status === 404) {
			return null;
		}

		throw e;
	}
};
