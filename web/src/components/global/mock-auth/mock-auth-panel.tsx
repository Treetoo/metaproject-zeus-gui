import { useState } from 'react';
import {
	Button,
	Group,
	NumberInput,
	Paper,
	Select,
	Stack,
	TextInput,
	Title,
	Alert,
	Divider,
	Badge,
	Loader
} from '@mantine/core';
import { IconAlertCircle, IconCheck, IconLogin, IconUserPlus, IconSearch } from '@tabler/icons-react';
import { useForm, Controller } from 'react-hook-form';

import { useMockAuth } from '@/modules/auth/mock-auth-context';
import { mockSignIn, checkUserExists, getUserById, type MockSignInData } from '@/modules/auth/api/mock-auth-api';
import { MAX_ROLE } from '@/modules/auth/constants';

type MockAuthPanelProps = {
	onClose?: () => void;
};

type FormData = MockSignInData & { id?: number };

const MockAuthPanel = ({ onClose }: MockAuthPanelProps) => {
	const { login } = useMockAuth();
	const [checkResult, setCheckResult] = useState<{ exists: boolean; id: number } | null>(null);
	const [isChecking, setIsChecking] = useState(false);
	const [isLoggingIn, setIsLoggingIn] = useState(false);
	const [isCreating, setIsCreating] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const {
		control,
		register,
		handleSubmit,
		watch,
		formState: { errors }
	} = useForm<FormData>({
		defaultValues: {
			id: undefined,
			externalId: 'mock-' + Date.now(),
			username: 'testuser',
			email: 'test@example.com',
			name: 'Test User',
			role: 'user',
			locale: 'en'
		}
	});

	const watchedId = watch('id');

	const handleCheckUser = async () => {
		if (!watchedId) {
			setError('Please enter a user ID to check');
			return;
		}

		setIsChecking(true);
		setError(null);
		setCheckResult(null);

		try {
			const result = await checkUserExists(watchedId);
			setCheckResult(result);
		} catch (err) {
			setError('Failed to check user existence');
		} finally {
			setIsChecking(false);
		}
	};

	const handleLogin = async () => {
		if (!watchedId) {
			setError('Please enter a user ID to login');
			return;
		}

		// Check if user exists first
		setIsLoggingIn(true);
		setError(null);

		try {
			const existsResult = await checkUserExists(watchedId);
			if (!existsResult.exists) {
				setError(`User with ID ${watchedId} does not exist. Please create the user first.`);
				setCheckResult(existsResult);
				return;
			}

			// User exists, get their data and login
			const userData = await getUserById(watchedId);
			login(watchedId, userData);

			// Store role for admin context
			if (userData.role) {
				localStorage.setItem(MAX_ROLE, userData.role);
			}

			onClose?.();
		} catch (err) {
			setError('Failed to login');
		} finally {
			setIsLoggingIn(false);
		}
	};

	const onCreateUser = async (data: FormData) => {
		setIsCreating(true);
		setError(null);

		try {
			const { id, ...signInData } = data;
			const userData = await mockSignIn(signInData as MockSignInData);

			// Login with the newly created user
			login(userData.id, userData);

			// Store role for admin context
			if (userData.role) {
				localStorage.setItem(MAX_ROLE, userData.role);
			}

			onClose?.();
		} catch (err) {
			setError('Failed to create user');
		} finally {
			setIsCreating(false);
		}
	};

	return (
		<Paper p="md" withBorder>
			<Stack gap="md">
				<Group justify="space-between">
					<Title order={4}>Mock Authentication</Title>
					<Badge color="orange" variant="light">
						DEV MODE
					</Badge>
				</Group>

				{error && (
					<Alert icon={<IconAlertCircle size={16} />} title="Error" color="red" variant="light">
						{error}
					</Alert>
				)}

				<Divider label="Login as Existing User" labelPosition="center" />

				<Group align="flex-end">
					<Controller
						name="id"
						control={control}
						render={({ field }) => (
							<NumberInput
								label="User ID"
								placeholder="Enter user ID"
								min={1}
								style={{ flex: 1 }}
								value={field.value}
								onChange={field.onChange}
							/>
						)}
					/>
					<Button
						variant="outline"
						leftSection={isChecking ? <Loader size={14} /> : <IconSearch size={14} />}
						onClick={handleCheckUser}
						disabled={isChecking}
					>
						Check
					</Button>
					<Button
						leftSection={isLoggingIn ? <Loader size={14} /> : <IconLogin size={14} />}
						onClick={handleLogin}
						disabled={isLoggingIn}
					>
						Login
					</Button>
				</Group>

				{checkResult && (
					<Alert
						icon={checkResult.exists ? <IconAlertCircle size={16} /> : <IconCheck size={16} />}
						title={checkResult.exists ? 'User Exists' : 'User Not Found'}
						color={checkResult.exists ? 'red' : 'green'}
						variant="light"
					>
						{checkResult.exists
							? `User with ID ${checkResult.id} already exists in the database.`
							: `User with ID ${checkResult.id} does not exist. You can create a new user below.`}
					</Alert>
				)}

				<Divider label="Create New User" labelPosition="center" />

				<form onSubmit={handleSubmit(onCreateUser)}>
					<Stack gap="md">
						<TextInput
							label="External ID"
							placeholder="mock-123"
							required
							error={errors.externalId?.message}
							{...register('externalId', { required: 'External ID is required' })}
						/>

						<TextInput
							label="Username"
							placeholder="testuser"
							required
							error={errors.username?.message}
							{...register('username', { required: 'Username is required' })}
						/>

						<TextInput
							label="Email"
							placeholder="test@example.com"
							required
							error={errors.email?.message}
							{...register('email', {
								required: 'Email is required',
								pattern: {
									value: /^\S+@\S+$/,
									message: 'Invalid email'
								}
							})}
						/>

						<TextInput
							label="Name"
							placeholder="Test User"
							required
							error={errors.name?.message}
							{...register('name', { required: 'Name is required' })}
						/>

						<Controller
							name="role"
							control={control}
							rules={{ required: 'Role is required' }}
							render={({ field }) => (
								<Select
									label="Role"
									placeholder="Select role"
									required
									data={[
										{ value: 'user', label: 'User' },
										{ value: 'director', label: 'Director' },
										{ value: 'admin', label: 'Admin' }
									]}
									value={field.value}
									onChange={field.onChange}
									error={errors.role?.message}
								/>
							)}
						/>

						<TextInput label="Locale" placeholder="en" {...register('locale')} />

						<Button
							fullWidth
							type="submit"
							leftSection={isCreating ? <Loader size={14} /> : <IconUserPlus size={14} />}
							disabled={isCreating}
							color="green"
						>
							Create User & Login
						</Button>
					</Stack>
				</form>
			</Stack>
		</Paper>
	);
};

export default MockAuthPanel;
