import { useState } from 'react';
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal, Button, Group, TextInput, Select } from '@mantine/core'
import { notifications } from '@mantine/notifications';
import type { Publication } from '@/modules/publication/model';
import { createMyPublication, createMyPublicationById } from '@/modules/publication/api/my-publications';
import { searchByPubId } from '@/modules/publication/api/search-by-publication-id';

const schema = z.object({ identifier: z.string() });

interface IdentifierAddModalProps {
	opened: boolean;
	onClose: () => void;
	onSuccess: () => Promise<void>;
	title: string;
	label: string;
	placeholder: string;
}

const TYPE_OPTIONS = [
	{ value: 'unknown', label: 'Auto Detect' }, // Preselected default
	{ value: 'doi', label: 'DOI' },
	{ value: 'pmid', label: 'PMID' },
	{ value: 'isbn', label: 'ISBN' },
];

export function IdentifierAddModal({ opened, onClose, onSuccess, title, label, placeholder }: IdentifierAddModalProps) {
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [selectedType, setSelectedType] = useState<string>('unknown');
	const [forceTypeChange, setForceTypeChange] = useState(false); // Flag to force user action on error

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

		// `TODO:` Replace with functions
		if (forceTypeChange && selectedType === 'unknown') {
			notifications.show({
				message: 'Previous attempt failed. Please select a specific type from the dropdown or cancel.',
				color: 'orange'
			});
			return;
		}
		setIsSubmitting(true);
		try {
			console.log(identifier);
			await createMyPublicationById({ uniqueId: identifier, type: selectedType });

			notifications.show({ message: `Publication added by ${label}` });
			await onSuccess();
			handleClose();
		} catch {
			setForceTypeChange(true);
			notifications.show({ message: 'Error adding publication. Please choose a different type and try again', color: 'red' });
		} finally {
			setIsSubmitting(false);
		}
	});

	return (
		<Modal opened={opened} onClose={handleClose} title={title} centered size="md">
			<form onSubmit={handleSubmit}>
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
				</Group>
				<Group mt={15} justify="flex-end">
					<Button variant="default" type="button" onClick={handleClose}>Cancel</Button>
					<Button variant="default" type="button" onClick={handleSubmit}>Add</Button>
				</Group>
			</form>
		</Modal>
	);
}

