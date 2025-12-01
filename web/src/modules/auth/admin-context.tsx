import {
	createContext,
	type Dispatch,
	type ReactElement,
	type SetStateAction,
	useContext,
	useEffect,
	useState
} from 'react';
// ============================================================
// MOCK AUTH MODE - useAuth commented out for mock mode
// ============================================================
// import { useAuth } from 'react-oidc-context';
// ============================================================
// END MOCK AUTH MODE IMPORTS
// ============================================================

import { getCurrentRole } from '@/modules/auth/methods/getCurrentRole';
import { ROLE_UPDATED_EVENT } from '@/modules/auth/methods/onSigninCallback';
import { useMockAuth } from '@/modules/auth/mock-auth-context';

import { Role } from '../user/role';

export type AdminContextType = {
	currentRole: Role;
	setCurrentRole: Dispatch<SetStateAction<Role>>;
};

export const AdminContext = createContext<AdminContextType>({
	currentRole: Role.USER,
	setCurrentRole: () => {}
});

export const AdminContextProvider = ({ children }: { children: ReactElement }) => {
	const [currentRole, setCurrentRole] = useState(getCurrentRole());
	// ============================================================
	// MOCK AUTH MODE - Using mock auth instead of OIDC
	// ============================================================
	// const { isAuthenticated } = useAuth();
	const { isAuthenticated } = useMockAuth();
	// ============================================================
	// END MOCK AUTH MODE
	// ============================================================

	// Re-sync role from localStorage when auth state changes
	useEffect(() => {
		setCurrentRole(getCurrentRole());
	}, [isAuthenticated]);

	// Listen for role update events from onSigninCallback
	useEffect(() => {
		const handleRoleUpdate = () => {
			setCurrentRole(getCurrentRole());
		};

		window.addEventListener(ROLE_UPDATED_EVENT, handleRoleUpdate);

		return () => {
			window.removeEventListener(ROLE_UPDATED_EVENT, handleRoleUpdate);
		};
	}, []);

	return <AdminContext.Provider value={{ currentRole, setCurrentRole }}>{children}</AdminContext.Provider>;
};

export const useAdminContext = () => useContext(AdminContext);
