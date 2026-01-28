// <copyright file="TriviaHelpers.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;

namespace SeventySix.Analyzers.CodeFixes.Helpers;

/// <summary>
/// Shared helper methods for manipulating syntax trivia in code fixes.
/// </summary>
internal static class TriviaHelpers
{
	/// <summary>
	/// Removes whitespace and newline trivia from a trivia list.
	/// </summary>
	/// <param name="triviaList">
	/// The trivia list to filter.
	/// </param>
	/// <param name="removeWhitespace">
	/// Whether to remove whitespace trivia.
	/// </param>
	/// <param name="removeNewlines">
	/// Whether to remove end-of-line trivia.
	/// </param>
	/// <returns>
	/// A filtered trivia list with specified trivia kinds removed.
	/// </returns>
	public static SyntaxTriviaList FilterTrivia(
		SyntaxTriviaList triviaList,
		bool removeWhitespace = true,
		bool removeNewlines = true)
	{
		List<SyntaxTrivia>? kept =
			null;

		foreach (SyntaxTrivia trivia in triviaList)
		{
			int kind =
				trivia.RawKind;

			bool shouldRemove =
				(removeWhitespace && kind == (int)SyntaxKind.WhitespaceTrivia)
				|| (removeNewlines && kind == (int)SyntaxKind.EndOfLineTrivia);

			if (!shouldRemove)
			{
				kept ??= [];
				kept.Add(trivia);
			}
		}

		return kept is null
			? SyntaxTriviaList.Empty
			: SyntaxFactory.TriviaList(kept);
	}

	/// <summary>
	/// Removes all whitespace and newline trivia from a trivia list.
	/// </summary>
	/// <param name="triviaList">
	/// The trivia list to filter.
	/// </param>
	/// <returns>
	/// A trivia list with whitespace and newlines removed.
	/// </returns>
	public static SyntaxTriviaList RemoveWhitespaceAndNewlines(
		SyntaxTriviaList triviaList) =>
		FilterTrivia(
			triviaList,
			removeWhitespace: true,
			removeNewlines: true);

	/// <summary>
	/// Removes only newline trivia from a trivia list, preserving whitespace.
	/// </summary>
	/// <param name="triviaList">
	/// The trivia list to filter.
	/// </param>
	/// <returns>
	/// A trivia list with newlines removed but whitespace preserved.
	/// </returns>
	public static SyntaxTriviaList RemoveNewlinesOnly(
		SyntaxTriviaList triviaList) =>
		FilterTrivia(
			triviaList,
			removeWhitespace: false,
			removeNewlines: true);
}