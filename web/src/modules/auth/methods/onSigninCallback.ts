import { User } from 'oidc-client-ts';

import { signInUser } from '@/modules/auth/api/sign-in-user';
import { MAX_ROLE } from '@/modules/auth/constants';

export const ROLE_UPDATED_EVENT = 'roleUpdated';

export const onSigninCallback = async (user: User | void): Promise<void> => {
	if (user instanceof User) {
		const userResponse = await signInUser(user.access_token);
		const role = userResponse.role;

		if (role) {
			localStorage.setItem(MAX_ROLE, role);
			// Dispatch custom event to notify context of role change
			window.dispatchEvent(new CustomEvent(ROLE_UPDATED_EVENT));
		}
	}

	window.history.replaceState({}, document.title, `${window.Config.VITE_CLIENT_BASE_URL}/project`);
};
