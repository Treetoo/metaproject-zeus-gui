import { useState, useEffect } from 'react';
import { Modal, Button, Group, Select, Stack, Text, Alert, Checkbox, ActionIcon, Table } from '@mantine/core';
import { IconInfoCircle, IconX } from '@tabler/icons-react';

import { searchUsers, getCurrentUser } from '@/modules/user/api/search-users';
import type { UserInfo } from '@/modules/user/model';

type SelectedUser = {
	id: number;
	name: string;
	username: string;
	fairShareEligible: boolean;
};

export type SelectedStakeholder = {
	userId: number;
	fairShareEligible: boolean;
};

type StakeholderSelectionModalProps = {
	opened: boolean;
	onClose: () => void;
	onSubmit: (data: SelectedStakeholder[]) => Promise<void>;
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
	const [selectedUsers, setSelectedUsers] = useState<SelectedUser[]>([]);
	const [currentUser, setCurrentUser] = useState<UserInfo | null>(null);
	const [userOptions, setUserOptions] = useState<{ value: string; label: string; id: number }[]>([]);
	const [isSearching, setIsSearching] = useState(false);
	const [searchQuery, setSearchQuery] = useState('');

	// Fetch current user and pre-select them when modal opens
	useEffect(() => {
		if (opened) {
			const fetchCurrentUser = async () => {
				try {
					const user = await getCurrentUser();
					setCurrentUser(user);
					setSelectedUsers([
						{
							id: user.id,
							name: user.name,
							username: user.username,
							fairShareEligible: true
						}
					]);
				} catch (error) {
					console.error('Error fetching current user:', error);
				}
			};
			fetchCurrentUser();
		} else {
			setCurrentUser(null);
			setSelectedUsers([]);
		}
	}, [opened]);

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
				const options = users
					.filter((user: UserInfo) => !selectedUsers.some((u) => u.id === user.id))
					.map((user: UserInfo) => ({
						value: String(user.id),
						label: `${user.name} (${user.username})`,
						id: user.id
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
	}, [searchQuery, selectedUsers]);

	const handleUserSelect = (value: string) => {
		if (!value) return;
		const selectedOption = userOptions.find((opt) => opt.value === value);
		if (selectedOption && !selectedUsers.some((u) => u.id === selectedOption.id)) {
			setSelectedUsers([
				...selectedUsers,
				{
					id: selectedOption.id,
					name: selectedOption.label.split(' (')[0],
					username: selectedOption.label.split(' (')[1]?.replace(')', '') || '',
					fairShareEligible: true
				}
			]);
		}
		setSearchQuery('');
		setUserOptions([]);
	};

	const handleRemoveUser = (userId: number) => {
		setSelectedUsers(selectedUsers.filter((u) => u.id !== userId));
	};

	const handleFairShareChange = (userId: number, checked: boolean) => {
		setSelectedUsers(selectedUsers.map((u) => (u.id === userId ? { ...u, fairShareEligible: checked } : u)));
	};

	const handleSubmit = async () => {
		const data = selectedUsers.map((u) => ({
			userId: u.id,
			fairShareEligible: u.fairShareEligible
		}));
		await onSubmit(data);
	};

	const handleCancel = () => {
		setSelectedUsers([]);
		setCurrentUser(null);
		setSearchQuery('');
		onClose();
	};

	return (
		<Modal
			opened={opened}
			onClose={handleCancel}
			title={title || 'Add Stakeholders'}
			centered
			size="lg"
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
					stakeholders later. Being in the table means you are an author of this publication.
				</Alert>

				<Text size="sm" fw={500}>
					Selected Stakeholders ({selectedUsers.length})
				</Text>
				<Table striped highlightOnHover withTableBorder>
					<Table.Thead>
						<Table.Tr>
							<Table.Th style={{ width: '40%' }}>Name</Table.Th>
							<Table.Th style={{ width: '30%' }}>Fair Share Eligible</Table.Th>
							<Table.Th style={{ width: '15%' }}>Actions</Table.Th>
						</Table.Tr>
					</Table.Thead>
					<Table.Tbody>
						{selectedUsers.map((user) => (
							<Table.Tr key={user.id}>
								<Table.Td>
									<div>
										<Text size="sm" fw={500}>
											{user.name}
										</Text>
										<Text size="xs" c="dimmed">
											@{user.username}
										</Text>
									</div>
								</Table.Td>
								<Table.Td>
									<Checkbox
										checked={user.fairShareEligible}
										onChange={(event) => handleFairShareChange(user.id, event.currentTarget.checked)}
										size="md"
									/>
								</Table.Td>
								<Table.Td>
									<ActionIcon
										color="red"
										variant="subtle"
										onClick={() => handleRemoveUser(user.id)}
										title="Remove from stakeholders"
									>
										<IconX size={18} />
									</ActionIcon>
								</Table.Td>
							</Table.Tr>
						))}
					</Table.Tbody>
				</Table>

				<Select
					label="Search and add users"
					placeholder="Start typing to search users (min 3 characters)"
					data={userOptions}
					onChange={handleUserSelect}
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
					<Button onClick={handleSubmit} disabled={selectedUsers.length === 0}>
						Create Publication ({selectedUsers.length})
					</Button>
				</Group>
			</Stack>
		</Modal>
	);
};
