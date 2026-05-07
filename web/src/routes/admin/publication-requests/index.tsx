import { Box, Title, Group, Button, SimpleGrid, Card, Text, ActionIcon, TextInput, Badge } from '@mantine/core';
import { IconSearch, IconCheck, IconX, IconList, IconRefreshOff } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import React, { useState, useMemo } from 'react';
import type { DataTableSortStatus } from 'mantine-datatable';
import { DataTable } from 'mantine-datatable';
import { useQueryClient } from '@tanstack/react-query';

import PageBreadcrumbs from '@/components/global/page-breadcrumbs';
import { PUBLICATION_PAGE_SIZES } from '@/modules/publication/constants';
import type { Publication } from '@/modules/publication/model';
import { usePublicationRequestsQuery } from '@/modules/publication/queries'; // Assumed hook based on architecture
import { getSortQuery } from '@/modules/api/sorting/utils';
import { getCurrentRole } from '@/modules/auth/methods/getCurrentRole';
import { Role } from '@/modules/user/role';

import { PublicationApprovalDetail } from './detail';

type PendingPublication = {
	status: 'pending' | 'approved' | 'rejected';
	projectId: number;
	projectName: string;
} & Publication;

type FilterType = 'all' | 'pending' | 'approved' | 'rejected';

const PublicationRequests = () => {
	const { t } = useTranslation();
	const role = getCurrentRole();
	const prefix = role === Role.ADMIN ? '/admin' : '/director';

	const [selectedPub, setSelectedPub] = useState<PendingPublication | null>(null);
	const [detailOpen, setDetailOpen] = useState(false);
	const [page, setPage] = useState(1);
	const [limit, setLimit] = useState(PUBLICATION_PAGE_SIZES[0]);
	const [sortStatus, setSortStatus] = useState<DataTableSortStatus<Publication>>({
		columnAccessor: 'id',
		direction: 'asc'
	});
	const [filter, setFilter] = useState<FilterType>('pending');
	const [search, setSearch] = useState('');

	const sortQuery = useMemo(() => getSortQuery(sortStatus.columnAccessor, sortStatus.direction), [sortStatus]);
	const searchQuery = useMemo(() => ({ page, limit, search }), [page, limit, search]);

	const handleRowClick = (publication: PendingPublication) => {
		setSelectedPub(publication);
		setDetailOpen(true);
	};

	const queryClient = useQueryClient();
	const handleActionComplete = async () => {
		await refetch();
		await queryClient.invalidateQueries({
			queryKey: ['publications', 'requests']
		});
	};

	const handleCloseDetail = () => {
		setDetailOpen(false);
		setSelectedPub(null);
	};

	const { data, isPending, refetch } = usePublicationRequestsQuery(searchQuery, sortQuery, filter);

	const records = data?.data ?? [];
	const totalRecords = data?.metadata?.totalRecords ?? 0;

	return (
		<Box>
			<PageBreadcrumbs
				links={[
					{ title: t(`components.global.drawerList.links.${role}.title`), href: prefix },
					{
						title: t(`components.global.drawerList.links.${role}.link.publication_requests`),
						href: `${prefix}/publication-requests`
					}
				]}
			/>
			<Title order={2}>{t('routes.PublicationRequests.title')}</Title>

			<SimpleGrid cols={4} mt={15} mb={15}>
				<Card withBorder radius="md" onClick={() => setFilter('all')} style={{ cursor: 'pointer' }}>
					<Group justify="space-between">
						<Text fw={500}>All</Text>
						<ActionIcon variant="light" disabled={filter === 'all'}>
							<IconList size={16} />
						</ActionIcon>
					</Group>
				</Card>
				<Card
					withBorder
					radius="md"
					onClick={() => {
						setFilter('pending');
						setPage(1);
					}}
					style={{ cursor: 'pointer' }}
				>
					<Group justify="space-between">
						<Text fw={500}>Pending</Text>
						<ActionIcon variant="light" disabled={filter === 'pending'}>
							<IconRefreshOff size={16} />
						</ActionIcon>
					</Group>
				</Card>
				<Card
					withBorder
					radius="md"
					onClick={() => {
						setFilter('approved');
						setPage(1);
					}}
					style={{ cursor: 'pointer' }}
				>
					<Group justify="space-between">
						<Text fw={500}>Approved</Text>
						<ActionIcon variant="light" disabled={filter === 'approved'}>
							<IconCheck size={16} />
						</ActionIcon>
					</Group>
				</Card>
				<Card
					withBorder
					radius="md"
					onClick={() => {
						setFilter('rejected');
						setPage(1);
					}}
					style={{ cursor: 'pointer' }}
				>
					<Group justify="space-between">
						<Text fw={500}>Rejected</Text>
						<ActionIcon variant="light" disabled={filter === 'rejected'}>
							<IconX size={16} />
						</ActionIcon>
					</Group>
				</Card>
			</SimpleGrid>

			<Box mb={15}>
				<TextInput
					leftSection={<IconSearch size={18} />}
					rightSection={
						search && (
							<Button
								variant="subtle"
								size="xs"
								onClick={() => {
									setSearch('');
									setPage(1);
								}}
							>
								Clear
							</Button>
						)
					}
					placeholder="Search by title, authors, journal, or ID..."
					value={search}
					onChange={e => {
						setSearch(e.currentTarget.value);
						setPage(1);
					}}
					style={{ maxWidth: 500 }}
				/>
			</Box>

			<Box mt={15}>
				<DataTable
					height={500}
					withTableBorder
					fetching={isPending}
					records={records}
					totalRecords={totalRecords}
					page={page}
					onPageChange={async p => {
						setPage(p);
						await refetch();
					}}
					recordsPerPage={limit}
					recordsPerPageOptions={PUBLICATION_PAGE_SIZES}
					onRecordsPerPageChange={async l => {
						setLimit(l);
						await refetch();
					}}
					sortStatus={sortStatus}
					onSortStatusChange={async s => {
						setPage(1);
						setSortStatus(s as DataTableSortStatus<Publication>);
						await refetch();
					}}
					columns={[
						{
							accessor: 'title',
							title: t('routes.PublicationRequests.table.publication_title'),
							sortable: true
						},
						{
							accessor: 'authors',
							title: t('routes.PublicationRequests.table.authors'),
							sortable: false,
							width: 200
						},
						{
							accessor: 'journal',
							title: t('routes.PublicationRequests.table.publisher'),
							sortable: true,
							width: 180
						},
						{
							accessor: 'year',
							title: t('routes.PublicationRequests.table.publication_year'),
							sortable: true,
							width: 120
						},
						{
							accessor: 'createdAt',
							title: t('routes.PublicationRequests.table.createdAt'),
							sortable: true,
							width: 180,
							render: ({ createdAt }) => (createdAt ? new Date(createdAt).toLocaleString() : 'N/A')
						},
						{
							accessor: 'status',
							title: 'Status',
							width: 110,
							sortable: true,
							render: (pub: Publication) => {
								const color =
									pub.status === 'approved' ? 'green' : pub.status === 'rejected' ? 'red' : 'orange';
								return <Badge color={color}>{pub.status}</Badge>;
							}
						},

						{
							accessor: 'actions',
							title: 'actions',
							width: 100,
							textAlign: 'right',
							render: record => (
								<Button
									size="xs"
									variant="light"
									onClick={e => {
										e.stopPropagation();
										handleRowClick(record as PendingPublication);
									}}
								>
									Review
								</Button>
							)
						}
					]}
				/>
			</Box>
			<PublicationApprovalDetail
				opened={detailOpen}
				onClose={handleCloseDetail}
				publication={selectedPub}
				onApproved={handleActionComplete}
				onRejected={handleActionComplete}
			/>
		</Box>
	);
};

export default PublicationRequests;
