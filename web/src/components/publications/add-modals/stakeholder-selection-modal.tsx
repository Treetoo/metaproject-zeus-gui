import { useState, useEffect } from 'react';
import { Modal, Button, Group, MultiSelect, Stack, Text, Alert } from '@mantine/core';
import { IconInfoCircle } from '@tabler/icons-react';

import { searchUsers } from '@/modules/user/api/search-users';
import type { UserInfo } from '@/modules/user/model';

type StakeholderSelectionModalProps = {
	opened: boolean;
	onClose: () => void;
	onSubmit: (stakeholderIds: number[]) => Promise<void>;
	title?: string;
	description?: string;
};

export const StakeholderSelectionModal = ({
	opened,
	onClose,
	onSubmit,
	title,
	description
}: StakeholderSelectionModalProps) => {
	const [selectedStakeholders, setSelectedStakeholders] = useState<string[]>([]);
	const [userOptions, setUserOptions] = useState<{ value: string; label: string }[]>([]);
	const [isSearching, setIsSearching] = useState(false);
	const [searchQuery, setSearchQuery] = useState('');

	// Fetch users when search query changes (debounced)
	useEffect(() => {
		if (searchQuery.length < 3) {
			setUserOptions([]);
			return;
		}

		const fetchUsers = async () => {
			setIsSearching(true);
			try {
				const users = await searchUsers(searchQuery);
				const options = users.map((user: UserInfo) => ({
					value: String(user.id),
					label: `${user.name} (${user.username})`
				}));
				setUserOptions(options);
			} catch (error) {
				console.error('Error searching users:', error);
				setUserOptions([]);
			} finally {
				setIsSearching(false);
			}
		};

		const timeoutId = setTimeout(fetchUsers, 300);
		return () => clearTimeout(timeoutId);
	}, [searchQuery]);

	const handleSubmit = async () => {
		const stakeholderIds = selectedStakeholders.map(id => parseInt(id));
		await onSubmit(stakeholderIds);
	};

	const handleCancel = () => {
		onClose();
	};

	return (
		<Modal
			opened={opened}
			onClose={handleCancel}
			title={title || 'Add Stakeholders'}
			centered
			size="md"
			closeOnClickOutside={false}
			withCloseButton={false}
		>
			<Stack gap="lg">
				<Text size="sm" c="dimmed">
					{description ||
						'This is a personal project. Select users who should be added as stakeholders to this publication.'}
				</Text>
				<Alert icon={<IconInfoCircle />} color="orange" title="Important">
					This is your only chance to add stakeholders. Once the publication is created, you cannot add
					stakeholders later.
				</Alert>

				<MultiSelect
					label="Select stakeholders"
					placeholder="Start typing to search users (min 3 characters)"
					data={userOptions}
					value={selectedStakeholders}
					onChange={setSelectedStakeholders}
					searchValue={searchQuery}
					onSearchChange={setSearchQuery}
					searchable
					maxDropdownHeight={250}
					nothingFoundMessage="No users found"
					clearable
					rightSection={isSearching ? <span>Loading...</span> : undefined}
					styles={{
						dropdown: { zIndex: 10000 },
						options: { zIndex: 10000 }
					}}
				/>

				<Group justify="flex-end" mt="xl">
					<Button variant="default" onClick={handleCancel}>
						Cancel
					</Button>
					<Button onClick={handleSubmit}>
						Add{selectedStakeholders.length > 0 ? ` (+${selectedStakeholders.length})` : ''}
					</Button>
				</Group>
			</Stack>
		</Modal>
	);
};
