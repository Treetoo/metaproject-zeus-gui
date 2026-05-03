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

export const usePublicationsRequestQuery = (id: number, pagination: Pagination, sortSelector: string) =>
	useQuery({
		queryKey: ['project', id, 'publications', pagination.page, pagination.limit, sortSelector],
		queryFn: () =>
			request<PaginationResponse<Publication>>(
				`/projects/${id}/publications?page=${pagination.page}&limit=${pagination.limit}&sort=${encodeURIComponent(sortSelector)}`
			)
	});

export const usePublicationRequestsQuery = (pagination: Pagination, sortSelector: string) =>
	useQuery({
		queryKey: ['publications', 'requests', pagination.page, pagination.limit, sortSelector],
		queryFn: () =>
			request<PaginationResponse<Publication>>(
				`/publications/approval?page=${pagination.page}&limit=${pagination.limit}&sort=${sortSelector}`
			)
	});
