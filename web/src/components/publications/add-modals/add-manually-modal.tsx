import { useEffect, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Modal, Button, TextInput, Group, NumberInput, Select } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import type { Publication } from '@/modules/publication/model';
import { createMyPublication, updateMyPublication } from '@/modules/publication/api/my-publications';
import { manualPublicationSchema, ManualPublicationSchema } from '@/modules/publication/form';
import { useMyActiveProjectsQuery } from '@/modules/project/queries';

interface AddManuallyModalProps {
	opened: boolean;
	onClose: () => void;
	onSuccess: () => Promise<void>;
	editPublication?: Publication | null;
}

export function AddManuallyModal({ opened, onClose, onSuccess, editPublication }: AddManuallyModalProps) {
	const { data: myProjects, isPending: isProjectsPending } = useMyActiveProjectsQuery();

	const projectOptions = useMemo(() => {
		if (!myProjects || !Array.isArray(myProjects)) return [];
		return myProjects.map((project) => ({
			value: String(project.id),
			label: project.title,
		}));
	}, [myProjects]);

	const defaultProjectId = useMemo(() => {
		if (projectOptions.length === 1) return projectOptions[0].value;
		return undefined;
	}, [projectOptions]);

	const isEditMode = !!editPublication;

	const createForm = () => useForm<ManualPublicationSchema>({
		resolver: zodResolver(manualPublicationSchema),
		defaultValues: isEditMode
			? {
				title: editPublication.title,
				authors: editPublication.authors,
				year: editPublication.year,
				journal: editPublication.journal,
				url: editPublication.url,
			} : {
				title: '',
				authors: '',
				year: undefined,
				journal: '',
				url: '',
				projectId: defaultProjectId ? Number(defaultProjectId) : undefined
			}
	});
	let addForm = createForm();

	useEffect(() => {
		if (editPublication) {
			addForm.reset({
				title: editPublication.title,
				authors: editPublication.authors,
				year: editPublication.year,
				journal: editPublication.journal,
				url: editPublication.url,
			});
		}

		if (projectOptions.length === 1) {
			addForm.setValue('projectId', Number(projectOptions[0].value), { shouldValidate: true });
		}

	}, [projectOptions, editPublication, addForm]);

	const handleClose = () => {
		addForm.reset({
			title: '',
			authors: '',
			year: null,
			journal: '',
			url: '',
			projectId: !isEditMode && defaultProjectId ? Number(defaultProjectId) : undefined
		});
		onClose();
	};

	const handleSubmit = addForm.handleSubmit(async (values: ManualPublicationSchema) => {
		if (values.year === null || values.authors === '' || values.journal === '' || values.title === '') {
			notifications.show({ message: 'All fields must be set.', color: 'yellow' });
			return;
		}

		try {
			if (isEditMode && editPublication?.id) {
				await updateMyPublication(editPublication.id, { ...values, year: values.year as number, source: editPublication.source || 'manual' });
				notifications.show({ message: 'Publication updated', color: 'green' });
			} else {
				if (!values.projectId) {
					notifications.show({ message: 'Please select a project', color: 'yellow' });
					return;
				}
				await createMyPublication({ ...values, source: 'manual', year: values.year as number, project: { projectId: values.projectId } });
				notifications.show({ message: 'Publication added', color: 'green' });
			}
			onSuccess();
		} catch (error) {
			notifications.show({ message: 'Error saving publication', color: 'red' });
		} finally {
			handleClose();
		}
	});

	return (
		<Modal opened={opened} onClose={handleClose} title={isEditMode ? 'Edit publication' : 'Add publication'} centered size="xl">
			<form onSubmit={handleSubmit}>
				<TextInput label="Title" {...addForm.register('title')} error={addForm.formState.errors.title?.message} withAsterisk />
				<TextInput label="Authors" {...addForm.register('authors')} error={addForm.formState.errors.authors?.message} withAsterisk />
				<Controller
					control={addForm.control}
					name="year"
					render={({ field }: { field: { value: number | null; onChange: (value: number | string | null) => void } }) => (
						<NumberInput
							label="Year"
							value={field.value as number}
							onChange={(value) => field.onChange(typeof value === 'number' ? value : null)}
							error={addForm.formState.errors.year?.message}
							withAsterisk
						/>
					)}
				/>
				{!isEditMode && (
					<Controller
						name="projectId"
						control={addForm.control}
						render={({ field, fieldState }) => (
							<Select
								label="Select project"
								placeholder={isProjectsPending ? 'Loading projects...' : 'Choose a project'}
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
				)}
				<TextInput label="Journal" {...addForm.register('journal')} error={addForm.formState.errors.journal?.message} withAsterisk />
				<TextInput label="URL" {...addForm.register('url')} error={addForm.formState.errors.url?.message} withAsterisk />
				<Group mt={15} justify="flex-end">
					<Button variant="default" type="button" onClick={handleClose}>
						Cancel
					</Button>
					<Button type="submit" loading={addForm.formState.isSubmitting}>
						{isEditMode ? 'Update publication' : 'Add publication'}
					</Button>
				</Group>
			</form>
		</Modal>
	);
}
