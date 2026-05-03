import { useEffect, useMemo, useState } from 'react';
import { useForm, Controller } from 'react-hook-form'; // 1. Import Controller
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal, Button, Group, TextInput, Select, Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { createMyPublicationById, assignMyPublicationToProject } from '@/modules/publication/api/my-publications';
import { useMyActiveProjectsQuery } from '@/modules/project/queries';

const schema = z.object({
	identifier: z.string().min(1, "Identifier is required"),
	projectId: z.number({ required_error: "Please select a project" }).min(1, "Please select a project")
});

type FormValues = z.infer<typeof schema>;

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
	{ value: 'arxiv', label: 'arXiv' },
];

export function IdentifierAddModal({ opened, onClose, onSuccess, title, label, placeholder, projectId: activeProjectId }: IdentifierAddModalProps) {
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [selectedType, setSelectedType] = useState<string>('unknown');
	const [forceTypeChange, setForceTypeChange] = useState(false);
	const { data: myProjects, isPending: isProjectsPending } = useMyActiveProjectsQuery();

	const projectOptions = useMemo(() => {
		if (!myProjects || !Array.isArray(myProjects)) return [];
		return myProjects.map(project => ({
			value: String(project.id),
			label: project.title
		}));
	}, [myProjects]);

	const form = useForm<FormValues>({
		resolver: zodResolver(schema),
		defaultValues: {
			identifier: '',
			projectId: ''
		}
	});

	useEffect(() => {
		if (projectOptions.length === 1) {
			form.setValue('projectId', Number(projectOptions[0].value), { shouldValidate: true });
		}
	}, [projectOptions, form]);

	const handleClose = () => {
		form.reset();
		if (projectOptions.length === 1) {
			form.setValue('projectId', Number(projectOptions[0].value), { shouldValidate: true });
		}
		setSelectedType('unknown');
		setForceTypeChange(false);
		onClose();
	};

	const handleSubmit = form.handleSubmit(async ({ identifier, projectId }) => {
		if (forceTypeChange && selectedType === 'unknown') {
			notifications.show({
				message: 'Previous attempt failed. Please select a specific type from the dropdown or cancel.',
				color: 'orange'
			});
			return;
		}

		setIsSubmitting(true);
		try {
			const result = await createMyPublicationById({
				uniqueId: identifier.trim(),
				type: selectedType,
				project: { projectId: projectId }
			});

			if (activeProjectId) {
				if (result && typeof result === 'object' && 'id' in result) {
					await assignMyPublicationToProject(result.id, activeProjectId);
					notifications.show({ message: `Publication added by ${label} and assigned to project`, color: 'green' });
				} else {
					throw new Error('Publication created but response is missing id field');
				}
			} else {
				notifications.show({ message: `Publication added by ${label}` });
			}
			await onSuccess();
			handleClose();
		} catch (e: any) {
			const status = e?.status ||

				e?.response?.status ||
				e?.data?.status;

			if (status === 409) {
				notifications.show({ message: 'Publication is already present.', color: 'orange' });
				handleClose();
			} else if (status === 400) {
				setForceTypeChange(true);
				notifications.show({ message: 'Could not detect publication type. Please select a publication type and try again', color: 'red' });
			} else {
				notifications.show({ message: 'Unexpected error, please try again later', color: 'red' });
			}
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
						<Controller
							name="projectId"
							control={form.control}
							render={({ field, fieldState }) => (
								<Select
									label="Select project"
									placeholder={isProjectsPending ? "Loading projects..." : "Choose a project"}
									data={projectOptions}
									value={field.value ? String(field.value) : null}
									onChange={(val) => field.onChange(val ? Number(val) : undefined)}
									error={fieldState.error?.message}
									required
									searchable
									nothingFoundMessage="No projects found"
									description="Only active projects you are a member of are shown"
								/>
							)}
						/>
					</Group>
				)}
				<Group mt={15} justify="flex-end">
					<Button variant="default" type="button" onClick={handleClose}>Cancel</Button>
					<Button variant="filled" type="submit" loading={isSubmitting}>Add</Button>
				</Group>
			</form>
		</Modal>
	);
}
