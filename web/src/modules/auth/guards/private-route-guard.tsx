import { Navigate, Outlet } from 'react-router-dom';
// ============================================================
// MOCK AUTH MODE - useAuth commented out for mock mode
// ============================================================
// import { useAuth } from 'react-oidc-context';
// ============================================================
// END MOCK AUTH MODE IMPORTS
// ============================================================
import { useMockAuth } from '@/modules/auth/mock-auth-context';

import Loading from '@/components/global/loading';

const PrivateRouteGuard = () => {
	// ============================================================
	// MOCK AUTH MODE - Using mock auth instead of OIDC
	// ============================================================
	// const { isAuthenticated, isLoading } = useAuth();
	const { isAuthenticated, isLoading } = useMockAuth();
	// ============================================================
	// END MOCK AUTH MODE
	// ============================================================

	if (isLoading) {
		return <Loading />;
	}

	if (!isAuthenticated) {
		return <Navigate to="/" replace />;
	}

	return <Outlet />;
};

export default PrivateRouteGuard;
