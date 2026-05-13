import { Method } from '@/modules/api/model';
import { request } from '@/modules/api/request';
import type { PaginationResponse } from '@/modules/api/pagination/model';
import type { Publication, PublicationSource } from '@/modules/publication/model';

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

export type CreateMyPublicationRequest = {
	project: Project;
	stakeholderIds?: number[];
} & PublicationRequest;

export type UpdateMyPublicationRequest = {} & PublicationRequest;

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

export const updateMyPublication = async (publicationId: number, data: PublicationRequest) =>
	request(`/my/publications/${publicationId}`, {
		method: Method.PUT,
		json: data
	});

export const createMyPublication = async (data: CreateMyPublicationRequest) =>
	request(`/my/publications`, {
		method: Method.POST,
		json: data
	});

export const assignMyPublicationToProject = async (publicationId: number, projectId: number) =>
	request(`/my/publications/${publicationId}/assign`, {
		method: Method.POST,
		json: { projectId }
	});

export const deleteMyPublication = async (publicationId: number) =>
	request(`/my/publications/${publicationId}`, {
		method: Method.DELETE
	});

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

export const requestCredit = async (publicationId: number) =>
	request(`/my/publications/credit-request/${publicationId}`, {
		method: Method.POST
	});

export type PublicationWithCreditStatus = Publication & {
	creditStatus: 'approved' | 'pending' | 'rejected' | null;
};

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
