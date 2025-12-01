import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { UserInfo } from '@/modules/user/model';
import {
	getMockUserId,
	getMockUserData,
	setMockUserId,
	setMockUserData,
	clearMockAuth,
	isMockAuthEnabled
} from './mock-auth';

/**
 * Mock auth context type - mimics react-oidc-context's AuthContextProps
 */
type MockAuthContextType = {
	// Auth state
	isAuthenticated: boolean;
	isLoading: boolean;
	user: UserInfo | null;

	// Mock-specific state
	isMockMode: boolean;

	// Actions
	login: (userId: number, userData: UserInfo) => void;
	logout: () => void;
	updateUser: (userData: UserInfo) => void;
};

const MockAuthContext = createContext<MockAuthContextType | null>(null);

type MockAuthProviderProps = {
	children: ReactNode;
};

/**
 * Mock Auth Provider - replaces react-oidc-context's AuthProvider for mock mode
 */
export const MockAuthProvider = ({ children }: MockAuthProviderProps) => {
	const [isLoading, setIsLoading] = useState(true);
	const [user, setUser] = useState<UserInfo | null>(null);

	// Initialize from localStorage on mount
	useEffect(() => {
		const storedUserId = getMockUserId();
		const storedUserData = getMockUserData();

		if (storedUserId && storedUserData) {
			setUser(storedUserData);
		}

		setIsLoading(false);
	}, []);

	const login = useCallback((userId: number, userData: UserInfo) => {
		setMockUserId(userId);
		setMockUserData(userData);
		setUser(userData);
	}, []);

	const logout = useCallback(() => {
		clearMockAuth();
		setUser(null);
	}, []);

	const updateUser = useCallback((userData: UserInfo) => {
		setMockUserData(userData);
		setUser(userData);
	}, []);

	const value: MockAuthContextType = {
		isAuthenticated: !!user,
		isLoading,
		user,
		isMockMode: isMockAuthEnabled(),
		login,
		logout,
		updateUser
	};

	return <MockAuthContext.Provider value={value}>{children}</MockAuthContext.Provider>;
};

/**
 * Hook to use mock auth context
 */
export const useMockAuth = (): MockAuthContextType => {
	const context = useContext(MockAuthContext);
	if (!context) {
		throw new Error('useMockAuth must be used within a MockAuthProvider');
	}
	return context;
};
