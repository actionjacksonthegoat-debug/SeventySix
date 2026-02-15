/** Individual technology displayed in the tech grid. */
export interface TechStackItem
{
	/** Display name (e.g. "Angular 21"). */
	readonly name: string;
	/** Simple Icons slug used to fetch the CDN SVG icon. */
	readonly slug: string;
	/** Icon CDN source identifier (e.g. "simpleIcons"). */
	readonly cdnSource: string;
	/** Hex brand color for the icon (e.g. "#DD0031"). */
	readonly brandColor: string;
	/** Official project URL opened on click. */
	readonly url: string;
	/** SPDX license identifier (e.g. "MIT", "Apache-2.0"). */
	readonly license: string;
	/** Short description of what this technology provides. */
	readonly description: string;
	/** When `true`, renders a Material icon instead of the CDN SVG. */
	readonly useMaterialIcon?: boolean;
	/** Material icon name — required when `useMaterialIcon` is `true`. */
	readonly materialIcon?: string;
}
