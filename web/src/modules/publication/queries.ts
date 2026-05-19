import { useQuery } from '@tanstack/react-query';

import type { Pagination, PaginationResponse } from '@/modules/api/pagination/model';
import { type Publication } from '@/modules/publication/model';
import { request } from '@/modules/api/request';
import type { PublicationWithCreditStatus } from './api/my-publications';

export const useProjectPublicationsQuery = (id: number, pagination: Pagination, sortSelector: string) =>
	useQuery({
		queryKey: ['project', id, 'publications', pagination.page, pagination.limit, sortSelector],
		queryFn: () =>
			request<PaginationResponse<Publication>>(
				`/projects/${id}/publications?page=${pagination.page}&limit=${pagination.limit}&sort=${encodeURIComponent(sortSelector)}`
			)
	});

export const usePublicationRequestsQuery = (
	pagination: Pagination,
	sortSelector: string,
	filter: 'all' | 'pending' | 'approved' | 'rejected' = 'pending'
) =>
	useQuery({
		queryKey: [
			'publications',
			'requests',
			pagination.page,
			pagination.limit,
			sortSelector,
			filter,
			pagination.search
		],
		queryFn: () => {
			const params = new URLSearchParams({
				page: String(pagination.page),
				limit: String(pagination.limit),
				sort: sortSelector
			});
			if (filter !== 'all') {
				params.set('status', filter);
			}
			if (pagination.search && pagination.search.trim().length > 0) {
				params.set('search', pagination.search.trim());
			}
			return request<PaginationResponse<Publication>>(`/publications/request?${params}`);
		}
	});

export const useCreditRequestsQuery = (
	pagination: Pagination,
	sortSelector: string,
	filter: 'all' | 'pending' | 'approved' | 'rejected' = 'pending'
) =>
	useQuery({
		queryKey: [
			'publications',
			'credit-requests',
			pagination.page,
			pagination.limit,
			sortSelector,
			filter,
			pagination.search
		],
		queryFn: () => {
			const params = new URLSearchParams({
				page: String(pagination.page),
				limit: String(pagination.limit),
				sort: sortSelector
			});
			if (filter !== 'all') {
				params.set('status', filter);
			}
			if (pagination.search && pagination.search.trim().length > 0) {
				params.set('search', pagination.search.trim());
			}
			return request<PaginationResponse<Publication>>(`/publications/credit?${params}`);
		}
	});

export const useAllPublicationsWithCreditQuery = (
	pagination: Pagination,
	sortSelector: string,
	filter: 'all' | 'pending' | 'approved' | 'rejected' = 'all',
	search?: string
) =>
	useQuery({
		queryKey: [
			'publications',
			'all-with-credit',
			pagination.page,
			pagination.limit,
			sortSelector,
			filter,
			search
		],
		queryFn: () => {
			const params = new URLSearchParams({
				page: String(pagination.page),
				limit: String(pagination.limit),
				sort: sortSelector
			});
			if (filter !== 'all') {
				params.set('status', filter);
			}
			if (search && search.trim().length > 0) {
				params.set('search', search.trim());
			}
			return request<PaginationResponse<PublicationWithCreditStatus>>(`/my/publications/all-with-credit?${params}`);
		}
	});
