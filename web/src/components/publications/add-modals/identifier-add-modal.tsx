import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal, Button, Group, TextInput, Select } from '@mantine/core'
import { notifications } from '@mantine/notifications';
import { createMyPublicationById, assignMyPublicationToProject } from '@/modules/publication/api/my-publications';
import { useMyActiveProjectsQuery } from '@/modules/project/queries';

const schema = z.object({ identifier: z.string() });

interface IdentifierAddModalProps {
	opened: boolean;
	onClose: () => void;
	onSuccess: () => Promise<void>;
	title: string;
	label: string;
	placeholder: string;
	projectId: number;
}

const TYPE_OPTIONS = [
	{ value: 'unknown', label: 'Auto Detect' },
	{ value: 'doi', label: 'DOI' },
	{ value: 'pubmed', label: 'PMID' },
	{ value: 'isbn', label: 'ISBN' },
	{ value: 'nma', label: 'NMA' },
];

export function IdentifierAddModal({ opened, onClose, onSuccess, title, label, placeholder, projectId }: IdentifierAddModalProps) {
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [selectedType, setSelectedType] = useState<string>('unknown');
	const [forceTypeChange, setForceTypeChange] = useState(false);
	const { data: myProjects, isPending: isProjectsPending } = useMyActiveProjectsQuery();
	const [assignProjectId, setAssignProjectId] = useState<string | null>(null);

	const projectOptions = useMemo(() => {
		if (!myProjects || !Array.isArray(myProjects)) return [];
		return myProjects.map(project => ({
			value: String(project.id),
			label: project.title
		}));
	}, [myProjects]);

	useEffect(() => {
		if (projectOptions.length === 1) {
			setAssignProjectId(projectOptions[0].value);
		}
	}, [projectOptions]);

	const form = useForm({ resolver: zodResolver(schema) })

	const handleClose = () => {
		form.reset();
		setSelectedType('unknown');
		setForceTypeChange(false);
		onClose();
	};

	const handleSubmit = form.handleSubmit(async ({ identifier }: { identifier: string }) => {
		const trimmed = identifier.trim();
		if (!trimmed) {
			form.setError('identifier', { message: `${label} is required` });
			return;
		}

		if (forceTypeChange && selectedType === 'unknown') {
			notifications.show({
				message: 'Previous attempt failed. Please select a specific type from the dropdown or cancel.',
				color: 'orange'
			});
			return;
		}
		setIsSubmitting(true);
		try {
			console.log(assignProjectId);
			const result = await createMyPublicationById({ uniqueId: identifier, type: selectedType, projectId: assignProjectId });

			if (projectId) {
				if (result && typeof result === 'object' && 'id' in result) {
					await assignMyPublicationToProject(result.id, projectId);
					notifications.show({ message: `Publication added by ${label} and assigned to project`, color: 'green' });
				} else {
					console.error('Missing id in response:', result);
					throw new Error('Publication created but response is missing id field');
				}
			} else {
				notifications.show({ message: `Publication added by ${label}` });
			}
			await onSuccess();
			handleClose();
		} catch (e) {
			console.error('Error:', e);
			setForceTypeChange(true);
			notifications.show({ message: e instanceof Error ? e.message : 'Error adding publication', color: 'red' });
		} finally {
			setIsSubmitting(false);
		}
	});

	return (
		<Modal opened={opened} onClose={handleClose} title={title} centered size="md">
			<form onSubmit={handleSubmit}>
				{!isProjectsPending && projectOptions.length === 0 ? (
					<Text c="dimmed" size="sm">
						You don't have any active projects to assign publications to.
						Please create a project first or wait for your project request to be approved.
					</Text>
				) : (
					<Group align="flex-start">
						<TextInput
							label={label}
							placeholder={placeholder}
							{...form.register('identifier')}
							error={form.formState.errors.identifier?.message}
							required
						/>
						<Select
							label="Type"
							data={TYPE_OPTIONS}
							value={selectedType}
							onChange={(value) => {
								setSelectedType(value || 'unknown');
								if (value !== 'unknown') setForceTypeChange(false);
							}}
							error={forceTypeChange && selectedType === 'unknown' ? 'Selection required' : false}
						/>
						<Select
							label="Select project"
							placeholder={isProjectsPending ? "Loading projects..." : "Choose a project"}
							data={projectOptions}
							value={assignProjectId}
							onChange={setAssignProjectId}
							// TODO: check
							//disabled={assignMutation.isPending || isProjectsPending}
							searchable
							nothingFoundMessage="No projects found"
							description="Only active projects you are a member of are shown"
						/>
					</Group>
				)}
				<Group mt={15} justify="flex-end">
					<Button variant="default" type="button" onClick={handleClose}>Cancel</Button>
					<Button variant="default" type="button" onClick={handleSubmit}>Add</Button>
				</Group>
			</form>
		</Modal >
	);
}
