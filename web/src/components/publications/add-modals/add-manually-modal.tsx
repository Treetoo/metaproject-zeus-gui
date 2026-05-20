import { useEffect, useMemo, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Modal, Button, TextInput, Group, NumberInput, Select, Stack, Alert } from '@mantine/core';
import { notifications } from '@mantine/notifications';

import type { Publication, PublicationSource } from '@/modules/publication/model';
import { createMyPublication, updateMyPublication, type CreditorInput } from '@/modules/publication/api/my-publications';
import { manualPublicationSchema, type ManualPublicationSchema } from '@/modules/publication/form';
import { useMyActiveProjectsQuery } from '@/modules/project/queries';

import { StakeholderSelectionModal, type SelectedStakeholder } from './stakeholder-selection-modal';

type AddManuallyModalProps = {
	opened: boolean;
	onClose: () => void;
	onSuccess: () => Promise<void>;
	editPublication?: Publication | null;
	fetchedPublication?: Publication | null;
	sourceType?: PublicationSource | null;
	allowSkip?: boolean;
	onSkip?: () => void;
	onCancelSequential?: () => void;
};

export const AddManuallyModal = ({
	opened,
	onClose,
	onSuccess,
	editPublication,
	fetchedPublication,
	sourceType,
	allowSkip,
	onSkip,
	onCancelSequential
}: AddManuallyModalProps) => {
	const { data: myProjects, isPending: isProjectsPending } = useMyActiveProjectsQuery();

	const projectOptions = useMemo(() => {
		if (!myProjects || !Array.isArray(myProjects)) return [];
		return myProjects.map(project => ({
			value: String(project.id),
			label: project.title
		}));
	}, [myProjects]);

	const [showStakeholderModal, setShowStakeholderModal] = useState(false);
	const [pendingFormValues, setPendingFormValues] = useState<ManualPublicationSchema | null>(null);
	const [pendingProjectId, setPendingProjectId] = useState<number | null>(null);
	const [pendingStakeholders, setPendingStakeholders] = useState<{ userId: number; fairShareEligible: boolean }[]>([]);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const defaultProjectId = useMemo(() => {
		if (projectOptions.length === 1) return projectOptions[0].value;
		return undefined;
	}, [projectOptions]);

	const isEditMode = !!editPublication;
	const isFetchedMode = !!fetchedPublication && !!sourceType;

	const createForm = () =>
		useForm<ManualPublicationSchema>({
			resolver: zodResolver(manualPublicationSchema),
			defaultValues: isEditMode
				? {
					title: editPublication.title,
					authors: editPublication.authors,
					year: editPublication.year,
					journal: editPublication.journal,
					url: editPublication.url
				}
				: isFetchedMode
					? {
						title: fetchedPublication.title,
						authors: fetchedPublication.authors,
						year: fetchedPublication.year,
						journal: fetchedPublication.journal,
						url: fetchedPublication.url
					}
					: {
						title: '',
						authors: '',
						year: undefined,
						journal: '',
						url: '',
						projectId: defaultProjectId ? Number(defaultProjectId) : undefined
					}
		});
	const addForm = createForm();

	useEffect(() => {
		if (editPublication) {
			addForm.reset({
				title: editPublication.title,
				authors: editPublication.authors,
				year: editPublication.year,
				journal: editPublication.journal,
				url: editPublication.url
			});
		} else if (fetchedPublication) {
			addForm.reset({
				title: fetchedPublication.title,
				authors: fetchedPublication.authors,
				year: fetchedPublication.year,
				journal: fetchedPublication.journal,
				url: fetchedPublication.url
			});
		}

		if (projectOptions.length === 1) {
			addForm.setValue('projectId', Number(projectOptions[0].value), { shouldValidate: true });
		}
	}, [projectOptions, editPublication, fetchedPublication, addForm]);

	useEffect(() => {
		if (opened && !isEditMode) {
			setShowStakeholderModal(false);
			setPendingFormValues(null);
			setPendingProjectId(null);
		}
	}, [opened, isEditMode]);

	const handleClose = (cancelSeq = false) => {
		addForm.reset({
			title: '',
			authors: '',
			year: null,
			journal: '',
			url: '',
			projectId: !isEditMode && defaultProjectId ? Number(defaultProjectId) : undefined
		});
		if (cancelSeq && onCancelSequential) {
			onCancelSequential();
		} else {
			onClose();
		}
	};

	const handleCloseSequential = () => {
		handleClose(true);
	};

	const handleSubmit = addForm.handleSubmit(async (values: ManualPublicationSchema) => {
		if (values.year === null || values.authors === '' || values.journal === '' || values.title === '') {
			notifications.show({ message: 'All fields must be set.', color: 'yellow' });
			return;
		}

		try {
			if (isEditMode && editPublication?.id) {
				await updateMyPublication(editPublication.id, {
					...values,
					year: values.year as number,
					source: editPublication.source || 'manual'
				});
				notifications.show({ message: 'Publication updated', color: 'green' });
				onSuccess();
				handleClose();
			} else {
				if (!values.projectId) {
					notifications.show({ message: 'Please select a project', color: 'yellow' });
					return;
				}

				const selectedProject = myProjects?.find(p => p.id === values.projectId);
				setPendingFormValues(values);
				setPendingProjectId(values.projectId);
				setShowStakeholderModal(true);
			}
		} catch (error: any) {
			const status = error?.response?.status || error?.status;

			if (status === 409) {
				notifications.show({
					message: 'This publication already exists in the system.',
					color: 'orange'
				});
				if (onSkip) {
					onSkip();
				} else {
					handleClose();
				}
			} else if (status === 403) {
				notifications.show({
					message: 'This publication cannot be modified because it has already been approved.',
					color: 'orange'
				});
				handleClose();
			} else {
				notifications.show({ message: 'Failed to save publication. Please try again.', color: 'red' });
				handleClose();
			}
		}
	});

	const handleStakeholderSubmit = async (selectedStakeholders: SelectedStakeholder[]) => {
		if (!pendingFormValues || !pendingProjectId) return;


		// Transform SelectedStakeholder[] to CreditorInput[]
		// All selected users become creditors, and those with fairShareEligible=true also become stakeholders
		const creditors: CreditorInput[] = selectedStakeholders.map((s) => ({
			userId: s.userId,
			fairShareEligible: s.fairShareEligible,
			isStakeholder: s.fairShareEligible
		}));
		try {
			await createMyPublication({
				...pendingFormValues,
				source:
					isFetchedMode && fetchedPublication?.source && fetchedPublication.source !== 'auto'
						? fetchedPublication.source
						: isFetchedMode
							? (sourceType as string)
							: 'manual',
				year: pendingFormValues.year as number,
				project: { projectId: pendingProjectId },
				creditors,
				...(isFetchedMode && fetchedPublication ? { uniqueId: fetchedPublication.uniqueId } : {})
			});

			notifications.show({
				message: `Publication added${creditors.length > 0 ? ` with ${creditors.length} creditor(s)` : ''}`,
				color: 'green'
			});

			setShowStakeholderModal(false);
			setPendingFormValues(null);
			setPendingProjectId(null);
			onSuccess();
			handleClose();
		} catch (error: any) {
			const status = error?.response?.status || error?.status;

			if (status === 409) {
				notifications.show({
					message: 'This publication already exists in the system.',
					color: 'orange'
				});
				setShowStakeholderModal(false);
				setPendingFormValues(null);
				setPendingProjectId(null);
				if (onSkip) {
					onSkip();
				} else {
					handleClose();
				}
				return;
			} else if (status === 403) {
				notifications.show({
					message: 'This publication cannot be modified because it has already been approved.',
					color: 'orange'
				});
			} else {
				notifications.show({ message: 'Failed to save publication. Please try again.', color: 'red' });
			}
			setShowStakeholderModal(false);
			setPendingFormValues(null);
			setPendingProjectId(null);
			handleClose();
		}
	};

	return (
		<>
			<Modal
				opened={opened}
				onClose={handleClose}
				title={isEditMode ? 'Edit publication' : 'Add publication'}
				centered
				size="xl"
			>
				<form onSubmit={handleSubmit}>
					<TextInput
						label="Title"
						{...addForm.register('title')}
						error={addForm.formState.errors.title?.message}
						withAsterisk
					/>
					<TextInput
						label="Authors"
						{...addForm.register('authors')}
						error={addForm.formState.errors.authors?.message}
						withAsterisk
					/>
					<Controller
						control={addForm.control}
						name="year"
						render={({
							field
						}: {
							field: { value: number | null; onChange: (value: number | string | null) => void };
						}) => (
							<NumberInput
								label="Year"
								value={field.value as number}
								onChange={value => field.onChange(typeof value === 'number' ? value : null)}
								error={addForm.formState.errors.year?.message}
								withAsterisk
							/>
						)}
					/>
					<TextInput
						label="Journal"
						{...addForm.register('journal')}
						error={addForm.formState.errors.journal?.message}
						withAsterisk
					/>
					<TextInput
						label="URL"
						{...addForm.register('url')}
						error={addForm.formState.errors.url?.message}
						withAsterisk
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
									onChange={val => field.onChange(val ? Number(val) : undefined)}
									error={fieldState.error?.message}
									required
									searchable
									nothingFoundMessage="No projects found"
									description="Only active projects you are a member of are shown"
								/>
							)}
						/>
					)}

					<Group mt={15} justify="flex-end">
						{allowSkip && (
							<Button variant="light" type="button" onClick={onSkip}>
								Skip
							</Button>
						)}
						<Button variant="default" type="button" onClick={handleCloseSequential}>
							Cancel
						</Button>
						<Button type="submit" loading={addForm.formState.isSubmitting}>
							{isEditMode ? 'Update publication' : isFetchedMode ? 'Add publication' : 'Add publication'}
						</Button>
					</Group>
				</form>
			</Modal>

			{showStakeholderModal && (
				<StakeholderSelectionModal
					opened={showStakeholderModal}
					onClose={() => setShowStakeholderModal(false)}
					onSubmit={handleStakeholderSubmit}
					description="Select users who should be added as stakeholders to this publication."
				/>
			)}
		</>
	);
};
