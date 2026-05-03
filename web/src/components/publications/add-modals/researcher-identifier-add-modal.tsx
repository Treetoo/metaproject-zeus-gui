import { useState, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { DataTable } from 'mantine-datatable';
import { Modal, Button, Group, TextInput, Stack, Select, Text } from '@mantine/core'
import { notifications } from '@mantine/notifications';
import type { Publication } from '@/modules/publication/model';
import { createMyPublication } from '@/modules/publication/api/my-publications';
import { searchByResearcherId } from '@/modules/publication/api/search-by-researcher-id';
import { useMyActiveProjectsQuery } from '@/modules/project/queries';

const schema = z.object({
	identifier: z.string(),
	projectId: z.string({ required_error: "Please select a project" }).min(1, "Please select a project")
});

type FormValues = z.infer<typeof schema>;

interface ResearcherIdentifierAddModalProps {
	opened: boolean;
	onClose: () => void;
	onSuccess: () => Promise<void>;
	projectId: number;
}

export function ResearcherIdentifierAddModal({ opened, onClose, onSuccess }: ResearcherIdentifierAddModalProps) {
	const [inputId, setInputId] = useState('');
	const [works, setWorks] = useState<Publication[]>([]);
	const [selectedWorks, setSelectedWorks] = useState<Publication[]>([]);
	const [isSearching, setIsSearching] = useState(false)
	const [isSubmitting, setIsSubmitting] = useState(false);
	const form = useForm<FormValues>({
		resolver: zodResolver(schema),
		defaultValues: {
			identifier: '',
			projectId: ''
		}
	});

	const { data: myProjects, isPending: isProjectsPending } = useMyActiveProjectsQuery();

	const projectOptions = useMemo(() => {
		if (!myProjects || !Array.isArray(myProjects)) return [];
		return myProjects.map(project => ({
			value: String(project.id),
			label: project.title
		}));
	}, [myProjects]);


	const handleClose = () => {
		setInputId('');
		setWorks([]);
		setSelectedWorks([]);
		onClose();
	};

	const toggleRecord = (record: Publication) => {
		setSelectedWorks((prev) =>
			prev.some((r) => r.uniqueId === record.uniqueId)
				? prev.filter((r) => r.uniqueId !== record.uniqueId)
				: [...prev, record]
		);
	};


	const handleSearchId = async () => {
		const trimmed = inputId.trim();
		if (!trimmed) {
			notifications.show({ message: 'Please enter an ORCID', color: 'yellow' });
			return;
		}

		setIsSearching(true);
		try {
			const result = await searchByResearcherId(trimmed);
			setWorks(result?.works || []);
			if (!result?.works?.length) {
				notifications.show({ message: 'No publications found for this ORCID', color: 'blue' });
			}
		} catch (error) {
			notifications.show({ message: 'Failed to search by ORCID', color: 'red' });
		} finally {
			setIsSearching(false);
		}
	};

	const handleSubmitSelected = form.handleSubmit(async ({ projectId }) => {
		if (selectedWorks.length === 0) return;

		const worksWithUniqueId = selectedWorks.filter((w: Publication) => w.uniqueId);
		if (worksWithUniqueId.length === 0) {
			notifications.show({ message: 'Selected publications have no DOI', color: 'yellow' });
			return;
		}

		if (worksWithUniqueId.length < selectedWorks.length) {
			notifications.show({
				message: `${selectedWorks.length - worksWithUniqueId.length} publication(s) skipped (no DOI)`,
				color: 'yellow'
			});
		}

		setIsSubmitting(true);
		let successCount = 0;
		let errorCount = 0;

		for (const work of worksWithUniqueId) {
			try {
				work.source = "doi";
				work.project = { projectId };
				await createMyPublication(work)
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
	})

	return (
		<Modal opened={opened} onClose={handleClose} title="Add publications by researcher ID" centered size="xxl">
			<form onSubmit={handleSubmitSelected}>
				<Stack>
					<Group align="flex-end">
						<TextInput
							label="Researcher ID"
							placeholder="0000-0002-8529-9990"
							value={inputId}
							onChange={(e) => setInputId(e.currentTarget.value)}
							style={{ flex: 1 }}
						/>
						<Button
							onClick={handleSearchId}
							loading={isSearching}
							disabled={!inputId.trim()}
						>
							Search
						</Button>
					</Group>

					<Controller
						name="projectId"
						control={form.control}
						render={({ field, fieldState }) => (
							<Select
								label="Select project"
								placeholder={isProjectsPending ? "Loading projects..." : "Choose a project"}
								data={projectOptions}
								value={field.value}
								onChange={(val) => field.onChange(val ?? '')}
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
								idAccessor='uniqueId'
								selectable
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
								<Button variant="default" onClick={handleClose}>Cancel</Button>
								<Text>
								</Text>
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
	);
}
