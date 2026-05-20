import { useMutation, useQuery } from '@tanstack/react-query';

import type { Pagination } from '@/modules/api/pagination/model';
import type { Publication } from '@/modules/publication/model';
import {
	deleteMyPublication,
	listMyPublications,
	updateMyPublication,
	listMyCreditedPublications,
	listMyStakeholderPublications,
	requestCredit,
	listAllPublicationsWithCredit
} from '@/modules/publication/api/my-publications';
import type { CreateMyPublicationRequest } from '@/modules/publication/api/my-publications';

/**
 * Query hook for fetching the current user's publications with pagination, sorting, filtering, and search.
 */
export const useMyPublicationsQuery = (
	pagination: Pagination,
	sortSelector: string,
	status?: string,
	search?: string
) =>
	useQuery({
		queryKey: ['my', 'publications', pagination.page, pagination.limit, sortSelector, status, search],
		queryFn: () => listMyPublications(pagination.page, pagination.limit, sortSelector, status, search)
	});

/**
 * Query hook for fetching publications where the user has requested credit.
 */
export const useMyCreditedPublicationsQuery = (
	pagination: Pagination,
	sortSelector: string,
	status?: string,
	search?: string
) =>
	useQuery({
		queryKey: ['my', 'credited', 'publications', pagination.page, pagination.limit, sortSelector, status, search],
		queryFn: () => listMyCreditedPublications(pagination.page, pagination.limit, sortSelector, status, search)
	});

/**
 * Query hook for fetching publications where the user is a stakeholder.
 */
export const useMyStakeholderPublicationsQuery = (
	pagination: Pagination,
	sortSelector: string,
	status?: string,
	search?: string
) =>
	useQuery({
		queryKey: [
			'my',
			'stakeholder',
			'publications',
			pagination.page,
			pagination.limit,
			sortSelector,
			status,
			search
		],
		queryFn: () => listMyStakeholderPublications(pagination.page, pagination.limit, sortSelector, status, search)
	});

/**
 * Mutation hook for updating an existing publication.
 */
export const useUpdateMyPublicationMutation = () =>
	useMutation({
		mutationFn: ({ id, data }: { id: number; data: CreateMyPublicationRequest }) => updateMyPublication(id, data)
	});

/**
 * Mutation hook for deleting a publication.
 */
export const useDeleteMyPublicationMutation = () =>
	useMutation({
		mutationFn: (id: number) => deleteMyPublication(id)
	});

/**
 * Mutation hook for requesting credit for a publication.
 */
export const useRequestCreditMutation = () =>
	useMutation({
		mutationFn: (publicationId: number) => requestCredit(publicationId)
	});

/**
 * Query hook for fetching all publications with credit status information.
 */
export const useAllPublicationsWithCreditQuery = (
	pagination: Pagination,
	sortSelector: string,
	status?: string,
	search?: string
) =>
	useQuery({
		queryKey: [
			'all',
			'publications',
			'with-credit',
			pagination.page,
			pagination.limit,
			sortSelector,
			status,
			search
		],
		queryFn: () => listAllPublicationsWithCredit(pagination.page, pagination.limit, sortSelector, status, search)
	});
