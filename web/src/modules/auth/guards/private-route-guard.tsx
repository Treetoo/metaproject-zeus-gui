import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from 'react-oidc-context';

import Loading from '@/components/global/loading';

const PrivateRouteGuard = () => {
	const { isAuthenticated, isLoading } = useAuth();

	if (isLoading) {
		return <Loading />;
	}

	if (!isAuthenticated) {
		return <Navigate to="/" replace />;
	}

	return <Outlet />;
};

export default PrivateRouteGuard;
