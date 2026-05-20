import { Alert, Badge, Box, Group, Title } from '@mantine/core';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { IconLibrary } from '@tabler/icons-react';
import { DataTable, type DataTableSortStatus } from 'mantine-datatable';
import { HTTPError } from 'ky';

import ErrorAlert from '@/components/global/error-alert';
import Loading from '@/components/global/loading';
import PublicationCard from '@/components/project/publications/publication-card';
import { getSortQuery } from '@/modules/api/sorting/utils';
import { PUBLICATION_PAGE_SIZES } from '@/modules/publication/constants';
import { type Publication } from '@/modules/publication/model';
import { useProjectPublicationsQuery } from '@/modules/publication/queries';

type ProjectPublicationsProps = {
	id: number;
};

const ProjectPublications = ({ id }: ProjectPublicationsProps) => {
	const { t } = useTranslation();
	const [page, setPage] = useState(1);
	const [limit, setLimit] = useState(PUBLICATION_PAGE_SIZES[0]);
	const [sortStatus, setSortStatus] = useState<DataTableSortStatus<Publication>>({
		columnAccessor: 'id',
		direction: 'asc'
	});

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
		const isHttpError = (value: unknown): value is HTTPError => value instanceof HTTPError;
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

	return (
		<Box mt={30}>
			<Group mb={5}>
				<Title order={3}>
					<IconLibrary /> {t('components.project.publications.index.title')}
				</Title>
				<Badge variant="filled" color="gray">
					{metadata?.totalRecords ?? 0}
				</Badge>
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
					}
				]}
			/>
		</Box>
	);
};

export default ProjectPublications;
