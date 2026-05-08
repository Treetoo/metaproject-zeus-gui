import { useMutation, useQuery } from '@tanstack/react-query';
import type { Pagination } from '@/modules/api/pagination/model';
import type { Publication } from '@/modules/publication/model';
import {
	assignMyPublicationToProject,
	CreateMyPublicationRequest,
	deleteMyPublication,
	listMyPublications,
	updateMyPublication,
	listMyCreditedPublications
} from '@/modules/publication/api/my-publications';

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

export const useAssignMyPublicationMutation = () =>
  useMutation({
    mutationFn: ({ id, projectId }: { id: number; projectId: number }) =>
      assignMyPublicationToProject(id, projectId)
  });

export const useUpdateMyPublicationMutation = () =>
  useMutation({
    mutationFn: ({ id, data }: { id: number; data: CreateMyPublicationRequest }) =>
      updateMyPublication(id, data)
  });

export const useDeleteMyPublicationMutation = () =>
  useMutation({
    mutationFn: (id: number) => deleteMyPublication(id)
  });
