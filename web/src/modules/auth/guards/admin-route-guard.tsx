import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from 'react-oidc-context';
import React from 'react';
import { Box, Flex } from '@mantine/core';

import Loading from '@/components/global/loading';
import { getStepUpAccess } from '@/modules/auth/methods/getStepUpAccess';
import { StepUpAccess } from '@/modules/auth/model';
import { getCurrentRole } from '@/modules/auth/methods/getCurrentRole';

const AdminRouteGuard = () => {
	const location = useLocation();
	const role = getCurrentRole();
	const { isAuthenticated, isLoading } = useAuth();
	const stepUpAccess = getStepUpAccess();

	if (isLoading) {
		return <Loading />;
	}

	if (!isAuthenticated || stepUpAccess !== StepUpAccess.LOGGED) {
		return <Navigate to="/" replace />;
	}

	if (stepUpAccess === StepUpAccess.LOGGED) {
		const [, prefix, ...rest] = location.pathname.split('/');

		if ((prefix === 'admin' && role === 'director') || (prefix === 'director' && role === 'admin')) {
			return <Navigate to={`/${role}/${rest.join('/')}`} replace />;
		}
	}

	return (
		<Flex mt={15} direction="column" align="center">
			<Box w="80%" mt={20}>
				<Outlet />
			</Box>
		</Flex>
	);
};

export default AdminRouteGuard;
