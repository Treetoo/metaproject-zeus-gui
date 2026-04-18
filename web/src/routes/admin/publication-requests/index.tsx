import { Box, Title, Badge, Group, Button } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import React, { useState, useMemo } from 'react';
import type { DataTableSortStatus } from 'mantine-datatable';
import { DataTable } from 'mantine-datatable';
import { Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';

import PageBreadcrumbs from '@/components/global/page-breadcrumbs';
import { PUBLICATION_PAGE_SIZES } from '@/modules/publication/constants';
import type { Publication } from '@/modules/publication/model';
import { usePublicationRequestsQuery } from '@/modules/publication/queries'; // Assumed hook based on architecture
import { getSortQuery } from '@/modules/api/sorting/utils';
import { getCurrentRole } from '@/modules/auth/methods/getCurrentRole';
import { Role } from '@/modules/user/role';
import { PublicationApprovalDetail } from './detail';

interface PendingPublication extends Publication {
	status: 'pending' | 'approved' | 'rejected';
	projectId: number;
	projectName: string;
}

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

	const sortQuery = useMemo(
		() => getSortQuery(sortStatus.columnAccessor, sortStatus.direction),
		[sortStatus]
	);

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
	}

	const handleCloseDetail = () => {
		setDetailOpen(false);
		setSelectedPub(null);
	}

	const { data, isPending, refetch } = usePublicationRequestsQuery({ page, limit }, sortQuery);

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

			<Box mt={15} >
				<DataTable
					height={500}
					withTableBorder
					fetching={isPending}
					records={records}
					totalRecords={totalRecords}
					page={page}
					onPageChange={async (p) => {
						setPage(p);
						await refetch();
					}}
					recordsPerPage={limit}
					recordsPerPageOptions={PUBLICATION_PAGE_SIZES}
					onRecordsPerPageChange={async (l) => {
						setLimit(l);
						await refetch();
					}}
					sortStatus={sortStatus}
					onSortStatusChange={async (s) => {
						setSortStatus(s as DataTableSortStatus<Publication>);
						await refetch();
					}}
					columns={[
						{
							accessor: 'projectId',
							title: t('routes.PublicationRequests.table.project_title'),
							width: 200,
							render: (record) => (
								<span>{record.projectName || `Project #${record.projectId}`}</span>)
						},
						{
							accessor: 'Project title',
							title: t('routes.PublicationRequests.table.publication_title'),
							sortable: true,
							render: (publication) => (
								<Link
									to={`${prefix}/publication-requests/${publication.id}`}
									style={{ textDecoration: 'none', color: 'inherit' }}
								>
									{publication.title}
								</Link>
							)
						},
						{
							accessor: 'authors',
							title: t('routes.PublicationRequests.table.authors'),
							sortable: false
						},
						{
							accessor: 'journal',
							title: t('routes.PublicationRequests.table.publisher'),
							sortable: true,
							width: 200
						},
						{
							accessor: 'year',
							title: t('routes.PublicationRequests.table.publication_year'),
							sortable: true,
							width: 150
						},
						{
							accessor: 'createdAt',
							title: t('routes.PublicationRequests.table.createdAt'),
							sortable: true,
							width: 150,
							render: ({ createdAt }) => new Date(createdAt).toLocaleDateString()
						},
						{
							acessor: 'actions',
							title: 'actions',
							width: 100,
							textAlign: 'right',
							render: (record) => (
								<Button
									size="xs"
									variant="light"
									onClick={(e) => {
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
