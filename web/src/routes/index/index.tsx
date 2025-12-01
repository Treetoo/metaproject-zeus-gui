import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Box, Button, Flex, ThemeIcon, Title, Container, Stack, Tabs } from '@mantine/core';
import { IconLock, IconUser, IconEye } from '@tabler/icons-react';
// ============================================================
// MOCK AUTH MODE - useAuth commented out for mock mode
// ============================================================
// import { useAuth } from 'react-oidc-context';
// ============================================================
// END MOCK AUTH MODE IMPORTS
// ============================================================

import Loading from '@/components/global/loading';
import { useMockAuth } from '@/modules/auth/mock-auth-context';
import { MockAuthPanel, UserPreviewPanel } from '@/components/global/mock-auth';
import { isMockAuthEnabled } from '@/modules/auth/mock-auth';

const Index: React.FC = () => {
	// ============================================================
	// MOCK AUTH MODE - Using mock auth instead of OIDC
	// ============================================================
	// const { signinRedirect, isAuthenticated, isLoading } = useAuth();
	const { isAuthenticated, isLoading } = useMockAuth();
	// ============================================================
	// END MOCK AUTH MODE
	// ============================================================
	const { t } = useTranslation();
	const navigate = useNavigate();

	useEffect(() => {
		if (isAuthenticated) {
			navigate('/project', { replace: true });
		}
	}, [isAuthenticated, navigate]);

	if (isLoading) {
		return <Loading />;
	}

	// ============================================================
	// MOCK AUTH MODE - Show mock auth panel instead of OIDC login
	// ============================================================
	if (isMockAuthEnabled()) {
		return (
			<Container size="md" mt={50}>
				<Flex direction="column" align="center" mb="xl">
					<ThemeIcon color="orange" radius="lg" size="lg">
						<IconLock />
					</ThemeIcon>
					<Title order={2} mt="md">
						{t('routes.index.title')}
					</Title>
				</Flex>

				<Tabs defaultValue="login">
					<Tabs.List grow>
						<Tabs.Tab value="login" leftSection={<IconUser size={16} />}>
							Mock Login
						</Tabs.Tab>
						<Tabs.Tab value="preview" leftSection={<IconEye size={16} />}>
							User Preview
						</Tabs.Tab>
					</Tabs.List>

					<Tabs.Panel value="login" pt="md">
						<MockAuthPanel />
					</Tabs.Panel>

					<Tabs.Panel value="preview" pt="md">
						<UserPreviewPanel />
					</Tabs.Panel>
				</Tabs>
			</Container>
		);
	}
	// ============================================================
	// END MOCK AUTH MODE
	// ============================================================

	// ============================================================
	// OIDC AUTH - Original implementation (commented out for mock mode)
	// ============================================================
	return (
		<Flex mt={200} direction="column" align="center">
			<ThemeIcon color="grape" radius="lg" size="lg">
				<IconLock />
			</ThemeIcon>
			<Title order={2}>{t('routes.index.title')}</Title>
			<Box>
				{/* OIDC sign-in button - commented out for mock mode */}
				{/* <Button variant="outline" mt={20} w={300} onClick={() => signinRedirect()}>
					{t('routes.index.buttons.MUNI')}
				</Button> */}
				<Button variant="outline" mt={20} w={300} disabled>
					OIDC Login Disabled (Mock Mode Not Enabled)
				</Button>
			</Box>
		</Flex>
	);
	// ============================================================
	// END OIDC AUTH
	// ============================================================
};

export default Index;
