import { useState } from 'react';
import {
	Box,
	Button,
	Group,
	NumberInput,
	Paper,
	Stack,
	Text,
	Title,
	Alert,
	Badge,
	Loader,
	Table,
	Divider,
	Card
} from '@mantine/core';
import { IconAlertCircle, IconSearch, IconUser, IconFolder } from '@tabler/icons-react';

import { getUserPreview, type MockUserPreview } from '@/modules/auth/api/mock-auth-api';

const UserPreviewPanel = () => {
	const [userId, setUserId] = useState<number | string>('');
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [preview, setPreview] = useState<MockUserPreview | null>(null);

	const handleSearch = async () => {
		const id = typeof userId === 'string' ? parseInt(userId, 10) : userId;
		if (!id || isNaN(id)) {
			setError('Please enter a valid user ID');
			return;
		}

		setIsLoading(true);
		setError(null);
		setPreview(null);

		try {
			const result = await getUserPreview(id);
			setPreview(result);
		} catch (err) {
			setError(`User with ID ${id} not found`);
		} finally {
			setIsLoading(false);
		}
	};

	const getRoleBadgeColor = (role: string) => {
		switch (role) {
			case 'admin':
				return 'red';
			case 'director':
				return 'orange';
			case 'pi':
				return 'blue';
			case 'manager':
				return 'green';
			default:
				return 'gray';
		}
	};

	const getStatusBadgeColor = (status: string) => {
		switch (status) {
			case 'active':
				return 'green';
			case 'new':
				return 'blue';
			case 'archived':
				return 'gray';
			case 'rejected':
				return 'red';
			default:
				return 'gray';
		}
	};

	return (
		<Paper p="md" withBorder>
			<Stack gap="md">
				<Group justify="space-between">
					<Title order={4}>User Preview</Title>
					<Badge color="cyan" variant="light">
						LOOKUP
					</Badge>
				</Group>

				<Group align="flex-end">
					<NumberInput
						label="User ID"
						placeholder="Enter user ID to preview"
						min={1}
						style={{ flex: 1 }}
						value={userId}
						onChange={setUserId}
					/>
					<Button
						leftSection={isLoading ? <Loader size={14} /> : <IconSearch size={14} />}
						onClick={handleSearch}
						disabled={isLoading}
					>
						Preview
					</Button>
				</Group>

				{error && (
					<Alert icon={<IconAlertCircle size={16} />} title="Error" color="red" variant="light">
						{error}
					</Alert>
				)}

				{preview && (
					<Stack gap="md">
						<Divider label="User Data" labelPosition="center" />

						<Card withBorder padding="sm">
							<Group gap="xs" mb="xs">
								<IconUser size={16} />
								<Text fw={600}>User Information</Text>
							</Group>
							<Table>
								<Table.Tbody>
									<Table.Tr>
										<Table.Td fw={500}>ID</Table.Td>
										<Table.Td>{preview.user.id}</Table.Td>
									</Table.Tr>
									<Table.Tr>
										<Table.Td fw={500}>Name</Table.Td>
										<Table.Td>{preview.user.name}</Table.Td>
									</Table.Tr>
									<Table.Tr>
										<Table.Td fw={500}>Email</Table.Td>
										<Table.Td>{preview.user.email}</Table.Td>
									</Table.Tr>
									<Table.Tr>
										<Table.Td fw={500}>Username</Table.Td>
										<Table.Td>{preview.user.username}</Table.Td>
									</Table.Tr>
									<Table.Tr>
										<Table.Td fw={500}>External ID</Table.Td>
										<Table.Td>{preview.user.externalId}</Table.Td>
									</Table.Tr>
									<Table.Tr>
										<Table.Td fw={500}>Role</Table.Td>
										<Table.Td>
											<Badge color={getRoleBadgeColor(preview.user.role || 'user')} variant="light">
												{preview.user.role || 'user'}
											</Badge>
										</Table.Td>
									</Table.Tr>
								</Table.Tbody>
							</Table>
						</Card>

						<Divider label={`Projects (${preview.projects.length})`} labelPosition="center" />

						{preview.projects.length === 0 ? (
							<Text c="dimmed" ta="center">
								No projects found for this user
							</Text>
						) : (
							<Card withBorder padding="sm">
								<Group gap="xs" mb="xs">
									<IconFolder size={16} />
									<Text fw={600}>Projects</Text>
								</Group>
								<Table striped highlightOnHover>
									<Table.Thead>
										<Table.Tr>
											<Table.Th>ID</Table.Th>
											<Table.Th>Title</Table.Th>
											<Table.Th>Status</Table.Th>
											<Table.Th>Role</Table.Th>
											<Table.Th>Personal</Table.Th>
										</Table.Tr>
									</Table.Thead>
									<Table.Tbody>
										{preview.projects.map(project => (
											<Table.Tr key={project.id}>
												<Table.Td>{project.id}</Table.Td>
												<Table.Td>{project.title}</Table.Td>
												<Table.Td>
													<Badge
														color={getStatusBadgeColor(project.status)}
														variant="light"
														size="sm"
													>
														{project.status}
													</Badge>
												</Table.Td>
												<Table.Td>
													<Group gap={4}>
														<Badge
															color={getRoleBadgeColor(project.role)}
															variant="light"
															size="sm"
														>
															{project.role}
														</Badge>
														{project.memberRole && (
															<Badge
																color={getRoleBadgeColor(project.memberRole)}
																variant="outline"
																size="sm"
															>
																+{project.memberRole}
															</Badge>
														)}
													</Group>
												</Table.Td>
												<Table.Td>
													{project.isPersonal ? (
														<Badge color="violet" variant="light" size="sm">
															Yes
														</Badge>
													) : (
														<Text c="dimmed" size="sm">
															No
														</Text>
													)}
												</Table.Td>
											</Table.Tr>
										))}
									</Table.Tbody>
								</Table>
							</Card>
						)}
					</Stack>
				)}
			</Stack>
		</Paper>
	);
};

export default UserPreviewPanel;
