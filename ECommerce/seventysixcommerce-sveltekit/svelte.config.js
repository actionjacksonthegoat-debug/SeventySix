import adapter from '@sveltejs/adapter-node';
import { relative, sep } from 'node:path';

/** @type {boolean} */
const isProduction = process.env.NODE_ENV === 'production';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	compilerOptions: {
		// defaults to rune mode for the project, execept for `node_modules`. Can be removed in svelte 6.
		runes: ({ filename }) => {
			const relativePath = relative(import.meta.dirname, filename);
			const pathSegments = relativePath.toLowerCase().split(sep);
			const isExternalLibrary = pathSegments.includes('node_modules');

			return isExternalLibrary ? undefined : true;
		}
	},
	kit: {
		// adapter-auto only supports some environments, see https://svelte.dev/docs/kit/adapter-auto for a list.
		// If your environment is not supported, or you settled on a specific environment, switch out the adapter.
		// See https://svelte.dev/docs/kit/adapters for more information about adapters.
		adapter: adapter({
			out: 'build',
			precompress: true,
		}),
		csp: {
			// Nonce mode in production; relaxed in dev so Vite's HMR/eval scripts are not blocked by CSP
			mode: isProduction ? 'nonce' : undefined,
			directives: {
				'default-src': ['self'],
				'script-src': isProduction
					? ['self', 'https://www.googletagmanager.com']
					: ['self', 'unsafe-inline', 'unsafe-eval', 'https://www.googletagmanager.com'],
				'script-src-attr': ['none'],
				'style-src': isProduction
					? ['self']
					: ['self', 'unsafe-inline'],
				'style-src-attr': ['none'],
				'img-src': ['self', 'data:'],
				'font-src': ['self'],
				'connect-src': ['self', 'https://www.google-analytics.com', 'https://www.googletagmanager.com'],
				'object-src': ['none'],
				'frame-ancestors': ['none'],
				'base-uri': ['self'],
				'form-action': ['self']
			}
		}
	}
};

export default config;
