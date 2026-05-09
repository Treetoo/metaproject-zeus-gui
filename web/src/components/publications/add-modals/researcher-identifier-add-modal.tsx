import { useEffect, useMemo, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { DataTable } from 'mantine-datatable';
import { Modal, Button, Group, Autocomplete, Select, Text, Stack, NumberInput } from '@mantine/core';
import { notifications } from '@mantine/notifications';

import { type ResearcherIdType, type Publication } from '@/modules/publication/model';
import { type CreateMyPublicationRequest } from '@/modules/publication/api/my-publications';
import { createMyPublication } from '@/modules/publication/api/my-publications';
import { searchByResearcherId } from '@/modules/publication/api/search-by-researcher-id';
import { useMyActiveProjectsQuery } from '@/modules/project/queries';
import { getMyOrcid } from '@/modules/user/api/my-orcid';
import { StakeholderSelectionModal } from './stakeholder-selection-modal';

const schema = z.object({
	identifier: z.string(),
	projectId: z.number({ required_error: 'Please select a project' }).min(1, 'Please select a project')
});

type FormValues = z.infer<typeof schema>;

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
	const { data: myProjects, isPending: isProjectsPending } = useMyActiveProjectsQuery();

	const [selectedType, setSelectedType] = useState<ResearcherIdType>('unknown');
	const [forceTypeChange, setForceTypeChange] = useState(false);
	const [inputId, setInputId] = useState('');
	const [myOrcids, setMyOrcids] = useState<string[]>([]);
	const [works, setWorks] = useState<Publication[]>([]);
	const [selectedWorks, setSelectedWorks] = useState<Publication[]>([]);
	const [isSearching, setIsSearching] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const [showStakeholderModal, setShowStakeholderModal] = useState(false);
	const [pendingSelectedWorks, setPendingSelectedWorks] = useState<Publication[]>([]);
	const [pendingProjectId, setPendingProjectId] = useState<number | null>(null);

	const form = useForm<FormValues>({
		resolver: zodResolver(schema),
		defaultValues: {
			identifier: ''
		}
	});

	useEffect(() => {
		if (opened) {
			getMyOrcid().then(data => {
				setMyOrcids(data.orcid || []);
				if (data.orcid.length === 1) {
					setInputId(data.orcid[0]);
				}
			});
		}

		if (myProjects && myProjects.length === 1) {
			form.setValue('projectId', Number(myProjects[0].id), { shouldValidate: true });
		}
	}, [opened]);

	useEffect(() => {
		if (opened) {
			setShowStakeholderModal(false);
			setPendingSelectedWorks([]);
			setPendingProjectId(null);
		}
	}, [opened]);

	const projectOptions = useMemo(() => {
		if (!myProjects || !Array.isArray(myProjects)) return [];
		return myProjects.map(project => ({
			value: String(project.id),
			label: project.title
		}));
	}, [myProjects]);

	const orcidOptions = useMemo(() => myOrcids.map((orcid: string) => ({ value: orcid, label: orcid })), [myOrcids]);

	const handleClose = () => {
		form.reset();
		setWorks([]);
		setSelectedWorks([]);
		setSelectedType('unknown');
		setForceTypeChange(false);
		setShowStakeholderModal(false);
		setPendingSelectedWorks([]);
		setPendingProjectId(null);
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
				notifications.show({ message: 'No publications found for this ORCID', color: 'blue' });
			}
		} catch (e: any) {
			const status = e?.status || e?.response?.status || e?.data?.status;

			if (status === 400) {
				setForceTypeChange(true);
				notifications.show({
					message: 'Could not detect publication type. Please select a publication type and try again',
					color: 'red'
				});
			} else {
				notifications.show({ message: 'Unexpected error, please try again later', color: 'red' });
			}
		} finally {
			setIsSearching(false);
		}
	};

	const handleSubmitSelected = form.handleSubmit(async ({ projectId }) => {
		if (selectedWorks.length === 0) return;

		const worksWithUniqueId = selectedWorks.filter((w: Publication) => w.uniqueId);

		if (!projectId) {
			notifications.show({ message: 'You need to select a project', color: 'yellow' });
			return;
		}

		if (worksWithUniqueId.length === 0) {
			notifications.show({ message: 'Selected publications have no ID', color: 'yellow' });
			return;
		}

		const selectedProject = myProjects?.find(p => p.id === projectId);
		if (selectedProject?.isPersonal) {
			setPendingSelectedWorks(worksWithUniqueId);
			setPendingProjectId(projectId);
			setShowStakeholderModal(true);
		} else {
			setIsSubmitting(true);
			let successCount = 0;
			let errorCount = 0;

			for (const work of worksWithUniqueId) {
				try {
					const pubReq = { ...work, project: { projectId }, stakeholderIds: [] } as CreateMyPublicationRequest;
					await createMyPublication(pubReq);
					successCount++;
				} catch (e) {
					errorCount++;
				}
			}

			if (successCount > 0) {
				notifications.show({
					message: `Added ${successCount} publication(s) from ORCID`,
					color: 'green'
				});
				await onSuccess();
				handleClose();
			}
			if (errorCount > 0) {
				notifications.show({
					message: `Failed to add ${errorCount} publication(s)`,
					color: 'red'
				});
			}
			setIsSubmitting(false);
			handleClose();
		}
	});

	const handleStakeholderSubmit = async (stakeholderIds: number[]) => {
		if (pendingSelectedWorks.length === 0 || pendingProjectId === null) return;

		setIsSubmitting(true);
		let successCount = 0;
		let errorCount = 0;

		for (const work of pendingSelectedWorks) {
			try {
				const pubReq = { ...work, project: { projectId: pendingProjectId }, stakeholderIds } as CreateMyPublicationRequest;
				await createMyPublication(pubReq);
				successCount++;
			} catch (e) {
				errorCount++;
			}
		}

		if (successCount > 0) {
			notifications.show({
				message: `Added ${successCount} publication(s) from ORCID${stakeholderIds.length > 0 ? ` with ${stakeholderIds.length} stakeholder(s)` : ''}`,
				color: 'green'
			});
		}
		if (errorCount > 0) {
			notifications.show({
				message: `Failed to add ${errorCount} publication(s)`,
				color: 'red'
			});
		}

		setShowStakeholderModal(false);
		setPendingSelectedWorks([]);
		setPendingProjectId(null);
		await onSuccess();
		handleClose();
	};

	return (
		<>
			<Modal opened={opened} onClose={handleClose} title="Add publications by researcher ID" centered size="xxl">
				<form onSubmit={handleSubmitSelected}>
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

						<Controller
							name="projectId"
							control={form.control}
							render={({ field, fieldState }) => (
								<Select
									label="Select project"
									placeholder={isProjectsPending ? 'Loading projects...' : 'Choose a project'}
									data={projectOptions}
									value={field.value ? String(field.value) : null}
									onChange={val => field.onChange(val ? Number(val) : undefined)}
									error={fieldState.error?.message}
									required
									searchable
									nothingFoundMessage="No projects found"
									description="Only active projects you are a member of are shown"
								/>
							)}
						/>

						{works.length > 0 && (
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
									<Text />
									<Button
										onClick={handleSubmitSelected}
										loading={isSubmitting}
										disabled={selectedWorks.length === 0}
									>
										Add {selectedWorks.length} selected
									</Button>
								</Group>
							</>
						)}
					</Stack>
				</form>
			</Modal>

			{showStakeholderModal && (
				<StakeholderSelectionModal
					opened={showStakeholderModal}
					onClose={() => setShowStakeholderModal(false)}
					onSubmit={handleStakeholderSubmit}
					title={`Add Stakeholders (${pendingSelectedWorks.length} publication${pendingSelectedWorks.length > 1 ? 's' : ''})`}
					description={`This is a personal project. Select users who should be added as stakeholders to these ${pendingSelectedWorks.length} publication(s).`}
				/>
			)}
		</>
	);
};
