import { useQuery } from '@tanstack/react-query';

import type { Pagination, PaginationResponse } from '@/modules/api/pagination/model';
import { type Publication } from '@/modules/publication/model';
import { request } from '@/modules/api/request';

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
			return request<PaginationResponse<Publication>>(`/publications/approval?${params}`);
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
			return request<PaginationResponse<Publication>>(`/publications/credit-approval?${params}`);
		}
	});
