/**
 * Post-build script: inject SRI hashes for static scripts in index.html
 * that Angular's subresourceIntegrity build option does not process automatically.
 *
 * Angular only computes SRI for its own generated chunks (main.js, chunk-*.js).
 * Static assets copied from public/ (e.g., theme-init.js) are not included.
 *
 * Runs automatically after every 'npm run build' via the 'postbuild' lifecycle hook.
 */
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const distDir = join(__dirname, "..", "dist", "SeventySix.Client", "browser");
const indexPath = join(distDir, "index.html");

let html;
try
{
	html = readFileSync(indexPath, "utf8");
}
catch (error)
{
	if (error.code === "ENOENT")
	{
		// No dist yet — nothing to do (happens when other npm lifecycle scripts run
		// outside a build context, e.g. 'npm install --ignore-scripts').
		process.exit(0);
	}
	throw error;
}

// Match <script src="..."> tags that don't yet have an integrity attribute.
// [^>]* matches across newlines because [^>] is any char except '>'.
const scriptTagRegex = /<script\b([^>]*\bsrc="([^"#?]+(?:\?[^"]*)?)"[^>]*)>/g;
let modified = false;
let match;

while ((match = scriptTagRegex.exec(html)) !== null)
{
	const [fullTag, attrs, src] = match;

	// Already protected — nothing to do.
	if (attrs.includes("integrity="))
	{
		continue;
	}

	// Only process same-origin (relative) scripts — external CDN URLs are out of scope.
	if (/^https?:\/\/|^\/\//.test(src))
	{
		continue;
	}

	const fileName = src.replace(/^\//, "");
	const filePath = join(distDir, fileName);

	let content;
	try
	{
		content = readFileSync(filePath);
	}
	catch (error)
	{
		if (error.code === "ENOENT")
		{
			console.error(`inject-sri: file not found for SRI injection: ${filePath}`);
			process.exit(1);
		}
		throw error;
	}
	const hash = createHash("sha384").update(content).digest("base64");
	const integrity = `sha384-${hash}`;

	const newTag = `<script ${attrs.trimEnd()} integrity="${integrity}" crossorigin="anonymous">`;
	html = html.replace(fullTag, newTag);
	modified = true;
	console.log(`inject-sri: ✓ ${fileName} → ${integrity.substring(0, 32)}...`);
}

if (modified)
{
	writeFileSync(indexPath, html, "utf8");
	console.log("inject-sri: index.html updated with SRI hashes.");
}
else
{
	console.log("inject-sri: no additional SRI injection required.");
}
