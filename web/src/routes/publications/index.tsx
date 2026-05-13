import { Box, Button, Group, Modal, Stack, Text, Title, Badge, Tabs } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import type { DataTableSortStatus } from 'mantine-datatable';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { modals } from '@mantine/modals';
import { IconLibrary, IconArticle, IconUserCheck, IconWorld } from '@tabler/icons-react';

import { PublicationsTable } from '@/components/publications/publication-table';
import { PublicationDetailModal } from '@/components/publications/publication-detail-modal';
import { IdentifierAddModal } from '@/components/publications/add-modals/identifier-add-modal';
import { AddManuallyModal } from '@/components/publications/add-modals/add-manually-modal';
import { ResearcherIdentifierAddModal } from '@/components/publications/add-modals/researcher-identifier-add-modal';
import PageBreadcrumbs from '@/components/global/page-breadcrumbs';
import { PUBLICATION_PAGE_SIZES } from '@/modules/publication/constants';
import { getSortQuery } from '@/modules/api/sorting/utils';
import {
	useDeleteMyPublicationMutation,
	useMyPublicationsQuery,
	useMyCreditedPublicationsQuery,
	useMyStakeholderPublicationsQuery,
	useRequestCreditMutation,
	useAllPublicationsWithCreditQuery
} from '@/modules/publication/my-queries';
import type { Publication } from '@/modules/publication/model';
import type { PublicationWithCreditStatus } from '@/modules/publication/api/my-publications';

type FilterType = 'all' | 'pending' | 'approved' | 'rejected';
type ModalType = 'manual' | 'pubId' | 'researcherId' | 'detail' | null;
type TabType = 'my' | 'credited' | 'stakeholder' | 'all';

const MyPublicationsPage = () => {
	const [searchParams, setSearchParams] = useSearchParams();
	const [activeModal, setActiveModal] = useState<ModalType>(null);
	const [currentTab, setCurrentTab] = useState<TabType>((searchParams.get('tab') as TabType) || 'my');

	useEffect(() => {
		const tabParam = searchParams.get('tab') as TabType;
		if (tabParam && tabParam !== currentTab) {
			setCurrentTab(tabParam);
		}
	}, [searchParams]);

	const syncTabToUrl = (tab: TabType) => {
		setCurrentTab(tab);
		setSearchParams({ tab });
	};

	// My Publications state
	const [myPage, setMyPage] = useState(1);
	const [myLimit, setMyLimit] = useState(PUBLICATION_PAGE_SIZES[0]);
	const [mySort, setMySort] = useState<DataTableSortStatus<Publication>>({ columnAccessor: 'id', direction: 'asc' });
	const [myFilter, setMyFilter] = useState<FilterType>('all');
	const [mySearch, setMySearch] = useState('');
	const mySortQuery = useMemo(() => getSortQuery(mySort.columnAccessor, mySort.direction), [mySort]);

	// Credited Publications state
	const [creditedPage, setCreditedPage] = useState(1);
	const [creditedLimit, setCreditedLimit] = useState(PUBLICATION_PAGE_SIZES[0]);
	const [creditedSort, setCreditedSort] = useState<DataTableSortStatus<Publication>>({
		columnAccessor: 'id',
		direction: 'asc'
	});
	const [creditedFilter, setCreditedFilter] = useState<FilterType>('all');
	const [creditedSearch, setCreditedSearch] = useState('');
	const creditedSortQuery = useMemo(() => getSortQuery(creditedSort.columnAccessor, creditedSort.direction), [
		creditedSort
	]);

	// Stakeholder Publications state
	const [stakeholderPage, setStakeholderPage] = useState(1);
	const [stakeholderLimit, setStakeholderLimit] = useState(PUBLICATION_PAGE_SIZES[0]);
	const [stakeholderSort, setStakeholderSort] = useState<DataTableSortStatus<Publication>>({
		columnAccessor: 'id',
		direction: 'asc'
	});
	const [stakeholderFilter, setStakeholderFilter] = useState<FilterType>('all');
	const [stakeholderSearch, setStakeholderSearch] = useState('');
	const stakeholderSortQuery = useMemo(
		() => getSortQuery(stakeholderSort.columnAccessor, stakeholderSort.direction),
		[stakeholderSort]
	);

	// All Publications state
	const [allPage, setAllPage] = useState(1);
	const [allLimit, setAllLimit] = useState(PUBLICATION_PAGE_SIZES[0]);
	const [allSort, setAllSort] = useState<DataTableSortStatus<Publication>>({ columnAccessor: 'id', direction: 'asc' });
	const [allFilter, setAllFilter] = useState<FilterType>('all');
	const [allSearch, setAllSearch] = useState('');
	const allSortQuery = useMemo(() => getSortQuery(allSort.columnAccessor, allSort.direction), [allSort]);

	const myQuery = useMyPublicationsQuery({ page: myPage, limit: myLimit }, mySortQuery, myFilter, mySearch);
	const creditedQuery = useMyCreditedPublicationsQuery(
		{ page: creditedPage, limit: creditedLimit },
		creditedSortQuery,
		creditedFilter,
		creditedSearch
	);
	const stakeholderQuery = useMyStakeholderPublicationsQuery(
		{ page: stakeholderPage, limit: stakeholderLimit },
		stakeholderSortQuery,
		stakeholderFilter,
		stakeholderSearch
	);
	const allQuery = useAllPublicationsWithCreditQuery(
		{ page: allPage, limit: allLimit },
		allSortQuery,
		allFilter,
		allSearch
	);

	const deleteMutation = useDeleteMyPublicationMutation();
	const requestCreditMutation = useRequestCreditMutation();
	const [editingPublication, setEditingPublication] = useState<Publication | null>(null);
	const [viewingPublication, setViewingPublication] = useState<Publication | null>(null);

	const closeModal = () => {
		setActiveModal(null);
	};

	const handleSuccess = async () => {
		if (currentTab === 'my') {
			await myQuery.refetch();
		} else if (currentTab === 'credited') {
			await creditedQuery.refetch();
		} else if (currentTab === 'stakeholder') {
			await stakeholderQuery.refetch();
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
						await myQuery.refetch();
					}
				});
			}
		});
	};

	const handleRequestCredit = async (pub: Publication) => {
		if (!pub.id) return;
		try {
			await requestCreditMutation.mutateAsync(pub.id);
			await allQuery.refetch();
			notifications.show({ message: 'Credit request sent successfully', color: 'green' });
		} catch (error: any) {
			const status = error?.response?.status || error?.status;

			if (status === 409) {
				notifications.show({
					message: 'You are already credited for this publication.',
					color: 'orange'
				});
			} else if (status === 404) {
				notifications.show({
					message: 'This publication could not be found.',
					color: 'red'
				});
			} else {
				notifications.show({ message: 'Failed to send credit request. Please try again.', color: 'red' });
			}
		}
	};

	const renderCreditStatusBadge = (creditStatus: 'approved' | 'pending' | 'rejected') => {
		if (creditStatus === 'approved') {
			return <Badge color="green">Approved</Badge>;
		} else if (creditStatus === 'pending') {
			return <Badge color="orange">Pending</Badge>;
		} else if (creditStatus === 'rejected') {
			return <Badge color="red">Rejected</Badge>;
		}
	};

	const renderAllTabActions = (pub: PublicationWithCreditStatus) => {
		const hasCreditRequest = pub.creditStatus !== null;

		return (
			<Group gap={8} justify="flex-end">
				{hasCreditRequest ? (
					renderCreditStatusBadge(pub.creditStatus as 'approved' | 'pending' | 'rejected')
				) : (
					<Button
						size="xs"
						variant="outline"
						color="blue"
						onClick={() => handleRequestCredit(pub)}
						disabled={requestCreditMutation.isPending}
					>
						Ask for credit
					</Button>
				)}
			</Group>
		);
	};

	return (
		<Box>
			<AddManuallyModal
				opened={activeModal === 'manual'}
				onClose={() => {
					setEditingPublication(null);
					closeModal();
				}}
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

			<ResearcherIdentifierAddModal
				opened={activeModal === 'researcherId'}
				onClose={closeModal}
				onSuccess={handleSuccess}
			/>

			<PublicationDetailModal
				opened={activeModal === 'detail'}
				onClose={closeModal}
				publication={viewingPublication}
			/>

			<PageBreadcrumbs links={[{ title: 'Publications', href: '/publications' }]} />
			<Tabs value={currentTab} onChange={(v) => syncTabToUrl(v as TabType)} mt={15}>
				<Tabs.List>
					<Tabs.Tab value="my" leftSection={<IconLibrary />}>
						My Publications
					</Tabs.Tab>
					<Tabs.Tab value="credited" leftSection={<IconUserCheck />}>
						Credited
					</Tabs.Tab>
					<Tabs.Tab value="stakeholder" leftSection={<IconWorld />}>
						Stakeholder
					</Tabs.Tab>
					<Tabs.Tab value="all" leftSection={<IconArticle />}>
						All Publications
					</Tabs.Tab>
				</Tabs.List>

				<Tabs.Panel value="my">
					<Group mt={20} mb={20}>
						<Button color="teal" onClick={() => setActiveModal('manual')}>
							Add publication manually
						</Button>
						<Button color="blue" onClick={() => setActiveModal('pubId')}>
							Add by publication ID
						</Button>
						<Button color="green" onClick={() => setActiveModal('researcherId')}>
							Add by researcher ID
						</Button>
					</Group>
					<PublicationsTable
						records={myQuery.data?.data ?? []}
						totalRecords={myQuery.data?.metadata?.totalRecords ?? 0}
						isPending={myQuery.isPending}
						page={myPage}
						limit={myLimit}
						sortStatus={mySort}
						onPageChange={async p => {
							setMyPage(p);
							await myQuery.refetch();
						}}
						onRecordsPerPageChange={async l => {
							setMyLimit(l);
							await myQuery.refetch();
						}}
						onSortStatusChange={async s => {
							setMySort(s);
							setMyPage(1);
							await myQuery.refetch();
						}}
						onRowClick={record => {
							setViewingPublication(record);
							setActiveModal('detail');
						}}
						showFilters
						filter={myFilter}
						onFilterChange={f => {
							setMyFilter(f);
							setMyPage(1);
						}}
						search={mySearch}
						onSearchChange={setMySearch}
						renderActions={pub => (
							<Group gap={8} justify="flex-end">
								<Button
									size="xs"
									variant="blue"
									disabled={pub.status === 'approved'}
									onClick={() => {
										setEditingPublication(pub);
										setActiveModal('manual');
									}}
								>
									Edit
								</Button>
								<Button size="xs" color="red" variant="light" onClick={() => deletePublication(pub)}>
									Delete
								</Button>
							</Group>
						)}
					/>
				</Tabs.Panel>

				<Tabs.Panel value="credited">
					<PublicationsTable
						records={creditedQuery.data?.data ?? []}
						totalRecords={creditedQuery.data?.metadata?.totalRecords ?? 0}
						isPending={creditedQuery.isPending}
						page={creditedPage}
						limit={creditedLimit}
						sortStatus={creditedSort}
						onPageChange={async p => {
							setCreditedPage(p);
							await creditedQuery.refetch();
						}}
						onRecordsPerPageChange={async l => {
							setCreditedLimit(l);
							await creditedQuery.refetch();
						}}
						onSortStatusChange={async s => {
							setCreditedSort(s);
							setCreditedPage(1);
							await creditedQuery.refetch();
						}}
						onRowClick={record => {
							setViewingPublication(record);
							setActiveModal('detail');
						}}
						showFilters
						filter={creditedFilter}
						onFilterChange={f => {
							setCreditedFilter(f);
							setCreditedPage(1);
						}}
						search={creditedSearch}
						onSearchChange={setCreditedSearch}
						showCreditStatus
					/>
				</Tabs.Panel>

				<Tabs.Panel value="stakeholder">
					<PublicationsTable
						records={stakeholderQuery.data?.data ?? []}
						totalRecords={stakeholderQuery.data?.metadata?.totalRecords ?? 0}
						isPending={stakeholderQuery.isPending}
						page={stakeholderPage}
						limit={stakeholderLimit}
						sortStatus={stakeholderSort}
						onPageChange={async p => {
							setStakeholderPage(p);
							await stakeholderQuery.refetch();
						}}
						onRecordsPerPageChange={async l => {
							setStakeholderLimit(l);
							await stakeholderQuery.refetch();
						}}
						onSortStatusChange={async s => {
							setStakeholderSort(s);
							setStakeholderPage(1);
							await stakeholderQuery.refetch();
						}}
						onRowClick={record => {
							setViewingPublication(record);
							setActiveModal('detail');
						}}
						showFilters
						filter={stakeholderFilter}
						onFilterChange={f => {
							setStakeholderFilter(f);
							setStakeholderPage(1);
						}}
						search={stakeholderSearch}
						onSearchChange={setStakeholderSearch}
					/>
				</Tabs.Panel>

				<Tabs.Panel value="all">
					<PublicationsTable
						records={allQuery.data?.data ?? []}
						totalRecords={allQuery.data?.metadata?.totalRecords ?? 0}
						isPending={allQuery.isPending}
						page={allPage}
						limit={allLimit}
						sortStatus={allSort}
						onPageChange={async p => {
							setAllPage(p);
							await allQuery.refetch();
						}}
						onRecordsPerPageChange={async l => {
							setAllLimit(l);
							await allQuery.refetch();
						}}
						onSortStatusChange={async s => {
							setAllSort(s);
							setAllPage(1);
							await allQuery.refetch();
						}}
						onRowClick={record => {
							setViewingPublication(record);
							setActiveModal('detail');
						}}
						showFilters
						filter={allFilter}
						onFilterChange={f => {
							setAllFilter(f);
							setAllPage(1);
						}}
						search={allSearch}
						onSearchChange={setAllSearch}
						renderActions={renderAllTabActions}
					/>
				</Tabs.Panel>
			</Tabs>
		</Box>
	);
};

export default MyPublicationsPage;
