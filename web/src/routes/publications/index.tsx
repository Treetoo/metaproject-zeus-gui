import { Box, Button, Group, Modal, NumberInput, Select, Stack, Text, TextInput, Title, Flex } from '@mantine/core';
import { DataTable, type DataTableSortStatus } from 'mantine-datatable';
import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import { modals } from '@mantine/modals';
import { IconLibrary } from '@tabler/icons-react';
import { HTTPError } from 'ky';
import { searchByResearcherId, type OrcidWorkDto } from '@/modules/publication/api/search-by-orcid';
import { IdentifierAddModal } from '@/components/publications/add-modals/identifier-add-modal';
import { AddManuallyModal } from '@/modules/publication/add-manually-modal';
import { ResearcherIdentifierAddModal } from '@/components/publications/add-modals/researcher-identifier-add-modal'
import PageBreadcrumbs from '@/components/global/page-breadcrumbs';
import { PUBLICATION_PAGE_SIZES } from '@/modules/publication/constants';
import { getSortQuery } from '@/modules/api/sorting/utils';
import { useAssignMyPublicationMutation, useDeleteMyPublicationMutation, useMyPublicationsQuery } from '@/modules/publication/my-queries';
import { createMyPublication } from '@/modules/publication/api/my-publications';
import {
	manualPublicationSchema,
	searchByPubIdSchema,
	searchByResearcherIdSchema,
	type ManualPublicationSchema,
	type SearchByPubIdSchema,
	type SearchByResearcherIdSchema,
} from '@/modules/publication/form';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { Publication } from '@/modules/publication/model';
import { searchByPubId } from '@/modules/publication/api/search-by-publication-id';
import { useMyActiveProjectsQuery } from '@/modules/project/queries';

type ModalType = 'manual' | 'pubId' | 'orcid' | 'assign'; // | 'ark' | 'nma' | 'orcid' | 'assign' | null;

const MyPublicationsPage = () => {
	const [activeModal, setActiveModal] = useState<ModalType>(null);
	const [page, setPage] = useState(1);
	const [limit, setLimit] = useState(PUBLICATION_PAGE_SIZES[0]);
	const [sort, setSort] = useState<DataTableSortStatus<Publication>>({ columnAccessor: 'id', direction: 'asc' });
	const sortQuery = useMemo(() => getSortQuery(sort.columnAccessor, sort.direction), [sort]);

	const { data, isPending, refetch } = useMyPublicationsQuery({ page, limit }, sortQuery);
	// Fetch all active projects for dropdown selection
	const { data: myProjects, isPending: isProjectsPending } = useMyActiveProjectsQuery();
	const assignMutation = useAssignMyPublicationMutation();
	const deleteMutation = useDeleteMyPublicationMutation();
	const queryClient = useQueryClient();
	const [assignProjectId, setAssignProjectId] = useState<string | null>(null);
	const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
	const [publicationToAssign, setPublicationToAssign] = useState<Publication | null>(null);
	const [editingPublication, setEditingPublication] = useState<Publication | null>(null);

	const addForm = useForm<ManualPublicationSchema>({ resolver: zodResolver(manualPublicationSchema) });
	const pubIdForm = useForm<SearchByPubIdSchema>({ resolver: zodResolver(searchByPubIdSchema), defaultValues: { pubId: '' } });
	const researcherIdForm = useForm<SearchByResearcherIdSchema>({ resolver: zodResolver(searchByResearcherIdSchema), defaultValues: { pubId: '' } });
	const isHttpError = (value: unknown): value is HTTPError => value instanceof HTTPError;


	const handleAssign = (pub: Publication) => {
		setPublicationToAssign(pub);
		setActiveModal('assign');
	}
	const closeModal = () => {
		setActiveModal(null);
		setPublicationToAssign(null);
	}

	const handleSuccess = async () => {
		await refetch();
	};

	// Transform projects for Select dropdown
	const projectOptions = useMemo(() => {
		if (!myProjects || !Array.isArray(myProjects)) return [];
		return myProjects.map(project => ({
			value: String(project.id),
			label: project.title
		}));
	}, [myProjects]);

	const openAssignModal = (pub: Publication) => {
		if (!pub.id) return;
		setPublicationToAssign(pub);
		setAssignProjectId(null);
		setIsAssignModalOpen(true);
	};

	const closeAssignModal = () => {
		setIsAssignModalOpen(false);
		setPublicationToAssign(null);
		setAssignProjectId(null);
	};

	const handleAssignSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();

		if (!assignProjectId || !publicationToAssign?.id) {
			return;
		}

		try {
			const projectIdNum = Number(assignProjectId);
			await assignMutation.mutateAsync({ id: publicationToAssign.id, projectId: projectIdNum });
			notifications.show({ message: 'Publication assigned to project successfully' });
			closeAssignModal();
			await queryClient.invalidateQueries({ queryKey: ['project', projectIdNum, 'publications'] });
			await refetch();
		} catch (error: unknown) {
			if (isHttpError(error) && error.response.status === 404) {
				notifications.show({ message: 'You do not have permission to add publications to that project.', color: 'yellow' });
				return;
			}
			if (isHttpError(error) && error.response.status === 403) {
				notifications.show({ message: 'You do not have permission to add publications to that project.', color: 'yellow' });
				return;
			}

			notifications.show({ message: 'Failed to assign publication. Please try again.', color: 'red' });
		}
	};

	const deletePublication = (pub: Publication) => {
		if (!pub.id) return;
		modals.openConfirmModal({
			title: 'Delete publication?',
			yOffset: 100,
			children: 'This will permanently delete the publication and unassign it from any project.',
			confirmProps: { color: 'red' },
			labels: { confirm: 'Delete', cancel: 'Cancel' },
			onConfirm: () => {
				deleteMutation.mutate(pub.id!, {
					onSuccess: async () => {
						notifications.show({ message: 'Publication deleted' });
						await refetch();
					},
					onError: () => notifications.show({ message: 'Error', color: 'red' })
				});
			}
		});
	};

	return (
		<Box>
			<AddManuallyModal
				opened={activeModal === 'manual' || activeModal === 'edit'}
				onClose={() => { setEditingPublication(null); closeModal(); }}
				onSuccess={handleSuccess}
				editPublication={editingPublication}
			/>

			<IdentifierAddModal
				opened={activeModal === 'pubId'}
				onClose={closeModal}
				onSuccess={handleSuccess}
				title="Add publication using publication ID"
				placeholder=""
				label="Publication id"
			/>

			{/*Add by ORCID*/}
			<ResearcherIdentifierAddModal
				opened={activeModal === 'orcid'}
				onClose={closeModal}
				onSuccess={handleSuccess}
			/>


			<Modal opened={isAssignModalOpen} onClose={closeAssignModal} title="Assign publication to project" centered>
				<form onSubmit={handleAssignSubmit}>
					<Stack>
						{!isProjectsPending && projectOptions.length === 0 ? (
							<Text c="dimmed" size="sm">
								You don't have any active projects to assign publications to.
								Please create a project first or wait for your project request to be approved.
							</Text>
						) : (
							<Select
								label="Select project"
								placeholder={isProjectsPending ? "Loading projects..." : "Choose a project"}
								data={projectOptions}
								value={assignProjectId}
								onChange={setAssignProjectId}
								disabled={assignMutation.isPending || isProjectsPending}
								searchable
								nothingFoundMessage="No projects found"
								description="Only active projects you are a member of are shown"
							/>
						)}
						<Group justify="flex-end">
							<Button variant="default" type="button" onClick={closeAssignModal}>Cancel</Button>
							<Button
								type="submit"
								loading={assignMutation.isPending}
								disabled={!assignProjectId || projectOptions.length === 0}
							>
								Assign
							</Button>
						</Group>
					</Stack>
				</form>
			</Modal>

			<PageBreadcrumbs links={[{ title: 'Publications', href: '/publications' }]} />
			<Title order={3}><IconLibrary /> My publications</Title>
			<Group mt={10} mb={20}>
				<Button color="teal" onClick={() => setActiveModal('manual')}>Add publication manually</Button>
				<Button color="blue" onClick={() => setActiveModal('pubId')}>Add by publication ID</Button>
				<Button color="green" onClick={() => setActiveModal('orcid')}>Add by reasearcher ID</Button>
			</Group>
			<DataTable
				height={500}
				withTableBorder
				fetching={isPending}
				records={data?.data ?? []}
				totalRecords={data?.metadata?.totalRecords}
				page={page}
				onPageChange={async (p: number) => { setPage(p); await refetch(); }}
				recordsPerPage={limit}
				recordsPerPageOptions={PUBLICATION_PAGE_SIZES}
				onRecordsPerPageChange={async (l: number) => { setLimit(l); await refetch(); }}
				sortStatus={sort}
				onSortStatusChange={async (s: DataTableSortStatus<Publication>) => { setSort(s); await refetch(); }}
				columns={[
					{ accessor: 'title', title: 'Title' },
					{ accessor: 'authors', title: 'Authors' },
					{ accessor: 'journal', title: 'Journal' },
					{ accessor: 'year', title: 'Year', width: 120 },
					{
						accessor: 'actions', title: '', width: 280, textAlign: 'right',
						render: (pub: Publication) => (
							<Group gap={8} justify="flex-end">
								<Button size="xs" variant="light" onClick={() => openAssignModal(pub)}>Assign to project</Button>
								<Button size="xs" variant="blue" onClick={() => { setEditingPublication(pub); setActiveModal('edit'); }}>Edit</Button>
								<Button size="xs" color="red" variant="light" onClick={() => deletePublication(pub)}>Delete</Button>
							</Group>
						)
					}
				]}
			/>
		</Box >
	);
};

export default MyPublicationsPage;
