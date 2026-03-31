import { HTTPError } from 'ky';

import { type Publication } from '@/modules/publication/model';
import { request } from '@/modules/api/request';
export type OrcidWorkDto = {
    doi: string;
    title: string;
    year?: number;
    authors?: string;
};

export type OrcidWorksListDto = {
    orcid: string;
    works: OrcidWorkDto[];
};

export const searchByOrcid = async (orcid: string) => {
    try {
        return request<Publication>(`/publication-search/orcid/${encodeURIComponent(orcid)}`);
    } catch (e) {
        if (e instanceof HTTPError && e.response.status === 404) {
            return null;
        }

        throw e;
    }
};
