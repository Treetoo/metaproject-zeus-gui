import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Box, Button, Flex, ThemeIcon, Title } from '@mantine/core';
import { IconLock } from '@tabler/icons-react';
import { useAuth } from 'react-oidc-context';

import Loading from '@/components/global/loading';

const Index: React.FC = () => {
	const { signinRedirect, isAuthenticated, isLoading } = useAuth();
	const { t } = useTranslation();
	const navigate = useNavigate();

	useEffect(() => {
		if (isAuthenticated) {
			navigate('/project', { replace: true });
		}
	}, [isAuthenticated]);

	if (isLoading) {
		return <Loading />;
	}

	return (
		<Flex mt={200} direction="column" align="center">
			<ThemeIcon color="grape" radius="lg" size="lg">
				<IconLock />
			</ThemeIcon>
			<Title order={2}>{t('routes.index.title')}</Title>
			<Box>
				<Button variant="outline" mt={20} w={300} onClick={() => signinRedirect()}>
					{t('routes.index.buttons.MUNI')}
				</Button>
			</Box>
		</Flex>
	);
};

export default Index;
