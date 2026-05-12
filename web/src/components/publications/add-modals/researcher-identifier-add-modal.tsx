import { useEffect, useMemo, useState } from 'react';
import { DataTable } from 'mantine-datatable';
import { Modal, Button, Group, Autocomplete, Select, Text, Stack, Badge } from '@mantine/core';
import { notifications } from '@mantine/notifications';

import { type ResearcherIdType, type Publication } from '@/modules/publication/model';
import { type PublicationPreview } from '@/modules/publication/api/my-publications';
import { searchByResearcherId } from '@/modules/publication/api/search-by-researcher-id';
import { getMyOrcid } from '@/modules/user/api/my-orcid';

import { AddManuallyModal } from './add-manually-modal';

type ResearcherIdentifierAddModalProps = {
	opened: boolean;
	onClose: () => void;
	onSuccess: () => Promise<void>;
};

type TypeOption = {
	value: ResearcherIdType;
	label: string;
};
const TYPE_OPTIONS: TypeOption[] = [
	{ value: 'orcid', label: 'ORCID iD' },
	{ value: 'res_openalex', label: 'OpenAlex researcher ID' },
	{ value: 'unknown', label: 'Auto Detect' }
];

export const ResearcherIdentifierAddModal = ({ opened, onClose, onSuccess }: ResearcherIdentifierAddModalProps) => {
	const [selectedType, setSelectedType] = useState<ResearcherIdType>('unknown');
	const [forceTypeChange, setForceTypeChange] = useState(false);
	const [inputId, setInputId] = useState('');
	const [myOrcids, setMyOrcids] = useState<string[]>([]);
	const [works, setWorks] = useState<Publication[]>([]);
	const [selectedWorks, setSelectedWorks] = useState<Publication[]>([]);
	const [isSearching, setIsSearching] = useState(false);

	// Sequential add mode states
	const [isSequentialMode, setIsSequentialMode] = useState(false);
	const [sequentialQueue, setSequentialQueue] = useState<Publication[]>([]);
	const [currentWorkIndex, setCurrentWorkIndex] = useState(0);
	const [fetchedPublication, setFetchedPublication] = useState<PublicationPreview | null>(null);
	const [addedCount, setAddedCount] = useState(0);
	const [skippedCount, setSkippedCount] = useState(0);

	useEffect(() => {
		if (opened) {
			getMyOrcid().then(data => {
				setMyOrcids(data.orcid || []);
				if (data.orcid.length === 1) {
					setInputId(data.orcid[0]);
				}
			});
		}
	}, [opened]);

	useEffect(() => {
		if (opened) {
			setIsSequentialMode(false);
			setSequentialQueue([]);
			setCurrentWorkIndex(0);
			setFetchedPublication(null);
			setAddedCount(0);
			setSkippedCount(0);
		}
	}, [opened]);

	const orcidOptions = useMemo(() => myOrcids.map((orcid: string) => ({ value: orcid, label: orcid })), [myOrcids]);

	const handleClose = () => {
		setIsSearching(false);
		setWorks([]);
		setSelectedWorks([]);
		setSelectedType('unknown');
		setForceTypeChange(false);
		setIsSequentialMode(false);
		setSequentialQueue([]);
		setCurrentWorkIndex(0);
		setFetchedPublication(null);
		setAddedCount(0);
		setSkippedCount(0);
		onClose();
	};

	const toggleRecord = (record: Publication) => {
		setSelectedWorks(prev =>
			prev.some(r => r.uniqueId === record.uniqueId)
				? prev.filter(r => r.uniqueId !== record.uniqueId)
				: [...prev, record]
		);
	};

	const handleSearchId = async () => {
		const trimmed = inputId.trim();
		if (!trimmed) {
			notifications.show({ message: 'Please enter an ORCID', color: 'yellow' });
			return;
		}

		if (forceTypeChange && selectedType === 'unknown') {
			notifications.show({
				message: 'Previous attempt failed. Please select a specific type from the dropdown or cancel.',
				color: 'orange'
			});
			return;
		}

		setIsSearching(true);
		try {
			const result = await searchByResearcherId(trimmed, selectedType);
			setWorks(result?.works ?? []);
			if (!result?.works?.length) {
				notifications.show({ message: 'No publications found for this researcher ID', color: 'orange' });
			}
		} catch (e: any) {
			const status = e?.status || e?.response?.status || e?.data?.status;

			if (status === 400) {
				setForceTypeChange(true);
				notifications.show({
					message: 'Could not detect publication type automatically. Please select a type from the dropdown and try again.',
					color: 'orange'
				});
			} else if (status === 404) {
				notifications.show({
					message: 'No publications found for this researcher ID. Please check the ID and try again.',
					color: 'red'
				});
			} else {
				notifications.show({ message: 'An unexpected error occurred. Please try again later.', color: 'red' });
			}
		} finally {
			setIsSearching(false);
		}
	};

	const startSequentialAdd = async () => {
		if (selectedWorks.length === 0) return;

		const worksWithUniqueId = selectedWorks.filter((w: Publication) => w.uniqueId);
		if (worksWithUniqueId.length === 0) {
			notifications.show({ message: 'Selected publications have no ID', color: 'yellow' });
			return;
		}

		// Start sequential mode - use work data directly without fetching
		setIsSequentialMode(true);
		setSequentialQueue(worksWithUniqueId);
		setCurrentWorkIndex(0);
		setAddedCount(0);
		setSkippedCount(0);

		// Use the work data directly as fetchedPublication
		const firstWork = worksWithUniqueId[0];
		setFetchedPublication({
			title: firstWork.title || '',
			authors: firstWork.authors || '',
			year: firstWork.year || 0,
			journal: firstWork.journal || '',
			url: firstWork.url || '',
			uniqueId: firstWork.uniqueId,
			source: selectedType as any
		});
	};

	const handlePublicationAdded = async () => {
		setAddedCount(prev => prev + 1);
		setFetchedPublication(null);

		if (currentWorkIndex < sequentialQueue.length - 1) {
			// Move to next work
			setCurrentWorkIndex(prev => prev + 1);
			const nextWork = sequentialQueue[currentWorkIndex + 1];

			// Use the work data directly
			setFetchedPublication({
				title: nextWork.title || '',
				authors: nextWork.authors || '',
				year: nextWork.year || 0,
				journal: nextWork.journal || '',
				url: nextWork.url || '',
				uniqueId: nextWork.uniqueId,
				source: selectedType as any
			});
		} else {
			// Done with all works
			notifications.show({
				message: `Added ${addedCount + 1} publication(s) from ORCID`,
				color: 'green'
			});
			await onSuccess();
			handleClose();
		}
	};

	const handlePublicationSkipped = async () => {
		setSkippedCount(prev => prev + 1);
		setFetchedPublication(null);

		if (currentWorkIndex < sequentialQueue.length - 1) {
			setCurrentWorkIndex(prev => prev + 1);
			const nextWork = sequentialQueue[currentWorkIndex + 1];

			// Use the work data directly
			setFetchedPublication({
				title: nextWork.title || '',
				authors: nextWork.authors || '',
				year: nextWork.year || 0,
				journal: nextWork.journal || '',
				url: nextWork.url || '',
				uniqueId: nextWork.uniqueId,
				source: selectedType as any
			});
		} else {
			notifications.show({
				message: `Finished. Added ${addedCount} publication(s), skipped ${skippedCount + 1}`,
				color: 'blue'
			});
			await onSuccess();
			handleClose();
		}
	};

	const currentWork = isSequentialMode ? sequentialQueue[currentWorkIndex] : null;
	const progressText = isSequentialMode ? `Processing ${currentWorkIndex + 1} of ${sequentialQueue.length}` : '';

	return (
		<>
			<Modal opened={opened} onClose={handleClose} title="Add publications by researcher ID" centered size="lg">
				<Stack>
					<Group align="flex-end">
						<Autocomplete
							label="Researcher ID"
							placeholder="0000-0002-8529-9990"
							value={inputId}
							onChange={setInputId}
							data={orcidOptions.map(option => option.value)}
							style={{ flex: 1 }}
							comboboxProps={{
								withinPortal: true
							}}
						/>

						<Select
							label="Type"
							data={TYPE_OPTIONS}
							value={selectedType}
							onChange={value => {
								setSelectedType(value as ResearcherIdType);
								if (value !== 'unknown') setForceTypeChange(false);
							}}
							error={forceTypeChange && selectedType === 'unknown' ? 'Selection required' : false}
						/>

						<Button onClick={handleSearchId} loading={isSearching} disabled={!inputId.trim()}>
							Search
						</Button>
					</Group>

					{works.length > 0 && !isSequentialMode && (
						<>
							<Text size="sm" c="dimmed">
								Found {works.length} publication(s). Select the ones you want to add:
							</Text>
							<DataTable
								height={400}
								withTableBorder
								records={works}
								selectedRecords={selectedWorks}
								onSelectedRecordsChange={setSelectedWorks}
								idAccessor="uniqueId"
								highlightOnHover
								onRowClick={({ record }) => toggleRecord(record)}
								columns={[
									{ accessor: 'title', title: 'Title', width: 300 },
									{ accessor: 'authors', title: 'Authors', width: 300 },
									{ accessor: 'year', title: 'Year', width: 100 },
									{ accessor: 'uniqueId', title: 'ID', width: 300 }
								]}
							/>
							<Group justify="flex-end" mt="md">
								<Button variant="default" onClick={handleClose}>
									Cancel
								</Button>
								{selectedWorks.length > 0 && <Badge size="lg">{selectedWorks.length} selected</Badge>}
								<Button onClick={startSequentialAdd} disabled={selectedWorks.length === 0}>
									Add {selectedWorks.length} selected
								</Button>
							</Group>
						</>
					)}

					{isSequentialMode && currentWork && (
						<Text size="sm" c="blue">
							{progressText}
						</Text>
					)}
				</Stack>
			</Modal>

			{isSequentialMode && fetchedPublication && (
				<AddManuallyModal
					opened
					onClose={() => { }}
					onSuccess={handlePublicationAdded}
					fetchedPublication={fetchedPublication}
					sourceType={selectedType as any}
					allowSkip
					onSkip={handlePublicationSkipped}
				/>
			)}
		</>
	);
};
