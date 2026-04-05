/**
 * Custom production server for SvelteKit adapter-node.
 * Applies security headers to ALL responses — including static assets
 * served by the built-in sirv middleware, which bypasses hooks.server.ts.
 */
import { createServer } from "node:http";
import { handler } from "./build/handler.js";

/** @type {Record<string, string>} */
const SECURITY_HEADERS = {
	"X-Content-Type-Options": "nosniff",
	"X-Frame-Options": "DENY",
	"Referrer-Policy": "strict-origin-when-cross-origin",
	"Permissions-Policy": "camera=(), microphone=(), geolocation=()",
	"Cross-Origin-Embedder-Policy": "credentialless",
};

const server = createServer((request, response) => {
	for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
		response.setHeader(name, value);
	}

	handler(request, response, () => {
		response.writeHead(404, { "Content-Type": "text/plain" });
		response.end("Not found");
	});
});

const PORT = Number(process.env.PORT ?? "3001");
const HOST = process.env.HOST ?? "0.0.0.0";

server.listen(PORT, HOST, () => {
	process.stdout.write(`Listening on http://${HOST}:${PORT}\n`);
});