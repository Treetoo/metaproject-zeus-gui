import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
	// Load env file based on `mode` in the current working directory.
	// By default, only env variables prefixed with VITE_ are exposed.
	const env = loadEnv(mode, process.cwd(), '');

	return {
		plugins: [
			react(),
			tsconfigPaths(),
			// Plugin to replace %VITE_XXX% placeholders in index.html during dev
			{
				name: 'html-transform',
				transformIndexHtml(html) {
					return html
						.replace(/%DEV%/g, 'true')
						.replace(/%VITE_API_URL%/g, env.VITE_API_URL || '')
						.replace(/%VITE_CLIENT_BASE_URL%/g, env.VITE_CLIENT_BASE_URL || '')
						.replace(/%VITE_IDENTITY_AUTH_URL%/g, env.VITE_IDENTITY_AUTH_URL || '')
						.replace(/%VITE_IDENTITY_ISSUER%/g, env.VITE_IDENTITY_ISSUER || '')
						.replace(/%VITE_IDENTITY_CLIENT_ID%/g, env.VITE_IDENTITY_CLIENT_ID || '')
						.replace(/%VITE_MOCK_AUTH_ENABLED%/g, env.VITE_MOCK_AUTH_ENABLED || 'false');
				}
			}
		],
		server: {
			host: '0.0.0.0',
			hmr: {
				clientPort: 5137
			},
			port: 5137,
			watch: {
				usePolling: true
			},
			fs: {
				allow: ['..', '../..']
			}
		}
	};
});
