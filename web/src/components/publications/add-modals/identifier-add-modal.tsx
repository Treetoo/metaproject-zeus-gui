import { useEffect, useState } from 'react';
import { Modal, Button, Group, TextInput, Select, Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';

import { getMyPublicationById } from '@/modules/publication/api/my-publications';
import { type PublicationSource, type Publication } from '@/modules/publication/model';
import { searchByPubId } from '@/modules/publication/api/search-by-publication-id';

import { AddManuallyModal } from './add-manually-modal';

type IdentifierAddModalProps = {
	opened: boolean;
	onClose: () => void;
	onSuccess: () => Promise<void>;
	title: string;
	label: string;
	placeholder: string;
};

type TypeOption = {
	value: PublicationSource;
	label: string;
};
const TYPE_OPTIONS: TypeOption[] = [
	{ value: 'auto', label: 'Auto Detect' },
	{ value: 'doi', label: 'DOI' },
	{ value: 'pubmed', label: 'PMID' },
	{ value: 'isbn', label: 'ISBN' },
	{ value: 'nma', label: 'NMA' },
	{ value: 'arxiv', label: 'arXiv' },
	{ value: 'openalex', label: 'OpenAlex Work ID' }
];

export const IdentifierAddModal = ({
	opened,
	onClose,
	onSuccess,
	title,
	label,
	placeholder
}: IdentifierAddModalProps) => {
	const [selectedType, setSelectedType] = useState<PublicationSource>('auto');
	const [forceTypeChange, setForceTypeChange] = useState(false);
	const [inputId, setInputId] = useState('');
	const [fetchedPublication, setFetchedPublication] = useState<Publication | null>(null);
	const [isFetching, setIsFetching] = useState(false);

	useEffect(() => {
		if (opened) {
			setInputId('');
			setSelectedType('auto');
			setForceTypeChange(false);
			setFetchedPublication(null);
		}
	}, [opened]);

	const handleClose = () => {
		setInputId('');
		setSelectedType('auto');
		setForceTypeChange(false);
		setFetchedPublication(null);
		onClose();
	};

	const handleFetchPublication = async () => {
		const trimmed = inputId.trim();
		if (!trimmed) {
			notifications.show({ message: 'Please enter an identifier', color: 'yellow' });
			return;
		}

		if (forceTypeChange && selectedType === 'auto') {
			notifications.show({
				message: 'Previous attempt failed. Please select a specific type from the dropdown or cancel.',
				color: 'orange'
			});
			return;
		}

		setIsFetching(true);
		try {
			const result = await searchByPubId(trimmed, selectedType);
			setFetchedPublication(result);
		} catch (e: any) {
			const status = e?.status || e?.response?.status || e?.data?.status;

			if (status === 400) {
				setForceTypeChange(true);
				notifications.show({
					message:
						'Could not detect publication type automatically. Please select a type from the dropdown and try again.',
					color: 'orange'
				});
			} else if (status === 404) {
				notifications.show({
					message: 'No publication found with this identifier. Please check the ID and try again.',
					color: 'red'
				});
			} else if (status === 409) {
				notifications.show({
					message: 'This publication already exists in the system.',
					color: 'orange'
				});
			} else {
				notifications.show({ message: 'An unexpected error occurred. Please try again later.', color: 'red' });
			}
		} finally {
			setIsFetching(false);
		}
	};

	return (
		<>
			<Modal opened={opened} onClose={handleClose} title={title} centered size="lg">
				<Group align="flex-start" grow>
					<TextInput
						label={label}
						placeholder={placeholder}
						value={inputId}
						onChange={event => setInputId(event.currentTarget.value)}
						required
					/>
					<Select
						label="Type"
						data={TYPE_OPTIONS}
						value={selectedType}
						onChange={value => {
							setSelectedType(value as PublicationSource);
							if (value !== 'auto') setForceTypeChange(false);
						}}
						error={forceTypeChange && selectedType === 'auto' ? 'Selection required' : false}
						w={150}
					/>
					<Button onClick={handleFetchPublication} loading={isFetching} disabled={!inputId?.trim()} w={100}>
						Search
					</Button>
				</Group>
			</Modal>

			{fetchedPublication && (
				<AddManuallyModal
					opened
					onClose={() => setFetchedPublication(null)}
					onSuccess={async () => {
						await onSuccess();
						setFetchedPublication(null);
						handleClose();
					}}
					fetchedPublication={fetchedPublication}
					sourceType={selectedType}
				/>
			)}
		</>
	);
};
