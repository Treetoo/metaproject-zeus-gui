import { Box, Button } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import React, { useState, useMemo } from 'react';
import type { DataTableSortStatus } from 'mantine-datatable';
import { useQueryClient, useQuery } from '@tanstack/react-query';

import PageBreadcrumbs from '@/components/global/page-breadcrumbs';
import type { Publication, PublicationDetail } from '@/modules/publication/model';
import { useCreditRequestsQuery } from '@/modules/publication/queries';
import { getSortQuery } from '@/modules/api/sorting/utils';
import { getCurrentRole } from '@/modules/auth/methods/getCurrentRole';
import { Role } from '@/modules/user/role';
import { PublicationsTable } from '@/components/publications/publication-table';
import userManager from '@/modules/auth/config/user-manager';
import { getPublicationDetail } from '@/modules/publication/api/my-publications';

import { CreditRequestDetail } from './detail';

type CreditRequest = {
	status: 'pending' | 'approved' | 'rejected';
	projectId: number;
	projectName: string;
} & Publication;

type FilterType = 'all' | 'pending' | 'approved' | 'rejected';

const CreditRequests = () => {
	const { t } = useTranslation();
	const role = getCurrentRole();
	const prefix = role === Role.ADMIN ? '/admin' : '/director';

	const [selectedPub, setSelectedPub] = useState<CreditRequest | null>(null);
	const [detailOpen, setDetailOpen] = useState(false);
	const [page, setPage] = useState(1);
	const [limit, setLimit] = useState(10);
	const [sortStatus, setSortStatus] = useState<DataTableSortStatus<Publication>>({
		columnAccessor: 'id',
		direction: 'asc'
	});
	const [filter, setFilter] = useState<FilterType>('pending');
	const [search, setSearch] = useState('');

	const [exportModalOpen, setExportModalOpen] = useState(false);
	const [startDate, setStartDate] = useState<Date | null>(null);
	const [endDate, setEndDate] = useState<Date | null>(null);
	const [selectedFields, setSelectedFields] = useState<string[]>([
		'title',
		'authors',
		'journal',
		'year',
		'uniqueId',
		'status',
		'createdAt',
		'reviewedAt',
		'weight',
		'ownerId'
	]);
	const [isExporting, setIsExporting] = useState(false);

	const sortQuery = useMemo(() => getSortQuery(sortStatus.columnAccessor, sortStatus.direction), [sortStatus]);
	const searchQuery = useMemo(() => ({ page, limit, search }), [page, limit, search]);

	const handleRowClick = (publication: CreditRequest) => {
		setSelectedPub(publication);
		setDetailOpen(true);
	};

	const { data: detailData } = useQuery({
		queryKey: ['publication', 'detail', selectedPub?.id],
		queryFn: () => getPublicationDetail(selectedPub!.id),
		enabled: detailOpen && !!selectedPub?.id
	});

	const queryClient = useQueryClient();
	const handleActionComplete = async () => {
		await refetch();
		await queryClient.invalidateQueries({
			queryKey: ['publications', 'credit-requests']
		});
	};

	const handleCloseDetail = () => {
		setDetailOpen(false);
		setSelectedPub(null);
	};

	const { data, isPending, refetch } = useCreditRequestsQuery(searchQuery, sortQuery, filter);

	const records = (data?.data ?? []) as CreditRequest[];
	const totalRecords = data?.metadata?.totalRecords ?? 0;

	const handleExport = async () => {
		setIsExporting(true);
		try {
			const params = new URLSearchParams();
			if (filter !== 'all') {
				params.set('status', filter);
			}
			if (search?.trim()) {
				params.set('search', search.trim());
			}
			if (startDate) {
				params.set('startDate', startDate.toISOString());
			}
			if (endDate) {
				params.set('endDate', endDate.toISOString());
			}
			if (selectedFields.length > 0 && selectedFields.length < 10) {
				params.set('fields', selectedFields.join(','));
			}

			const user = await userManager.getUser();
			const token = user?.access_token;

			const response = await fetch(`/api/publications/credit-approval/export?${params}`, {
				headers: {
					Accept: 'text/csv',
					...(token && { Authorization: `Bearer ${token}` })
				}
			});

			if (!response.ok) throw new Error('Export failed');

			const blob = await response.blob();
			const url = window.URL.createObjectURL(blob);
			const link = document.createElement('a');
			link.href = url;
			link.download = `credit-requests-export-${new Date().toISOString().split('T')[0]}.csv`;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			window.URL.revokeObjectURL(url);

			setExportModalOpen(false);
		} catch (error) {
			console.error('Export error:', error);
		} finally {
			setIsExporting(false);
		}
	};

	return (
		<Box>
			<PageBreadcrumbs
				links={[
					{ title: t(`components.global.drawerList.links.${role}.title`), href: prefix },
					{
						title: 'Credit Requests',
						href: `${prefix}/credit-requests`
					}
				]}
			/>

			<PublicationsTable
				title={t('routes.CreditRequests.title') || 'Credit Requests'}
				records={records}
				totalRecords={totalRecords}
				isPending={isPending}
				page={page}
				limit={limit}
				sortStatus={sortStatus}
				onPageChange={async p => {
					setPage(p);
					await refetch();
				}}
				onRecordsPerPageChange={async l => {
					setLimit(l);
					await refetch();
				}}
				onSortStatusChange={async s => {
					setPage(1);
					setSortStatus(s as DataTableSortStatus<Publication>);
					await refetch();
				}}
				onRowClick={handleRowClick}
				showFilters
				filter={filter}
				onFilterChange={f => {
					setFilter(f);
					setPage(1);
				}}
				search={search}
				onSearchChange={setSearch}
				onExport={() => setExportModalOpen(true)}
				exportModalOpen={exportModalOpen}
				onExportModalClose={() => setExportModalOpen(false)}
				startDate={startDate}
				onStartDateChange={setStartDate}
				endDate={endDate}
				onEndDateChange={setEndDate}
				selectedFields={selectedFields}
				onSelectedFieldsChange={setSelectedFields}
				isExporting={isExporting}
				onExportConfirm={handleExport}
				renderActions={pub => (
					<Button size="xs" variant="light" onClick={() => handleRowClick(pub)}>
						Review
					</Button>
				)}
			/>

			<CreditRequestDetail
				opened={detailOpen}
				onClose={handleCloseDetail}
				publication={detailData || selectedPub}
				onApproved={handleActionComplete}
				onRejected={handleActionComplete}
			/>
		</Box>
	);
};

export default CreditRequests;
