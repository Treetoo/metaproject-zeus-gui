import {
	Box,
	Badge,
	Title,
	SimpleGrid,
	Card,
	Text,
	ActionIcon,
	TextInput,
	Button,
	Group,
	Modal,
	Stack,
	Divider,
	Checkbox
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { DataTable } from 'mantine-datatable';
import type { DataTableSortStatus } from 'mantine-datatable';
import { useTranslation } from 'react-i18next';
import { IconSearch, IconCheck, IconX, IconList, IconRefreshOff, IconDownload } from '@tabler/icons-react';

import { PUBLICATION_PAGE_SIZES } from '@/modules/publication/constants';
import type { Publication } from '@/modules/publication/model';

type FilterType = 'all' | 'pending' | 'approved' | 'rejected';

const AVAILABLE_FIELDS = [
	{ value: 'title', label: 'Title' },
	{ value: 'authors', label: 'Authors' },
	{ value: 'journal', label: 'Journal' },
	{ value: 'year', label: 'Year' },
	{ value: 'uniqueId', label: 'ID' },
	{ value: 'status', label: 'Status' },
	{ value: 'createdAt', label: 'Created At' },
	{ value: 'reviewedAt', label: 'Reviewed At' },
	{ value: 'weight', label: 'Weight' },
	{ value: 'ownerId', label: 'Owner ID' }
];

type PublicationsTableProps = {
	title?: string;
	records: Publication[];
	totalRecords: number;
	isPending: boolean;
	page: number;
	limit: number;
	sortStatus: DataTableSortStatus<Publication>;
	onPageChange: (page: number) => Promise<void>;
	onRecordsPerPageChange: (limit: number) => Promise<void>;
	onSortStatusChange: (sortStatus: DataTableSortStatus<Publication>) => Promise<void>;
	onRowClick: (publication: Publication) => void;
	renderActions?: (publication: Publication) => React.ReactNode;
	// Filtering props
	showFilters?: boolean;
	filter?: FilterType;
	onFilterChange?: (filter: FilterType) => void;
	search?: string;
	onSearchChange?: (search: string) => void;
	onExport?: () => void;
	exportModalOpen?: boolean;
	onExportModalClose?: () => void;
	startDate?: Date | null;
	onStartDateChange?: (date: Date | null) => void;
	endDate?: Date | null;
	onEndDateChange?: (date: Date | null) => void;
	selectedFields?: string[];
	onSelectedFieldsChange?: (fields: string[]) => void;
	isExporting?: boolean;
	onExportConfirm?: () => void;
};

export const PublicationsTable: React.FC<PublicationsTableProps> = ({
	title,
	records,
	totalRecords,
	isPending,
	page,
	limit,
	sortStatus,
	onPageChange,
	onRecordsPerPageChange,
	onSortStatusChange,
	onRowClick,
	renderActions,
	// Filtering props
	showFilters,
	filter,
	onFilterChange,
	search,
	onSearchChange,
	onExport,
	exportModalOpen,
	onExportModalClose,
	startDate,
	onStartDateChange,
	endDate,
	onEndDateChange,
	selectedFields,
	onSelectedFieldsChange,
	isExporting,
	onExportConfirm
}) => {
	const { t } = useTranslation();

	return (
		<Box mt={15}>
			{showFilters && filter !== undefined && onFilterChange && (
				<>
					<Title order={2}>{title}</Title>
					<SimpleGrid cols={4} mt={15} mb={15}>
						<Card withBorder radius="md" onClick={() => onFilterChange('all')} style={{ cursor: 'pointer' }}>
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
							onClick={() => onFilterChange('pending')}
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
							onClick={() => onFilterChange('approved')}
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
							onClick={() => onFilterChange('rejected')}
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
						<Group justify="space-between">
							<TextInput
								leftSection={<IconSearch size={18} />}
								rightSection={
									search && (
										<Button
											variant="subtle"
											size="xs"
											onClick={() => {
												onSearchChange?.('');
											}}
										>
											Clear
										</Button>
									)
								}
								placeholder="Search by title, authors, journal, or ID..."
								value={search}
								onChange={e => onSearchChange?.(e.currentTarget.value)}
								style={{ maxWidth: 500 }}
							/>
							{onExport && (
								<Button leftSection={<IconDownload size={18} />} onClick={onExport}>
									Export
								</Button>
							)}
						</Group>
					</Box>
				</>
			)}

			{!showFilters && title && <Title order={2}>{title}</Title>}

			<DataTable
				height={500}
				withTableBorder
				fetching={isPending}
				records={records}
				totalRecords={totalRecords}
				page={page}
				onPageChange={onPageChange}
				recordsPerPage={limit}
				recordsPerPageOptions={PUBLICATION_PAGE_SIZES}
				onRecordsPerPageChange={onRecordsPerPageChange}
				sortStatus={sortStatus}
				onSortStatusChange={onSortStatusChange}
				onRowClick={({ event, record }) => {
					if ((event.target as HTMLElement).closest('button')) return;
					onRowClick(record);
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
					...(renderActions
						? [
								{
									accessor: 'actions',
									title: '',
									width: 280,
									textAlign: 'right',
									render: renderActions
								}
						  ]
						: [])
				]}
			/>

			{exportModalOpen && onExportModalClose && onExportConfirm && (
				<Modal opened={exportModalOpen} onClose={onExportModalClose} title="Export publications" centered size="md">
					<Stack>
						<Stack gap={5}>
							<Text size="sm" fw={500}>
								Date range (optional)
							</Text>
							<Group>
								<DatePickerInput
									placeholder="Start date"
									value={startDate}
									onChange={onStartDateChange}
									clearable
									style={{ flex: 1 }}
								/>
								<DatePickerInput
									placeholder="End date"
									value={endDate}
									onChange={onEndDateChange}
									clearable
									style={{ flex: 1 }}
								/>
							</Group>
						</Stack>

						<Divider />

						<Stack gap={5}>
							<Text size="sm" fw={500}>
								Fields to export
							</Text>
							<Checkbox.Group
								value={selectedFields}
								onChange={values => onSelectedFieldsChange?.(values as string[])}
							>
								<Stack gap={8}>
									{AVAILABLE_FIELDS.map(field => (
										<Checkbox key={field.value} value={field.value} label={field.label} />
									))}
								</Stack>
							</Checkbox.Group>
						</Stack>

						<Group justify="flex-end" mt={10}>
							<Button variant="default" onClick={onExportModalClose}>
								Cancel
							</Button>
							<Button loading={isExporting} onClick={onExportConfirm}>
								Export CSV
							</Button>
						</Group>
					</Stack>
				</Modal>
			)}
		</Box>
	);
};
