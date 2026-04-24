import { ActionIcon, Alert, Badge, Box, Group, Title, Tooltip } from '@mantine/core';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { IconLibrary, IconTrash, IconTrashX } from '@tabler/icons-react';
import { DataTable, type DataTableSortStatus } from 'mantine-datatable';
import { notifications } from '@mantine/notifications';
import { modals } from '@mantine/modals';
import { HTTPError } from 'ky';

import AddPublication from '@/components/project/publications/add-publication';
import ErrorAlert from '@/components/global/error-alert';
import Loading from '@/components/global/loading';
import PublicationCard from '@/components/project/publications/publication-card';
import { useProjectOutletContext } from '@/modules/auth/guards/project-detail-guard';
import { getSortQuery } from '@/modules/api/sorting/utils';
import { PUBLICATION_PAGE_SIZES } from '@/modules/publication/constants';
import { useRemovePublicationMutation } from '@/modules/publication/mutations';
import { useDeleteMyPublicationMutation } from '@/modules/publication/my-queries';
import { type Publication } from '@/modules/publication/model';
import { useProjectPublicationsQuery } from '@/modules/publication/queries';

type ProjectPublicationsProps = {
	id: number;
};

const ProjectPublications = ({ id }: ProjectPublicationsProps) => {
	const { t } = useTranslation();
	const { permissions } = useProjectOutletContext();
	const [currentPublication, setCurrentPublication] = useState<number | null>(null);
	const [page, setPage] = useState(1);
	const [limit, setLimit] = useState(PUBLICATION_PAGE_SIZES[0]);
	const [sortStatus, setSortStatus] = useState<DataTableSortStatus<Publication>>({
		columnAccessor: 'id',
		direction: 'asc'
	});

	const { mutate, isPending: isRemovePending } = useRemovePublicationMutation();
	const deleteMyMutation = useDeleteMyPublicationMutation();
	const isHttpError = (value: unknown): value is HTTPError => value instanceof HTTPError;

	const {
		data: response,
		isPending,
		isError,
		error,
		refetch
	} = useProjectPublicationsQuery(
		id,
		{ page, limit },
		getSortQuery(sortStatus.columnAccessor, sortStatus.direction)
	);

	if (isPending) {
		return <Loading />;
	}

	if (isError) {
		if (isHttpError(error) && error.response?.status === 404) {
			return (
				<Alert color="yellow" variant="light">
					{t('components.project.publications.index.no_access_alert', {
						defaultValue: 'You do not have access to view publications for this project.'
					})}
				</Alert>
			);
		}

		return <ErrorAlert />;
	}

	const metadata = response?.metadata;
	const publications = response?.data ?? [];

	const onPageChange = async (newPage: number) => {
		setPage(newPage);
		await refetch();
	};

	const onRecordsPerPageChange = async (newRecordsPerPage: number) => {
		setLimit(newRecordsPerPage);
		await refetch();
	};

	const onSortStatusChange = async (status: DataTableSortStatus<Publication>) => {
		setSortStatus(status);
		await refetch();
	};

	const removePublication = (publicationId?: number) => {
		if (publicationId === undefined) {
			return;
		}

		setCurrentPublication(publicationId);

		mutate(
			{ projectId: id, publicationId },
			{
				onSuccess: () => {
					notifications.show({
						message: t('components.project.publications.index.notifications.publication_removed')
					});
					void refetch();
				},
				onError: (mutationError: unknown) => {
					if (isHttpError(mutationError) && mutationError.response?.status === 404) {
						notifications.show({
							message: t('components.project.publications.index.notifications.no_access', {
								defaultValue: 'You do not have access to update publications in this project.'
							}),
							color: 'yellow'
						});
						return;
					}

					notifications.show({
						message: t('components.project.publications.index.notifications.error'),
						color: 'red'
					});
				},
				onSettled: () => {
					setCurrentPublication(null);
				}
			}
		);
	};

	const removeAndDelete = (publicationId?: number) => {
		if (!publicationId) {
			return;
		}

		modals.openConfirmModal({
			title: t('components.project.publications.index.delete_confirm_title', { defaultValue: 'Delete publication?' }),
			children: t('components.project.publications.index.delete_confirm_text', {
				defaultValue: 'This will remove it from the project and delete it from My publications.'
			}),
			labels: {
				confirm: t('common.delete', { defaultValue: 'Delete' }),
				cancel: t('common.cancel', { defaultValue: 'Cancel' })
			},
			confirmProps: { color: 'red' },
			onConfirm: () => {
				deleteMyMutation.mutate(publicationId, {
					onSuccess: () => {
						notifications.show({
							message: t(
								'components.project.publications.index.notifications.publication_deleted',
								{ defaultValue: 'Publication deleted' }
							)
						});
						void refetch();
					},
					onError: () => {
						notifications.show({
							message: t('components.project.publications.index.notifications.error'),
							color: 'red'
						});
					}
				});
			}
		});
	};

	return (
		<Box mt={30}>
			<Group justify="space-between" mb={5}>
				<Group>
					<Title order={3}>
						<IconLibrary /> {t('components.project.publications.index.title')}
					</Title>
					<Badge variant="filled" color="gray">
						{metadata?.totalRecords ?? 0}
					</Badge>
				</Group>
				{permissions.includes('edit_publications') && <AddPublication id={id} />}
			</Group>
			<DataTable
				height={300}
				withTableBorder
				textSelectionDisabled
				page={page}
				totalRecords={metadata?.totalRecords}
				recordsPerPage={limit}
				fetching={isPending}
				records={publications}
				noRecordsText={t('components.project.publications.index.no_records_text')}
				onPageChange={onPageChange}
				recordsPerPageOptions={PUBLICATION_PAGE_SIZES}
				onRecordsPerPageChange={onRecordsPerPageChange}
				sortStatus={sortStatus}
				onSortStatusChange={onSortStatusChange}
				columns={[
					{
						title: t('components.project.publications.index.columns.publication_info'),
						accessor: 'info',
						render: (publication: Publication) => <PublicationCard publication={publication} />
					},
					{
						accessor: 'year',
						title: t('components.project.publications.index.columns.year'),
						width: 150,
						sortable: true
					},
					{
						accessor: 'status',
						title: 'Status',
						width: 120,
						sortable: true,
						render: (publication: Publication) => {
							const status = publication.status;
							const color = status === 'approved' ? 'green' : status === 'rejected' ? 'red' : 'orange';
							return <Badge color={color}>{status}</Badge>;
						}
					},
					{
						accessor: 'actions',
						title: t('components.project.publications.index.columns.actions'),
						textAlign: 'center',
						width: 80,
						hidden: !permissions.includes('edit_publications'),
						render: (publication: Publication) => (
							<Group gap={4} justify="space-between" wrap="nowrap">
								<Tooltip
									label={t('components.project.publications.index.tooltips.remove', {
										defaultValue: 'Remove from project'
									})}
									withArrow
								>
									<ActionIcon
										size="sm"
										variant="subtle"
										color="red"
										loading={isRemovePending && currentPublication === publication.id}
										onClick={() => removePublication(publication?.id)}
									>
										<IconTrash size={24} />
									</ActionIcon>
								</Tooltip>
								{publication.isOwner && (
									<Tooltip
										label={t('components.project.publications.index.tooltips.remove_and_delete', {
											defaultValue: 'Remove and delete from My publications'
										})}
										withArrow
									>
										<ActionIcon
											size="sm"
											variant="subtle"
											color="red"
											onClick={() => removeAndDelete(publication?.id)}
										>
											<IconTrashX size={24} />
										</ActionIcon>
									</Tooltip>
								)}
							</Group>
						)
					}
				]}
			/>
		</Box>
	);
};

export default ProjectPublications;

