import { useTranslation } from 'react-i18next';
import { type PropsWithChildren, useEffect, useState } from 'react';
import { Anchor, Box, Burger, Flex, getBreakpointValue, Group, Image, Tooltip, useMantineTheme } from '@mantine/core';
import { Link } from 'react-router-dom';
import { useAuth } from 'react-oidc-context';

import useWindowSize from '@/hooks/useWindowSize';
import { getStepUpAccess } from '@/modules/auth/methods/getStepUpAccess';
import StepUpToggle from '@/components/global/step-up-toggle';
import DrawerList from '@/components/global/navbar/drawer-list';

import classes from './navbar.module.css';
import UserMenu from './user-menu';

const DEFAULT_OPENED = 'defaultMenuOpened';
const OPEN_WINDOW_SIZE = 1200;

const shouldOpenByDefault = (windowSize: number) =>
	windowSize > OPEN_WINDOW_SIZE &&
	(localStorage.getItem(DEFAULT_OPENED) === null || localStorage.getItem(DEFAULT_OPENED) === 'true');

const Navbar = ({ children }: PropsWithChildren) => {
	const theme = useMantineTheme();
	const { t } = useTranslation();
	const { isAuthenticated } = useAuth();
	const windowSize = useWindowSize();
	const stepUpAccess = getStepUpAccess();
	const [drawerOpened, setDrawerOpened] = useState<boolean>(shouldOpenByDefault(windowSize));

	const toggleDrawer = (opened: boolean) => {
		localStorage.setItem(DEFAULT_OPENED, opened ? 'true' : 'false');
		setDrawerOpened(opened);
	};

	useEffect(() => {
		setDrawerOpened(shouldOpenByDefault(windowSize));
	}, [windowSize]);

	return (
		<>
			<Flex justify="space-between" align="center" className={classes.wrapper}>
				<Box component="header" color="white">
					<Group h="100%" pl={10}>
						{isAuthenticated && (
							<Group>
								<Tooltip label="Menu" zIndex={600}>
									<Burger size="sm" color="white" onClick={() => toggleDrawer(!drawerOpened)} />
								</Tooltip>
							</Group>
						)}
						<Group>
							<Image
								src="/images/zeus.png"
								w={30}
								style={{
									filter: 'invert(100%)'
								}}
							/>
							<Anchor component={Link} to="/" c="white" underline="never" visibleFrom="sm">
								{t('components.global.navbar.header')}
							</Anchor>
						</Group>
					</Group>
				</Box>
				{isAuthenticated && (
					<Group mr={10} gap={1}>
						<StepUpToggle stepUpAccess={stepUpAccess} />
						<UserMenu isOpened={drawerOpened} />
					</Group>
				)}
			</Flex>
			<Flex justify="center">
				{isAuthenticated && <DrawerList open={drawerOpened} onClose={() => toggleDrawer(false)} />}
				<Box
					w={
						drawerOpened && windowSize > getBreakpointValue(theme.breakpoints.md, theme.breakpoints)
							? `calc(100% - 300px)`
							: `100%`
					}
				>
					{children}
				</Box>
			</Flex>
		</>
	);
};

export default Navbar;
