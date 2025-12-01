import { createBrowserRouter, createRoutesFromElements, Route, RouterProvider } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import { createTheme, MantineProvider } from '@mantine/core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ModalsProvider } from '@mantine/modals';
// ============================================================
// MOCK AUTH MODE - AuthProvider commented out for mock mode
// ============================================================
// import { AuthProvider } from 'react-oidc-context';
// ============================================================
// END MOCK AUTH MODE IMPORTS
// ============================================================

import Project from '@/routes/project';
import AddProject from '@/routes/project/add';
import ProjectDetail from '@/routes/project/detail';
import NotFound from '@/components/global/not-found';
import ProjectDetailMembers from '@/routes/project/detail/members';
import ProjectArchivePage from '@/routes/project/detail/archive';
import ProjectRequests from '@/routes/admin/requests';
import ProjectRequestDetail from '@/routes/admin/requests/detail';
import PrivateRouteGuard from '@/modules/auth/guards/private-route-guard';
import AdminRouteGuard from '@/modules/auth/guards/admin-route-guard';
import ProjectDetailGuard from '@/modules/auth/guards/project-detail-guard';
import ProjectPublicationsAddPage from '@/routes/project/detail/publications';
import ProjectRequestPage from '@/routes/project/detail/request';
import AuthLogin from '@/routes/auth/login';
// ============================================================
// MOCK AUTH MODE - userManager commented out for mock mode
// ============================================================
// import userManager from '@/modules/auth/config/user-manager';
// import { onSigninCallback } from '@/modules/auth/methods/onSigninCallback';
// ============================================================
// END MOCK AUTH MODE IMPORTS
// ============================================================
import AllocationRequest from '@/routes/project/detail/allocation/request';
import ResourceAddPage from '@/routes/admin/resources/add';
import ResourceDetailPage from '@/routes/admin/resources/detail';
import ResourceEditPage from '@/routes/admin/resources/edit';
import { AdminContextProvider } from '@/modules/auth/admin-context';
import FailedProjects from '@/routes/admin/failed';
import AllocationDetail from '@/routes/project/detail/allocation/detail';
import AllProjects from '@/routes/admin/projects';
import AllocationRequestDetail from '@/routes/admin/allocation-requests/detail';
import AdminAllocations from '@/routes/admin/allocations';
import AllocationRequestsList from '@/routes/admin/allocation-requests/list';
import ProjectInvitation from '@/routes/project/invitation';
import AdminLinkPage from '@/routes/admin';
import MyPublicationsPage from '@/routes/publications';
import UsageDashboard from '@/routes/usage';
import { MockAuthProvider } from '@/modules/auth/mock-auth-context';

import Index from './routes/index/index';
import Root from './routes/root';
import i18next from './modules/language/i18next';
import ErrorPage from './components/global/error-page';
import ResourceList from './routes/admin/resources/list';
import ResourceAttributesPage from './routes/admin/resources/attributes';

// Create QueryClient outside component to prevent recreation on re-renders
const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			retry: 1,
			staleTime: 30 * 1000 // 30 seconds default stale time
		}
	}
});

// Create router outside component to prevent recreation on re-renders
const router = createBrowserRouter(
	createRoutesFromElements(
		<Route id="root" path="/" element={<Root />} errorElement={<ErrorPage />}>
			<Route index element={<Index />} />
			<Route path="auth/callback" element={<AuthLogin />} />
			<Route path="/project" element={<PrivateRouteGuard />}>
				<Route index element={<Project />} />
				<Route path="add" element={<AddProject />} />
				<Route path="invitation/:token" element={<ProjectInvitation />} />
				<Route path=":id" element={<ProjectDetailGuard />}>
					<Route index element={<ProjectDetail />} />
					<Route path="members" element={<ProjectDetailMembers />} />
					<Route path="archive" element={<ProjectArchivePage />} />
					<Route path="publications" element={<ProjectPublicationsAddPage />} />
					<Route path="allocation" element={<AllocationRequest />} />
					<Route path="allocation/:allocationId" element={<AllocationDetail />} />
					<Route path="request" element={<ProjectRequestPage />} />
				</Route>
			</Route>
			<Route path="/publications" element={<PrivateRouteGuard />}>
				<Route index element={<MyPublicationsPage />} />
			</Route>
			<Route path="/usage" element={<PrivateRouteGuard />}>
				<Route index element={<UsageDashboard />} />
			</Route>
			<Route path="/admin" element={<AdminRouteGuard />}>
				<Route index element={<AdminLinkPage />} />
				<Route path="requests" element={<ProjectRequests />} />
				<Route path="projects" element={<AllProjects />} />
				<Route path="requests/:id" element={<ProjectDetailGuard />}>
					<Route index element={<ProjectRequestDetail />} />
				</Route>
				<Route path="resources" element={<ResourceList />} />
				<Route path="resources/add" element={<ResourceAddPage />} />
				<Route path="resources/attributes" element={<ResourceAttributesPage />} />
				<Route path="resources/:id" element={<ResourceDetailPage />} />
				<Route path="resources/:id/edit" element={<ResourceEditPage />} />
				<Route path="stages" element={<FailedProjects />} />
				<Route path="allocations" element={<AdminAllocations />} />
				<Route path="allocation-requests" element={<AllocationRequestsList />} />
				<Route path="allocations/:allocationId" element={<AllocationRequestDetail />} />
			</Route>
			<Route path="/director" element={<AdminRouteGuard />}>
				<Route index element={<AdminLinkPage />} />
				<Route path="requests" element={<ProjectRequests />} />
				<Route path="projects" element={<AllProjects />} />
				<Route path="requests/:id" element={<ProjectDetailGuard />}>
					<Route index element={<ProjectRequestDetail />} />
				</Route>
				<Route path="resources" element={<ResourceList />} />
				<Route path="resources/attributes" element={<ResourceAttributesPage />} />
				<Route path="resources/:id" element={<ResourceDetailPage />} />
				<Route path="allocations" element={<AdminAllocations />} />
				<Route path="allocation-requests" element={<AllocationRequestsList />} />
				<Route path="allocations/:allocationId" element={<AllocationRequestDetail />} />
			</Route>
			<Route path="*" element={<NotFound />} />
		</Route>
	)
);

const theme = createTheme({
	primaryShade: 7,
	primaryColor: 'sky',
	cursorType: 'pointer',
	colors: {
		sky: [
			'#ebf6ff',
			'#d5e9fa',
			'#a5d1f7',
			'#73b9f6',
			'#50a4f5',
			'#3d97f5',
			'#3491f6',
			'#297ddb',
			'#1d6fc4',
			'#0060ad'
		]
	}
});

// ============================================================
// MOCK AUTH MODE - OIDC config commented out for mock mode
// ============================================================
// const oidcConfig = {
// 	userManager,
// 	onSigninCallback
// };
// ============================================================
// END MOCK AUTH MODE
// ============================================================

const App = () => {
	return (
		<MantineProvider theme={theme}>
			<QueryClientProvider client={queryClient}>
				<I18nextProvider i18n={i18next}>
					{/* ============================================================ */}
					{/* MOCK AUTH MODE - Using MockAuthProvider instead of AuthProvider */}
					{/* ============================================================ */}
					{/* <AuthProvider {...oidcConfig}> */}
					<MockAuthProvider>
						<AdminContextProvider>
							<ModalsProvider>
								<RouterProvider router={router} />
							</ModalsProvider>
						</AdminContextProvider>
					</MockAuthProvider>
					{/* </AuthProvider> */}
					{/* ============================================================ */}
					{/* END MOCK AUTH MODE */}
					{/* ============================================================ */}
				</I18nextProvider>
			</QueryClientProvider>
		</MantineProvider>
	);
};

export default App;
