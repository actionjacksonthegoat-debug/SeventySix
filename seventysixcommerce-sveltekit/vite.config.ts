import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import basicSsl from '@vitejs/plugin-basic-ssl';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';

const certificatePath = resolve(import.meta.dirname, '..', 'SeventySix.Client', 'ssl', 'dev-certificate.crt');
const privateKeyPath = resolve(import.meta.dirname, '..', 'SeventySix.Client', 'ssl', 'dev-certificate.key');
const hasSharedCertificate = existsSync(certificatePath) && existsSync(privateKeyPath);
const sslPlugins = hasSharedCertificate ? [] : [basicSsl()];

export default defineConfig({
	server: {
		https: hasSharedCertificate
			? {
					cert: readFileSync(certificatePath),
					key: readFileSync(privateKeyPath)
				}
			: undefined
	},
	plugins: [...sslPlugins, tailwindcss(), sveltekit()]
});
