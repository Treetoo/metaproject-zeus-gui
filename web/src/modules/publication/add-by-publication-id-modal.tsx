import { useState } from 'react';
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal, Button, Group, TextInput } from '@mantine/core'
import { notifications } from '@mantine/notifications';
import type { Publication } from '@/modules/publication/model';
import { createMyPublication } from '@/modules/publication/api/my-publications';
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

export function IdentifierAddModal({ opened, onClose, onSuccess, title, label, placeholder }: IdentifierAddModalProps) {
	const [isSubmitting, setIsSubmitting] = useState(false);
	const form = useForm({ resolver: zodResolver(schema) })

	const handleClose = () => {
		form.reset();
		onClose();
	};

	const handleSubmit = form.handleSubmit(async ({ identifier }: { identifier: string }) => {
		const trimmed = identifier.trim();
		if (!trimmed) {
			form.setError('identifier', { message: `${label} is required` });
			return;
		}

		// `TODO:` Replace with functions
		const type = 'doi'

		setIsSubmitting(true);
		try {
			const publication = await searchByPubId(trimmed);
			if (!publication) {
				form.setError('identifier', { message: 'Publication not found' });
				setIsSubmitting(false);
				return;
			}

			await createMyPublication({
				source: type,
				uniqueId: trimmed,
				title: publication.title,
				authors: publication.authors,
				year: publication.year,
				journal: publication.journal,
			});

			notifications.show({ message: `Publication added by ${label}` });
			await onSuccess();
			handleClose();
		} catch {
			notifications.show({ message: 'Error adding publication', color: 'red' });
		} finally {
			setIsSubmitting(false);
		}
	});

	return (
		<Modal opened={opened} onClose={handleClose} title={title} centered size="md">
			<form onSubmit={handleSubmit}>
				<TextInput
					label={label}
					placeholder={placeholder}
					{...form.register('identifier')}
					error={form.formState.errors.identifier?.message}
					required
				/>
				<Group mt={15} justify="flex-end">
					<Button variant="default" type="button" onClick={handleClose}>Cancel</Button>
					<Button variant="default" type="button" onClick={handleSubmit}>Add</Button>
				</Group>
			</form>
		</Modal>
	);
}

