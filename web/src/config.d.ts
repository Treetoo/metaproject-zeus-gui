type Config = {
	VITE_API_URL: string;
	VITE_CLIENT_BASE_URL: string;
	VITE_IDENTITY_AUTH_URL: string;

	VITE_IDENTITY_ISSUER: string;
	VITE_IDENTITY_CLIENT_ID: string;

	// Mock auth mode - set to 'true' to enable mock authentication
	VITE_MOCK_AUTH_ENABLED?: string;
};

export declare global {
	// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
	interface Window {
		Config: Config;
	}
}
