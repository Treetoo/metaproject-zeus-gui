import { Anchor, List, Stack, Title } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import React from 'react';
import { Link } from 'react-router-dom';

import { getCurrentRole } from '@/modules/auth/methods/getCurrentRole';
import { Role } from '@/modules/user/role';

const getLinks = (role: Role) => {
	const prefix = role === Role.ADMIN ? '/admin' : '/director';
	const links = [
		{
			title: `components.global.drawerList.links.${role}.link.allocations`,
			href: `${prefix}/allocations`
		},
		{
			title: `components.global.drawerList.links.${role}.link.projects`,
			href: `${prefix}/projects`
		},
		{
			title: `components.global.drawerList.links.${role}.link.resources`,
			href: `${prefix}/resources`
		},
		{
			title: `components.global.drawerList.links.${role}.link.requests`,
			href: `${prefix}/requests`
		},
		{
			title: `components.global.drawerList.links.${role}.link.allocation_requests`,
			href: `${prefix}/allocation-requests`
		},
		{
			title: `components.global.drawerList.links.${role}.link.publication_requests`,
			href: `${prefix}/publication-requests`
		}
	];

	if (role === Role.ADMIN) {
		links.push({
			title: 'components.global.drawerList.links.admin.link.stages',
			href: '/admin/stages'
		});
	}

	return links;
};

const AdminLinkPage = () => {
	const { t } = useTranslation();
	const role = getCurrentRole();

	return (
		<Stack>
			<Title>Navigation</Title>
			<List>
				{getLinks(role).map(link => (
					<List.Item key={link.href}>
						<Anchor component={Link} to={link.href}>
							{t(link.title)}
						</Anchor>
					</List.Item>
				))}
			</List>
		</Stack>
	);
};

export default AdminLinkPage;
