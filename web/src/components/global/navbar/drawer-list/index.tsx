import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Box, Drawer, getBreakpointValue, NavLink, rem, ScrollArea, useMantineTheme } from '@mantine/core';
import {
	IconActivity,
	IconArchive,
	IconBan,
	IconClockQuestion,
	IconCpu,
	IconDeviceDesktopAnalytics,
	IconDevices2,
	IconLibrary,
	IconPodium,
	IconQuestionMark,
	IconReport,
	IconUserUp,
	IconArticle,
} from '@tabler/icons-react';
import React, { useEffect } from 'react';

import { useAdminContext } from '@/modules/auth/admin-context';
import { Role } from '@/modules/user/role';
import useWindowSize from '@/hooks/useWindowSize';

import classes from '../navbar.module.css';

type DrawerListProps = {
	open: boolean;
	onClose: () => void;
};

type LinkNode = {
	title: string;
	href: string;
	icon: React.ReactNode;
	links?: LinkNode[];
};

const DrawerList = ({ open, onClose }: DrawerListProps) => {
	const windowSize = useWindowSize();
	const theme = useMantineTheme();
	const location = useLocation();
	const { pathname } = location;
	const { t } = useTranslation();
	const { currentRole } = useAdminContext();

	useEffect(() => {
		if (windowSize < getBreakpointValue(theme.breakpoints.md, theme.breakpoints)) {
			onClose();
		}
	}, [location]);

	const getLinkTree = (link: LinkNode) => {
		const { title, href, icon, links } = link;
		return (
			<NavLink
				className={classes.link}
				key={title}
				to={href}
				component={Link}
				label={t(title)}
				active={pathname.includes(href)}
				variant="filled"
				leftSection={icon}
			>
				{links?.map(link => getLinkTree(link))}
			</NavLink>
		);
	};

	const baseLinks: LinkNode[] = [
		{
			title: 'components.global.drawerList.links.projects.title',
			href: '/project',
			icon: <IconReport />,
			links: [
				{
					title: 'components.global.drawerList.links.projects.active',
					href: '/project?status=active',
					icon: <IconActivity />
				},
				{
					title: 'components.global.drawerList.links.projects.requested',
					href: '/project?status=requested',
					icon: <IconClockQuestion />
				},
				{
					title: 'components.global.drawerList.links.projects.archived',
					href: '/project?status=archived',
					icon: <IconArchive />
				},
				{
					title: 'components.global.drawerList.links.projects.rejected',
					href: '/project?status=rejected',
					icon: <IconBan />
				}
			]
		}
	];

	const publicationsLink: LinkNode = {
		title: 'components.global.drawerList.links.publications.title',
		href: '/publications',
		icon: <IconLibrary />
	};

	const adminLinks: LinkNode = {
		title: 'components.global.drawerList.links.admin.title',
		href: '/admin',
		icon: <IconUserUp />,
		links: [
			{
				title: 'components.global.drawerList.links.admin.link.allocations',
				href: '/admin/allocations',
				icon: <IconCpu />
			},
			{
				title: 'components.global.drawerList.links.admin.link.projects',
				href: '/admin/projects',
				icon: <IconReport />
			},
			{
				title: 'components.global.drawerList.links.admin.link.resources',
				href: '/admin/resources',
				icon: <IconDevices2 />
			},
			{
				title: 'components.global.drawerList.links.admin.link.requests',
				href: '/admin/requests',
				icon: <IconQuestionMark />
			},
			{
				title: 'components.global.drawerList.links.admin.link.allocation_requests',
				href: '/admin/allocation-requests',
				icon: <IconDeviceDesktopAnalytics />
			},
			{
				title: 'components.global.drawerList.links.admin.link.publication_requests',
				href: '/admin/publication-requests',
				icon: <IconArticle/>
			},
			{
				title: 'components.global.drawerList.links.admin.link.stages',
				href: '/admin/stages',
				icon: <IconPodium />
			}
		]
	};

	const directorLinks: LinkNode = {
		title: 'components.global.drawerList.links.director.title',
		href: '/admin',
		icon: <IconUserUp />,
		links: [
			{
				title: 'components.global.drawerList.links.director.link.allocations',
				href: '/director/allocations',
				icon: <IconCpu />
			},
			{
				title: 'components.global.drawerList.links.director.link.projects',
				href: '/director/projects',
				icon: <IconReport />
			},
			{
				title: 'components.global.drawerList.links.director.link.resources',
				href: '/director/resources',
				icon: <IconDevices2 />
			},
			{
				title: 'components.global.drawerList.links.director.link.requests',
				href: '/director/requests',
				icon: <IconQuestionMark />
			},
			{
				title: 'components.global.drawerList.links.admin.link.publication_requests',
				href: '/director/publication-requests',
				icon: <IconArticle/>
			},
			{
				title: 'components.global.drawerList.links.director.link.allocation_requests',
				href: '/director/allocation-requests',
				icon: <IconDeviceDesktopAnalytics />
			}
		]
	};

	const links: LinkNode[] = [...baseLinks, publicationsLink];

	if (currentRole === Role.ADMIN) {
		links.push(adminLinks);
	}

	if (currentRole === Role.DIRECTOR) {
		links.push(directorLinks);
	}

	if (windowSize > getBreakpointValue(theme.breakpoints.md, theme.breakpoints)) {
		return (
			<Box className={classes.sidebar} data-opened={open}>
				<ScrollArea h={`calc(100vh - ${rem(80)})`} mx="-md">
					<Box px="md">{links.map(link => getLinkTree(link))}</Box>
				</ScrollArea>
			</Box>
		);
	}

	return (
		<Drawer opened={open} onClose={onClose} withCloseButton={false} padding={0}>
			<Box mt={64}>{links.map(link => getLinkTree(link))}</Box>
		</Drawer>
	);
};

export default DrawerList;
