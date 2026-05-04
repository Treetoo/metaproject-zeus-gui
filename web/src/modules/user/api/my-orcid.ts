import { Method } from '@/modules/api/model';
import { request } from '@/modules/api/request';

export const getMyOrcid = async () => {
	return await request<{ orcid: string }>(`/users/orcid`, {
		method: Method.GET
	})
}
