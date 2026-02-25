/**
 * PWA Icon Generation Script
 *
 * Generates all required PWA icon sizes from a source image.
 * Uses sharp for high-quality image resizing and optimization.
 *
 * Usage: node scripts/generate-icons.mjs [filename]
 *   - filename: Source image filename in public/icons/ (default: icon-source-file.png)
 *   - Example: node scripts/generate-icons.mjs my-logo.png
 *
 * @requires sharp
 */

import { existsSync, unlinkSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const scriptDir =
	dirname(fileURLToPath(import.meta.url));

const projectRoot =
	join(scriptDir, "..");

const iconsDir =
	join(projectRoot, "public", "icons");

const DEFAULT_SOURCE_FILENAME =
	"icon-source-file.png";

const sourceFilename =
	process.argv[2] ?? DEFAULT_SOURCE_FILENAME;

const SOURCE_FILE =
	join(iconsDir, sourceFilename);

const FAVICON_OUTPUT =
	join(projectRoot, "public", "favicon.ico");

/** Standard (non-maskable) icon sizes */
const STANDARD_ICONS = [
	{ size: 48, name: "icon-48x48.png" },
	{ size: 72, name: "icon-72x72.png" },
	{ size: 96, name: "icon-96x96.png" },
	{ size: 128, name: "icon-128x128.png" },
	{ size: 144, name: "icon-144x144.png" },
	{ size: 152, name: "icon-152x152.png" },
	{ size: 192, name: "icon-192x192.png" },
	{ size: 384, name: "icon-384x384.png" },
	{ size: 512, name: "icon-512x512.png" },
];

/** Maskable icon sizes (with safe zone padding) */
const MASKABLE_ICONS = [
	{ size: 192, name: "icon-maskable-192x192.png" },
	{ size: 512, name: "icon-maskable-512x512.png" },
];

const FAVICON_SIZE = 32;

/**
 * Builds an ICO file buffer from a single PNG buffer.
 *
 * ICO format: 6-byte header + 16-byte directory entry + embedded PNG data.
 *
 * @param {Buffer} pngBuffer
 * The raw PNG image data.
 *
 * @param {number} size
 * The icon dimensions (width and height, must be equal).
 *
 * @returns {Buffer}
 * The complete ICO file as a Buffer.
 */
function buildIcoFromPng(
	pngBuffer,
	size)
{
	const headerSize = 6;
	const dirEntrySize = 16;
	const dataOffset = headerSize + dirEntrySize;

	const header =
		Buffer.alloc(headerSize);

	header.writeUInt16LE(0, 0);
	header.writeUInt16LE(1, 2);
	header.writeUInt16LE(1, 4);

	const dirEntry =
		Buffer.alloc(dirEntrySize);

	dirEntry.writeUInt8(size < 256 ? size : 0, 0);
	dirEntry.writeUInt8(size < 256 ? size : 0, 1);
	dirEntry.writeUInt8(0, 2);
	dirEntry.writeUInt8(0, 3);
	dirEntry.writeUInt16LE(1, 4);
	dirEntry.writeUInt16LE(32, 6);
	dirEntry.writeUInt32LE(pngBuffer.length, 8);
	dirEntry.writeUInt32LE(dataOffset, 12);

	return Buffer.concat([
		header,
		dirEntry,
		pngBuffer,
	]);
}

/**
 * Generates a single standard PWA icon at the specified size.
 *
 * @param {sharp.Sharp} sourceImage
 * The sharp instance loaded from the source image.
 *
 * @param {number} size
 * The target dimensions (square).
 *
 * @param {string} outputPath
 * The full file path to write the output PNG.
 *
 * @returns {Promise<void>}
 */
async function generateStandardIcon(
	sourceImage,
	size,
	outputPath)
{
	await sourceImage
		.clone()
		.resize(size, size, {
			kernel: sharp.kernel.lanczos3,
			fit: "contain",
			background: { r: 0, g: 0, b: 0, alpha: 0 },
		})
		.png({
			quality: 80,
			compressionLevel: 9,
		})
		.toFile(outputPath);
}

/**
 * Generates a maskable PWA icon with safe zone padding.
 *
 * Maskable icons require the actual content to fit within the inner 80%
 * (safe zone), with background filling the outer 20%.
 *
 * @param {sharp.Sharp} sourceImage
 * The sharp instance loaded from the source image.
 *
 * @param {number} size
 * The target dimensions (square).
 *
 * @param {string} outputPath
 * The full file path to write the output PNG.
 *
 * @returns {Promise<void>}
 */
async function generateMaskableIcon(
	sourceImage,
	size,
	outputPath)
{
	const safeZoneSize =
		Math.round(size * 0.8);

	const padding =
		Math.round((size - safeZoneSize) / 2);

	const resizedContent =
		await sourceImage
			.clone()
			.resize(safeZoneSize, safeZoneSize, {
				kernel: sharp.kernel.lanczos3,
				fit: "contain",
				background: { r: 0, g: 0, b: 0, alpha: 0 },
			})
			.toBuffer();

	await sharp({
		create: {
			width: size,
			height: size,
			channels: 4,
			background: { r: 25, g: 118, b: 210, alpha: 1 },
		},
	})
		.composite([{
			input: resizedContent,
			top: padding,
			left: padding,
		}])
		.png({
			quality: 80,
			compressionLevel: 9,
		})
		.toFile(outputPath);
}

/**
 * Main entry point. Generates all PWA icons from the source image.
 *
 * @returns {Promise<void>}
 */
async function main()
{
	if (!existsSync(SOURCE_FILE))
	{
		console.error(`Source image not found: ${SOURCE_FILE}`);
		console.error(`\nExpected path: SeventySix.Client/public/icons/${sourceFilename}`);
		console.error("Recommended: 512×512 pixels or larger, square PNG with transparency.");
		console.error(`\nUsage: node scripts/generate-icons.mjs [filename]`);
		console.error(`  Default: ${DEFAULT_SOURCE_FILENAME}`);
		process.exit(1);
	}

	const sourceImage =
		sharp(SOURCE_FILE);

	const metadata =
		await sourceImage.metadata();

	console.log(`Source: ${metadata.width}x${metadata.height} ${metadata.format}`);
	console.log("Generating standard icons...");

	for (const icon of STANDARD_ICONS)
	{
		const outputPath =
			join(iconsDir, icon.name);

		await generateStandardIcon(
			sourceImage,
			icon.size,
			outputPath);

		await sharp(outputPath).metadata();

		console.log(`  [OK] ${icon.name} (${icon.size}x${icon.size})`);
	}

	console.log("Generating maskable icons...");

	for (const icon of MASKABLE_ICONS)
	{
		const outputPath =
			join(iconsDir, icon.name);

		await generateMaskableIcon(
			sourceImage,
			icon.size,
			outputPath);

		console.log(`  [OK] ${icon.name} (${icon.size}x${icon.size})`);
	}

	console.log("Generating favicon.ico...");

	const faviconPng =
		await sourceImage
			.clone()
			.resize(FAVICON_SIZE, FAVICON_SIZE, {
				kernel: sharp.kernel.lanczos3,
				fit: "contain",
				background: { r: 0, g: 0, b: 0, alpha: 0 },
			})
			.png({
				quality: 80,
				compressionLevel: 9,
			})
			.toBuffer();

	const icoBuffer =
		buildIcoFromPng(
			faviconPng,
			FAVICON_SIZE);

	const { writeFileSync } = await import("node:fs");
	writeFileSync(FAVICON_OUTPUT, icoBuffer);
	console.log(`  [OK] favicon.ico (${FAVICON_SIZE}x${FAVICON_SIZE})`);

	if (existsSync(SOURCE_FILE))
	{
		unlinkSync(SOURCE_FILE);
		console.log(`Deleted source file: ${sourceFilename}`);
	}

	console.log("\nDone! All icons generated successfully.");
}

main().catch(
	(error) =>
	{
		console.error("Icon generation failed:", error);
		process.exit(1);
	});
