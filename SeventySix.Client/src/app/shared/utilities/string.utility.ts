/**
 * Capitalizes the first letter of a string.
 *
 * **Usage Note:** Use this utility for programmatic string transformations
 * (e.g., converting kebab-case to Title Case). For display-only capitalization
 * of known text, prefer CSS `text-transform: capitalize` instead.
 *
 * @param {string} word
 * The string to capitalize.
 *
 * @returns {string}
 * The string with the first letter capitalized.
 *
 * @example
 * // Converting kebab-case to Title Case
 * "user-management".split("-").map(word => capitalize(word)).join(" ")
 * // Result: "User Management"
 */
export function capitalize(word: string): string
{
	if (word.length === 0)
	{
		return word;
	}

	return word
		.charAt(0)
		.toUpperCase() + word.slice(1);
}
