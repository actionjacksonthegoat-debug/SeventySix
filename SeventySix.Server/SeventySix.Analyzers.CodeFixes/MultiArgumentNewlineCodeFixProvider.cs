// <copyright file="MultiArgumentNewlineCodeFixProvider.cs" company="SeventySix">
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

namespace SeventySix.Analyzers.CodeFixes;

/// <summary>
/// Code fix provider that moves multiple arguments to separate lines.
/// This improves readability per the project style guide.
/// </summary>
[ExportCodeFixProvider(
	LanguageNames.CSharp,
	Name = nameof(MultiArgumentNewlineCodeFixProvider))]
[Shared]
public sealed class MultiArgumentNewlineCodeFixProvider : CodeFixProvider
{
	/// <inheritdoc/>
	public sealed override ImmutableArray<string> FixableDiagnosticIds { get; } =
		ImmutableArray.Create(MultiArgumentNewlineAnalyzer.DiagnosticId);

	/// <inheritdoc/>
	public sealed override FixAllProvider GetFixAllProvider() =>
		WellKnownFixAllProviders.BatchFixer;

	/// <inheritdoc/>
	public sealed override async Task RegisterCodeFixesAsync(CodeFixContext context)
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

		// Find the argument list that contains the arguments
		ArgumentSyntax? firstArgument = root
			.FindNode(diagnosticSpan)
			.FirstAncestorOrSelf<ArgumentSyntax>();

		if (firstArgument?.Parent is not ArgumentListSyntax argumentList)
		{
			return;
		}

		context.RegisterCodeFix(
			CodeAction.Create(
				title: CodeFixTitles.PutArgumentsOnSeparateLines,
				createChangedDocument: cancellationToken => MoveArgumentsToSeparateLinesAsync(
					context.Document,
					argumentList,
					cancellationToken),
				equivalenceKey: nameof(MultiArgumentNewlineCodeFixProvider)),
			diagnostic);
	}

	private static async Task<Document> MoveArgumentsToSeparateLinesAsync(
		Document document,
		ArgumentListSyntax argumentList,
		CancellationToken cancellationToken)
	{
		SyntaxNode? root = await document
			.GetSyntaxRootAsync(cancellationToken)
			.ConfigureAwait(false);

		if (root is null)
		{
			return document;
		}

		// Get base indentation from the parent node
		string baseIndentation = GetIndentation(argumentList);
		string argumentIndentation = baseIndentation + "\t";

		// Build new arguments and separators
		List<ArgumentSyntax> newArgumentNodes = [];
		List<SyntaxToken> separatorTokens = [];

		for (int index = 0; index < argumentList.Arguments.Count; index++)
		{
			ArgumentSyntax argument = argumentList.Arguments[index];

			// Create newline + indentation trivia
			SyntaxTriviaList newLeadingTrivia = SyntaxFactory.TriviaList(
				SyntaxFactory.EndOfLine("\r\n"),
				SyntaxFactory.Whitespace(argumentIndentation));

			ArgumentSyntax newArgument = argument
				.WithLeadingTrivia(newLeadingTrivia)
				.WithTrailingTrivia(SyntaxTriviaList.Empty);

			newArgumentNodes.Add(newArgument);

			// Add comma after each argument except the last
			if (index < argumentList.Arguments.Count - 1)
			{
				SyntaxToken commaToken = SyntaxFactory.Token(SyntaxKind.CommaToken);
				separatorTokens.Add(commaToken);
			}
		}

		SeparatedSyntaxList<ArgumentSyntax> newArguments =
			SyntaxFactory.SeparatedList(newArgumentNodes, separatorTokens);

		// Create new argument list with closing paren on same line as last arg
		ArgumentListSyntax newArgumentList = argumentList
			.WithArguments(newArguments)
			.WithCloseParenToken(
				argumentList.CloseParenToken.WithLeadingTrivia(SyntaxTriviaList.Empty));

		SyntaxNode newRoot = root.ReplaceNode(argumentList, newArgumentList);

		return document.WithSyntaxRoot(newRoot);
	}

	/// <summary>
	/// Gets the indentation of a node by examining the whitespace trivia on its line.
	/// </summary>
	private static string GetIndentation(SyntaxNode node)
	{
		// Get the first token of the parent statement/expression
		SyntaxNode? parent = node.Parent;

		while (parent is not null and not StatementSyntax and not MemberDeclarationSyntax)
		{
			parent = parent.Parent;
		}

		if (parent is null)
		{
			return string.Empty;
		}

		SyntaxToken firstToken = parent.GetFirstToken();
		SyntaxTriviaList leadingTrivia = firstToken.LeadingTrivia;

		// Look for whitespace trivia that represents indentation
		foreach (SyntaxTrivia trivia in leadingTrivia)
		{
			if (trivia.IsKind(SyntaxKind.WhitespaceTrivia))
			{
				return trivia.ToString();
			}
		}

		return string.Empty;
	}
}