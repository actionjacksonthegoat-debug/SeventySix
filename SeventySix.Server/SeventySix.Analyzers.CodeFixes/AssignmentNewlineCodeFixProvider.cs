// <copyright file="AssignmentNewlineCodeFixProvider.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Collections.Immutable;
using System.Collections.Generic;
using System.Composition;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CodeActions;
using Microsoft.CodeAnalysis.CodeFixes;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.CSharp.Syntax;
using Microsoft.CodeAnalysis.Text;

namespace SeventySix.Analyzers.CodeFixes;

/// <summary>
/// Code fix provider that adds a newline after the = operator.
/// PERFORMANCE: Uses efficient token replacement and minimal allocations.
/// </summary>
[ExportCodeFixProvider(
	LanguageNames.CSharp,
	Name = nameof(AssignmentNewlineCodeFixProvider)
)]
[Shared]
public sealed class AssignmentNewlineCodeFixProvider : CodeFixProvider
{
	/// <inheritdoc/>
	public sealed override ImmutableArray<string> FixableDiagnosticIds { get; } =
		ImmutableArray.Create(AssignmentNewlineAnalyzer.DiagnosticId);

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
		SyntaxToken equalsToken = root.FindToken(diagnosticSpan.Start);

		context.RegisterCodeFix(
			CodeAction.Create(
				title: "Add newline after '='",
				createChangedDocument: ct => AddNewlineAfterEqualsAsync(
					context.Document,
					equalsToken,
					ct),
				equivalenceKey: nameof(AssignmentNewlineCodeFixProvider)
			),
			diagnostic);
	}

	private static async Task<Document> AddNewlineAfterEqualsAsync(
		Document document,
		SyntaxToken equalsToken,
		CancellationToken cancellationToken)
	{
		SyntaxNode? root = await document
			.GetSyntaxRootAsync(cancellationToken)
			.ConfigureAwait(false);

		if (root is null)
		{
			return document;
		}

		// Get base indentation and add one tab
		string baseIndent = GetStatementIndentation(equalsToken);
		string newIndent = baseIndent + "\t";

		// Create new trailing trivia for equals token: newline + indentation
		SyntaxTriviaList newEqualsTrailingTrivia = SyntaxFactory.TriviaList(
			SyntaxFactory.EndOfLine("\r\n"),
			SyntaxFactory.Whitespace(newIndent));

		SyntaxToken newEqualsToken = equalsToken.WithTrailingTrivia(
			newEqualsTrailingTrivia);

		// Get and clean next token's leading trivia
		SyntaxToken nextToken = equalsToken.GetNextToken();
		SyntaxTriviaList cleanedLeading = RemoveWhitespaceTrivia(
			nextToken.LeadingTrivia);
		SyntaxToken newNextToken = nextToken.WithLeadingTrivia(cleanedLeading);

		// Replace both tokens efficiently
		SyntaxNode newRoot = root.ReplaceTokens(
			new[] { equalsToken, nextToken },
			(original, _) =>
				original == equalsToken ? newEqualsToken : newNextToken);

		return document.WithSyntaxRoot(newRoot);
	}

	private static string GetStatementIndentation(SyntaxToken token)
	{
		SyntaxNode? node = token.Parent;

		// For property assignments in object initializers, use the property's indent
		if (
			node is AssignmentExpressionSyntax assignment
			&& assignment.Parent is InitializerExpressionSyntax)
		{
			// Get the indentation of the property name (left side of assignment)
			SyntaxToken leftToken = assignment.Left.GetFirstToken();

			foreach (SyntaxTrivia trivia in leftToken.LeadingTrivia)
			{
				if (trivia.RawKind == (int)SyntaxKind.WhitespaceTrivia)
				{
					return trivia.ToString();
				}
			}
		}

		// Walk up to find containing statement or member
		while (
			node
				is not null
					and not StatementSyntax
					and not MemberDeclarationSyntax)
		{
			node = node.Parent;
		}

		if (node is not null)
		{
			// Find whitespace trivia (search in reverse for efficiency)
			SyntaxTriviaList leadingTrivia = node.GetLeadingTrivia();

			for (int index = leadingTrivia.Count - 1; index >= 0; index--)
			{
				SyntaxTrivia trivia = leadingTrivia[index];

				if (trivia.RawKind == (int)SyntaxKind.WhitespaceTrivia)
				{
					return trivia.ToString();
				}
			}
		}

		return "\t\t"; // Default fallback
	}

	private static SyntaxTriviaList RemoveWhitespaceTrivia(
		SyntaxTriviaList trivia)
	{
		List<SyntaxTrivia>? kept = null;

		foreach (SyntaxTrivia t in trivia)
		{
			int kind = t.RawKind;

			if (
				kind is not ((int)SyntaxKind.WhitespaceTrivia)
					and not ((int)SyntaxKind.EndOfLineTrivia))
			{
				kept ??=
					new List<SyntaxTrivia>();
			}
			kept.Add(t);
		}

		return kept is null
			? SyntaxTriviaList.Empty
			: SyntaxFactory.TriviaList(kept);
	}
}