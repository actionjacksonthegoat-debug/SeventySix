// <copyright file="ClosingParenSameLineCodeFixProvider.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Collections.Immutable;
using System.Composition;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CodeActions;
using Microsoft.CodeAnalysis.CodeFixes;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.CSharp.Syntax;
using Microsoft.CodeAnalysis.Text;
using SeventySix.Analyzers;
using SeventySix.Analyzers.CodeFixes.Helpers;

namespace SeventySix.Analyzers.CodeFixes;

/// <summary>
/// Code fix provider that moves closing parenthesis to the same line as the previous content.
/// Handles consecutive )) patterns correctly.
/// PERFORMANCE: Uses efficient token replacement and minimal allocations.
/// </summary>
[ExportCodeFixProvider(
	LanguageNames.CSharp,
	Name = nameof(ClosingParenSameLineCodeFixProvider)
)]
[Shared]
public sealed class ClosingParenSameLineCodeFixProvider : CodeFixProvider
{
	/// <inheritdoc/>
	public sealed override ImmutableArray<string> FixableDiagnosticIds { get; } =
		ImmutableArray.Create(ClosingParenSameLineAnalyzer.DiagnosticId);

	/// <inheritdoc/>
	public sealed override FixAllProvider GetFixAllProvider() =>
		WellKnownFixAllProviders.BatchFixer;

	/// <inheritdoc/>
	public sealed override async Task RegisterCodeFixesAsync(
		CodeFixContext context)
	{
		SyntaxNode? root = await context
			.Document.GetSyntaxRootAsync(context.CancellationToken)
			.ConfigureAwait(false);

		if (root is null)
		{
			return;
		}

		Diagnostic diagnostic = context.Diagnostics[0];
		TextSpan diagnosticSpan = diagnostic.Location.SourceSpan;
		SyntaxToken closeParenToken = root.FindToken(diagnosticSpan.Start);

		context.RegisterCodeFix(
			CodeAction.Create(
				title: CodeFixTitles.MoveClosingParenToPreviousLine,
				createChangedDocument: cancellationToken => MoveCloseParenToSameLineAsync(
					context.Document,
					closeParenToken,
					cancellationToken),
				equivalenceKey: nameof(ClosingParenSameLineCodeFixProvider)),
			diagnostic);
	}

	private static async Task<Document> MoveCloseParenToSameLineAsync(
		Document document,
		SyntaxToken closeParenToken,
		CancellationToken cancellationToken)
	{
		SyntaxNode? root = await document
			.GetSyntaxRootAsync(cancellationToken)
			.ConfigureAwait(false);

		if (root is null)
		{
			return document;
		}

		// Get the token before the close paren
		SyntaxToken previousToken = closeParenToken.GetPreviousToken();

		if (previousToken.IsMissing)
		{
			return document;
		}

		// Remove trailing newline/whitespace from previous token
		SyntaxTriviaList cleanedPreviousTrailing = TriviaHelpers.RemoveWhitespaceAndNewlines(
			previousToken.TrailingTrivia);

		// Remove leading newline/whitespace from close paren, but keep comments
		SyntaxTriviaList cleanedCloseParenLeading = TriviaHelpers.RemoveWhitespaceAndNewlines(
			closeParenToken.LeadingTrivia);

		// Create new tokens
		SyntaxToken newPreviousToken = previousToken.WithTrailingTrivia(
			cleanedPreviousTrailing);
		SyntaxToken newCloseParenToken = closeParenToken.WithLeadingTrivia(
			cleanedCloseParenLeading);

		// Replace both tokens
		SyntaxNode newRoot = root.ReplaceTokens(
			new[] { previousToken, closeParenToken },
			(original, _) =>
				original == previousToken
					? newPreviousToken
					: newCloseParenToken);

		return document.WithSyntaxRoot(newRoot);
	}
}