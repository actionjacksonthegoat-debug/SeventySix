/**
 * Capitalizes the first letter of a string.
 *
 * @param word
 * The string to capitalize.
 *
 * @returns
 * The string with the first letter capitalized.
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
