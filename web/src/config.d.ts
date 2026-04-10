type Config = {
	VITE_API_URL: string;
	VITE_CLIENT_BASE_URL: string;
	VITE_IDENTITY_AUTH_URL: string;

	VITE_IDENTITY_ISSUER: string;
	VITE_IDENTITY_CLIENT_ID: string;
};

export declare global {
	// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
	interface Window {
		Config: Config;
	}
}
