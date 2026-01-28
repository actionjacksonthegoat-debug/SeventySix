// <copyright file="SyntaxHelpers.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;

namespace SeventySix.Analyzers.Helpers;

/// <summary>
/// Shared helper methods for Roslyn syntax analysis.
/// </summary>
internal static class SyntaxHelpers
{
	/// <summary>
	/// Checks if a token has a newline in its trailing trivia.
	/// </summary>
	/// <param name="token">
	/// The syntax token to check.
	/// </param>
	/// <returns>
	/// True if the token has trailing newline trivia; otherwise false.
	/// </returns>
	public static bool HasNewlineAfterToken(SyntaxToken token)
	{
		foreach (SyntaxTrivia trivia in token.TrailingTrivia)
		{
			if (trivia.RawKind == (int)SyntaxKind.EndOfLineTrivia)
			{
				return true;
			}
		}

		return false;
	}

	/// <summary>
	/// Gets the leading whitespace string from a syntax token.
	/// </summary>
	/// <param name="token">
	/// The syntax token to inspect.
	/// </param>
	/// <returns>
	/// The leading whitespace string, or empty if none found.
	/// </returns>
	public static string GetLeadingWhitespace(SyntaxToken token)
	{
		foreach (SyntaxTrivia trivia in token.LeadingTrivia)
		{
			if (trivia.RawKind == (int)SyntaxKind.WhitespaceTrivia)
			{
				return trivia.ToString();
			}
		}

		return string.Empty;
	}

	/// <summary>
	/// Gets the leading whitespace string from a syntax node's first token.
	/// </summary>
	/// <param name="node">
	/// The syntax node to inspect.
	/// </param>
	/// <returns>
	/// The leading whitespace string, or empty if none found.
	/// </returns>
	public static string GetLeadingWhitespace(SyntaxNode node) =>
		GetLeadingWhitespace(node.GetFirstToken());

	/// <summary>
	/// Gets the line number (0-based) of a syntax token.
	/// </summary>
	/// <param name="token">
	/// The syntax token to inspect.
	/// </param>
	/// <returns>
	/// The 0-based line number of the token.
	/// </returns>
	public static int GetLineNumber(SyntaxToken token) =>
		token.GetLocation().GetLineSpan().StartLinePosition.Line;
}
