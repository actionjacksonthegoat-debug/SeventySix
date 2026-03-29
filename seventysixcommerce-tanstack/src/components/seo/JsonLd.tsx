import type { JSX } from "react";

/**
 * Safely serializes JSON-LD, escaping sequences that could break out of script tags.
 * @param data - The structured data object to serialize.
 * @returns Escaped JSON string safe for embedding in script tags.
 */
function safeJsonLd(data: object): string
{
	return JSON
		.stringify(data)
		.replace(/</g, "\\u003c");
}

/**
 * Renders a JSON-LD structured data script tag.
 * @param data - The structured data object conforming to Schema.org vocabulary.
 * @returns A script element with serialized JSON-LD content.
 */
export function JsonLd({ data }: Readonly<{ data: object; }>): JSX.Element
{
	return (
		<script
			type="application/ld+json"
			dangerouslySetInnerHTML={{ __html: safeJsonLd(data) }}
		/>);
}