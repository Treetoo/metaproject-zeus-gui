import { UserInfo } from '@/modules/user/model';

// Local storage keys for mock auth
export const MOCK_USER_ID_KEY = 'mockUserId';
export const MOCK_USER_DATA_KEY = 'mockUserData';

/**
 * Check if mock auth is enabled
 */
export const isMockAuthEnabled = (): boolean => {
	return window.Config?.VITE_MOCK_AUTH_ENABLED === 'true';
};

/**
 * Get the current mock user ID from localStorage
 */
export const getMockUserId = (): number | null => {
	const id = localStorage.getItem(MOCK_USER_ID_KEY);
	return id ? parseInt(id, 10) : null;
};

/**
 * Set the mock user ID in localStorage
 */
export const setMockUserId = (id: number): void => {
	localStorage.setItem(MOCK_USER_ID_KEY, id.toString());
};

/**
 * Get the current mock user data from localStorage
 */
export const getMockUserData = (): UserInfo | null => {
	const data = localStorage.getItem(MOCK_USER_DATA_KEY);
	if (!data) return null;
	try {
		return JSON.parse(data) as UserInfo;
	} catch {
		return null;
	}
};

/**
 * Set the mock user data in localStorage
 */
export const setMockUserData = (user: UserInfo): void => {
	localStorage.setItem(MOCK_USER_DATA_KEY, JSON.stringify(user));
};

/**
 * Clear mock auth data from localStorage
 */
export const clearMockAuth = (): void => {
	localStorage.removeItem(MOCK_USER_ID_KEY);
	localStorage.removeItem(MOCK_USER_DATA_KEY);
};

/**
 * Check if user is logged in (mock mode)
 */
export const isMockUserLoggedIn = (): boolean => {
	return getMockUserId() !== null && getMockUserData() !== null;
};
