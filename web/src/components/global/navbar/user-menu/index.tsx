import { useState } from 'react';
import { Avatar, Group, Menu, MenuDropdown, MenuItem, MenuTarget, rem, Text, UnstyledButton } from '@mantine/core';
import { IconChevronDown, IconLogout } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from 'react-oidc-context';

import { IS_USER_STEP_UP, MAX_ROLE } from '@/modules/auth/constants';

import classes from './user-menu.module.css';

type UserMenuProps = {
	isOpened: boolean;
	fullWidth?: boolean;
};

const UserMenu = ({ fullWidth = false, isOpened }: UserMenuProps) => {
	const navigate = useNavigate();
	const { user, removeUser, revokeTokens } = useAuth();
	const [userMenuOpened, setUserMenuOpened] = useState(isOpened);

	const logout = async () => {
		localStorage.removeItem(MAX_ROLE);
		localStorage.removeItem(IS_USER_STEP_UP);
		await removeUser();
		await revokeTokens();
		navigate('/');
	};

	if (!user) {
		return null;
	}

	return (
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
						<Avatar
							color="initials"
							variant="filled"
							size="sm"
							name={`${user.profile.given_name} ${user.profile.family_name}`}
						/>
						<Text fw={500} size="sm" lh={1} mr={3} flex={1}>
							{user.profile.name}
						</Text>
						<IconChevronDown style={{ width: rem(12), height: rem(12) }} stroke={1.5} />
					</Group>
				</UnstyledButton>
			</MenuTarget>
			<MenuDropdown>
				<Menu.Label>Profile settings</Menu.Label>
				<MenuItem
					onClick={() => logout()}
					leftSection={<IconLogout style={{ width: rem(16), height: rem(16) }} stroke={1.5} />}
				>
					Logout
				</MenuItem>
			</MenuDropdown>
		</Menu>
	);
};

export default UserMenu;
