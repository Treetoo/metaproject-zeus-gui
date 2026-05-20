import { Method } from '@/modules/api/model';
import { request } from '@/modules/api/request';
import type { PaginationResponse } from '@/modules/api/pagination/model';
import type { Publication, PublicationSource, PublicationDetail } from '@/modules/publication/model';

export type Project = {
	projectId: number;
};

type PublicationRequest = {
	title: string;
	authors: string;
	year: number;
	journal: string;
	source: PublicationSource;
	uniqueId?: string;
};

export type CreditorInput = {
	userId: number;
	fairShareEligible: boolean;
	isStakeholder: boolean;
};

export type CreateMyPublicationRequest = {
	project: Project;
	creditors?: CreditorInput[];
} & PublicationRequest;

export type UpdateMyPublicationRequest = {} & PublicationRequest;

/**
 * Fetches paginated list of publications owned by the current user.
 */
export const listMyPublications = async (
	page: number,
	limit: number,
	sortSelector: string,
	status?: string,
	search?: string
) => {
	const params = new URLSearchParams({ page: String(page), limit: String(limit), sort: sortSelector });
	if (status && status !== 'all') {
		params.set('status', status);
	}
	if (search?.trim()) {
		params.set('search', search.trim());
	}
	return request<PaginationResponse<Publication>>(`/my/publications?${params}`);
};

/**
 * Updates an existing publication owned by the current user.
 */
export const updateMyPublication = async (publicationId: number, data: PublicationRequest) =>
	request(`/my/publications/${publicationId}`, {
		method: Method.PUT,
		json: data
	});

/**
 * Creates a new publication with optional creditors and stakeholders.
 */
export const createMyPublication = async (data: CreateMyPublicationRequest) =>
	request(`/my/publications`, {
		method: Method.POST,
		json: data
	});

/**
 * Deletes a publication owned by the current user.
 */
export const deleteMyPublication = async (publicationId: number) =>
	request(`/my/publications/${publicationId}`, {
		method: Method.DELETE
	});

/**
 * Fetches detailed information about a specific publication including creditors and stakeholders.
 */
export const getPublicationDetail = async (publicationId: number): Promise<PublicationDetail> =>
	request<PublicationDetail>(`/publications/request/${publicationId}/detail`);

/**
 * Fetches paginated list of publications where the current user has requested credit.
 */
export const listMyCreditedPublications = async (
	page: number,
	limit: number,
	sortSelector: string,
	status?: string,
	search?: string
) => {
	const params = new URLSearchParams({ page: String(page), limit: String(limit), sort: sortSelector });
	if (status && status !== 'all') {
		params.set('status', status);
	}
	if (search?.trim()) {
		params.set('search', search.trim());
	}
	return request<PaginationResponse<Publication>>(`/my/publications/credited?${params}`);
};

/**
 * Fetches paginated list of publications where the current user is a stakeholder.
 */
export const listMyStakeholderPublications = async (
	page: number,
	limit: number,
	sortSelector: string,
	status?: string,
	search?: string
) => {
	const params = new URLSearchParams({ page: String(page), limit: String(limit), sort: sortSelector });
	if (status && status !== 'all') {
		params.set('status', status);
	}
	if (search?.trim()) {
		params.set('search', search.trim());
	}
	return request<PaginationResponse<Publication>>(`/my/publications/stakeholder?${params}`);
};

/**
 * Requests credit for a publication on behalf of the current user.
 */
export const requestCredit = async (publicationId: number) =>
	request(`/my/publications/credit-request/${publicationId}`, {
		method: Method.POST
	});

export type PublicationWithCreditStatus = Publication & {
	creditStatus: 'approved' | 'pending' | 'rejected' | null;
};

/**
 * Fetches all publications with credit status information for the current user.
 */
export const listAllPublicationsWithCredit = async (
	page: number,
	limit: number,
	sortSelector: string,
	status?: string,
	search?: string
) => {
	const params = new URLSearchParams({ page: String(page), limit: String(limit), sort: sortSelector });
	if (status && status !== 'all') {
		params.set('status', status);
	}
	if (search?.trim()) {
		params.set('search', search.trim());
	}
	return request<PaginationResponse<PublicationWithCreditStatus>>(`/my/publications/all-with-credit?${params}`);
};
