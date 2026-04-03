import { defineConfig } from 'vite';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import viteReact from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import basicSsl from '@vitejs/plugin-basic-ssl';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const certificatePath = resolve(import.meta.dirname, '..', '..', 'SeventySix.Client', 'ssl', 'dev-certificate.crt');
const privateKeyPath = resolve(import.meta.dirname, '..', '..', 'SeventySix.Client', 'ssl', 'dev-certificate.key');
const hasSharedCertificate = existsSync(certificatePath) && existsSync(privateKeyPath);
const useBasicSsl = !hasSharedCertificate && process.env.NODE_ENV !== 'production';
const sslPlugins = useBasicSsl ? [basicSsl()] : [];

export default defineConfig({
  resolve: {
    alias: {
      '~': resolve(import.meta.dirname, 'src'),
    },
  },
  optimizeDeps: {
    include: ['use-sync-external-store/shim/with-selector'],
  },
  server: {
    https: hasSharedCertificate
      ? {
          cert: readFileSync(certificatePath),
          key: readFileSync(privateKeyPath),
        }
      : undefined,
  },
  plugins: [
    ...sslPlugins,
    tailwindcss(),
    tanstackStart({
      srcDirectory: 'src',
      router: {
        routesDirectory: 'routes',
        routeFileIgnorePattern: '(__tests__|.test.ts$|sitemap.xml.ts$|robots.txt.ts$)',
      },
    }),
    viteReact(),
  ],
});
