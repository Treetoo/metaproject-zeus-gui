import { Alert, Group, Text } from '@mantine/core';
import { IconAlertTriangle } from '@tabler/icons-react';

import { isMockAuthEnabled } from '@/modules/auth/mock-auth';

const MockModeBanner = () => {
	if (!isMockAuthEnabled()) {
		return null;
	}

	return (
		<Alert
			color="orange"
			variant="filled"
			py={6}
			radius={0}
			styles={{
				root: {
					position: 'sticky',
					top: 0,
					zIndex: 1000
				},
				body: {
					display: 'flex',
					justifyContent: 'center',
					alignItems: 'center'
				}
			}}
		>
			<Group gap="xs" justify="center">
				<IconAlertTriangle size={16} />
				<Text size="sm" fw={600}>
					MOCK AUTH MODE - OIDC Authentication Disabled
				</Text>
				<IconAlertTriangle size={16} />
			</Group>
		</Alert>
	);
};

export default MockModeBanner;
