import { useState } from 'react';
import {
	Avatar,
	Group,
	Menu,
	MenuDropdown,
	MenuItem,
	MenuTarget,
	rem,
	Text,
	UnstyledButton,
	Modal,
	Badge,
	SegmentedControl,
	Box,
	Loader
} from '@mantine/core';
import { IconChevronDown, IconLogout, IconUser, IconEye, IconShield } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { notifications } from '@mantine/notifications';
// ============================================================
// MOCK AUTH MODE - useAuth commented out for mock mode
// ============================================================
// import { useAuth } from 'react-oidc-context';
// ============================================================
// END MOCK AUTH MODE IMPORTS
// ============================================================

import { IS_USER_STEP_UP, MAX_ROLE } from '@/modules/auth/constants';
import { useMockAuth } from '@/modules/auth/mock-auth-context';
import { UserPreviewPanel } from '@/components/global/mock-auth';
import { Role } from '@/modules/user/role';
import { useAdminContext } from '@/modules/auth/admin-context';
import { ROLE_UPDATED_EVENT } from '@/modules/auth/methods/onSigninCallback';
import { updateUserRole } from '@/modules/auth/api/mock-auth-api';

import classes from './user-menu.module.css';

type UserMenuProps = {
	isOpened: boolean;
	fullWidth?: boolean;
};

const UserMenu = ({ fullWidth = false, isOpened }: UserMenuProps) => {
	const navigate = useNavigate();
	// ============================================================
	// MOCK AUTH MODE - Using mock auth instead of OIDC
	// ============================================================
	// const { user, removeUser, revokeTokens } = useAuth();
	const { user, logout: mockLogout, isMockMode, updateUser } = useMockAuth();
	// ============================================================
	// END MOCK AUTH MODE
	// ============================================================
	const { currentRole, setCurrentRole } = useAdminContext();
	const [userMenuOpened, setUserMenuOpened] = useState(isOpened);
	const [previewModalOpened, setPreviewModalOpened] = useState(false);
	const [isRoleSwitching, setIsRoleSwitching] = useState(false);

	const handleRoleSwitch = async (newRole: string) => {
		const role = newRole as Role;

		if (!user?.id) {
			return;
		}

		setIsRoleSwitching(true);

		try {
			// Update role in database
			const updatedUser = await updateUserRole(user.id, role as 'admin' | 'director' | 'user');

			// Update localStorage so other parts of the app can read it
			localStorage.setItem(MAX_ROLE, role);
			// Also set step-up if switching to admin/director
			if (role === Role.ADMIN || role === Role.DIRECTOR) {
				localStorage.setItem(IS_USER_STEP_UP, 'true');
			} else {
				localStorage.removeItem(IS_USER_STEP_UP);
			}
			// Update context
			setCurrentRole(role);
			// Update mock auth context with new user data
			updateUser(updatedUser);
			// Dispatch event for any listeners
			window.dispatchEvent(new CustomEvent(ROLE_UPDATED_EVENT));

			notifications.show({
				title: 'Role Updated',
				message: `Your role has been changed to ${role} in the database`,
				color: role === Role.ADMIN ? 'red' : role === Role.DIRECTOR ? 'yellow' : 'blue'
			});
		} catch (error) {
			notifications.show({
				title: 'Error',
				message: 'Failed to update role in database',
				color: 'red'
			});
		} finally {
			setIsRoleSwitching(false);
		}
	};

	const logout = async () => {
		localStorage.removeItem(MAX_ROLE);
		localStorage.removeItem(IS_USER_STEP_UP);
		// ============================================================
		// MOCK AUTH MODE - Using mock logout instead of OIDC
		// ============================================================
		// await removeUser();
		// await revokeTokens();
		mockLogout();
		// ============================================================
		// END MOCK AUTH MODE
		// ============================================================
		navigate('/');
	};

	if (!user) {
		return null;
	}

	return (
		<>
			<Menu
				width={fullWidth ? '96%' : 260}
				position="bottom-end"
				transitionProps={{ transition: 'pop-top-right' }}
				onClose={() => setUserMenuOpened(false)}
				onOpen={() => setUserMenuOpened(true)}
				withinPortal={false}
				menuItemTabIndex={0}
				trigger="click-hover"
			>
				<MenuTarget>
					<UnstyledButton className={classes.user} data-opened={userMenuOpened}>
						<Group gap={7}>
							<Avatar color="initials" variant="filled" size="sm" name={user.name} />
							<Text fw={500} size="sm" lh={1} mr={3} flex={1}>
								{user.name}
							</Text>
							{isMockMode && (
								<Badge color="orange" size="xs" variant="light">
									MOCK
								</Badge>
							)}
							<IconChevronDown style={{ width: rem(12), height: rem(12) }} stroke={1.5} />
						</Group>
					</UnstyledButton>
				</MenuTarget>
				<MenuDropdown>
					{isMockMode && (
						<>
							<Menu.Label>Mock User Info</Menu.Label>
							<MenuItem
								leftSection={<IconUser style={{ width: rem(16), height: rem(16) }} stroke={1.5} />}
								disabled
							>
								ID: {user.id} | DB Role: {user.role || 'user'}
							</MenuItem>
							<Menu.Divider />
							<Menu.Label>
								<Group gap={4}>
									<IconShield style={{ width: rem(14), height: rem(14) }} />
									Switch Role (DB + UI)
									{isRoleSwitching && <Loader size={12} />}
								</Group>
							</Menu.Label>
							<Box px="xs" pb="xs">
								<SegmentedControl
									fullWidth
									size="xs"
									value={currentRole}
									onChange={handleRoleSwitch}
									disabled={isRoleSwitching}
									data={[
										{ label: 'User', value: Role.USER },
										{ label: 'Director', value: Role.DIRECTOR },
										{ label: 'Admin', value: Role.ADMIN }
									]}
									color={
										currentRole === Role.ADMIN
											? 'red'
											: currentRole === Role.DIRECTOR
												? 'yellow'
												: 'blue'
									}
								/>
							</Box>
							<Menu.Divider />
							<MenuItem
								onClick={() => setPreviewModalOpened(true)}
								leftSection={<IconEye style={{ width: rem(16), height: rem(16) }} stroke={1.5} />}
							>
								User Preview Tool
							</MenuItem>
							<Menu.Divider />
						</>
					)}
					<Menu.Label>Profile settings</Menu.Label>
					<MenuItem
						onClick={() => logout()}
						leftSection={<IconLogout style={{ width: rem(16), height: rem(16) }} stroke={1.5} />}
					>
						Logout
					</MenuItem>
				</MenuDropdown>
			</Menu>

			{/* User Preview Modal */}
			<Modal
				opened={previewModalOpened}
				onClose={() => setPreviewModalOpened(false)}
				title="User Preview Tool"
				size="lg"
			>
				<UserPreviewPanel />
			</Modal>
		</>
	);
};

export default UserMenu;
