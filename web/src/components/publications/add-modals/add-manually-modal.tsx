import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod';
import { Modal, Button, TextInput, Group, NumberInput } from '@mantine/core'
import { notifications } from '@mantine/notifications';
import type { Publication } from '@/modules/publication/model';
import { createMyPublication, updateMyPublication } from '@/modules/publication/api/my-publications';
import { manualPublicationSchema, ManualPublicationSchema } from '@/modules/publication/form'

interface AddManuallyModalProps {
	opened: boolean;
	onClose: () => void;
	onSuccess: () => Promise<void>;
	editPublication?: Publication | null;
}

export function AddManuallyModal({ opened, onClose, onSuccess, editPublication }: AddManuallyModalProps) {
	const isEditMode = !!editPublication;
	const addForm = useForm({
		resolver: zodResolver(manualPublicationSchema),
		defaultValues: isEditMode ? {
			title: editPublication.title,
			authors: editPublication.authors,
			year: editPublication.year,
			journal: editPublication.journal,
		} : undefined
	});

	const handleClose = () => {
		addForm.reset();
		onClose()
	};

	useEffect(() => {
		if (editPublication) {
			addForm.reset({
				title: editPublication.title,
				authors: editPublication.authors,
				year: editPublication.year,
				journal: editPublication.journal,
			});
		}
	}, [editPublication, addForm]);

	const handleSubmit = addForm.handleSubmit(async (values: ManualPublicationSchema) => {
		try {
			if (isEditMode && editPublication?.id) {
				await updateMyPublication(editPublication.id, { ...values, source: editPublication.source || 'manual' });
				notifications.show({ message: 'Publication updated' });
			} else {
				await createMyPublication({ ...values, source: 'manual' });
				notifications.show({ message: 'Publication added' });
			}
			onSuccess();
			handleClose();
		} catch (error) {
			notifications.show({ message: 'Error', color: 'red' });
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
					render={({ field }: { field: { value: number | undefined; onChange: (value: number | string | null) => void } }) => (
						<NumberInput
							label="Year"
							min={0}
							max={2200}
							value={field.value}
							onChange={(value: string | number) => field.onChange(typeof value === 'number' ? value : null)}
							error={addForm.formState.errors.year?.message}
							withAsterisk
						/>
					)}
				/>
				<TextInput label="Journal" {...addForm.register('journal')} error={addForm.formState.errors.journal?.message} withAsterisk />
				<Group mt={15} justify="flex-end">
					<Button variant="default" type="button" onClick={handleClose}>Cancel</Button>
					<Button type="submit" loading={addForm.formState.isSubmitting}>
						{isEditMode ? 'Update publication' : 'Add publication'}
					</Button>
				</Group>
			</form>
		</Modal>
	)
}
