/**
 * Custom production server for SvelteKit adapter-node.
 * Applies security headers to ALL responses — including static assets
 * served by the built-in sirv middleware, which bypasses hooks.server.ts.
 * Pre-sets a default Content-Type so CSRF rejections and edge-case static
 * files never leave with an empty Content-Type header.
 */
import { createServer } from "node:http";
import { extname } from "node:path";
import { handler } from "./build/handler.js";

/** @type {Record<string, string>} */
const SECURITY_HEADERS = {
	"X-Content-Type-Options": "nosniff",
	"X-Frame-Options": "DENY",
	"Referrer-Policy": "strict-origin-when-cross-origin",
	"Permissions-Policy": "camera=(), microphone=(), geolocation=()",
	"Cross-Origin-Embedder-Policy": "credentialless",
};

/** @type {Record<string, string>} */
const MIME_TYPES = {
	".ico": "image/x-icon",
	".png": "image/png",
	".jpg": "image/jpeg",
	".jpeg": "image/jpeg",
	".svg": "image/svg+xml",
	".webp": "image/webp",
	".css": "text/css; charset=utf-8",
	".js": "text/javascript; charset=utf-8",
	".json": "application/json; charset=utf-8",
	".html": "text/html; charset=utf-8",
	".xml": "application/xml; charset=utf-8",
	".txt": "text/plain; charset=utf-8",
	".woff2": "font/woff2",
	".woff": "font/woff",
	".webmanifest": "application/manifest+json",
};

const server = createServer((request, response) => {
	// Pre-set a default Content-Type based on the URL extension.
	// Handlers (sirv, SvelteKit SSR) that properly set Content-Type will
	// override this via setHeader/writeHead. Responses that skip headers
	// (e.g. CSRF 403 rejections, edge-case static files) inherit the default.
	const urlPath = (request.url ?? "/").split("?")[0];
	const ext = extname(urlPath);
	response.setHeader("content-type", MIME_TYPES[ext] ?? "text/plain; charset=utf-8");

	for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
		response.setHeader(name, value);
	}

	handler(request, response, () => {
		response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
		response.end("Not found");
	});
});

const PORT = Number(process.env.PORT ?? "3001");
const HOST = process.env.HOST ?? "0.0.0.0";

server.listen(PORT, HOST, () => {
	process.stdout.write(`Listening on http://${HOST}:${PORT}\n`);
});