// <copyright file="LambdaArgumentNewlineCodeFixProvider.cs" company="SeventySix">
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
/// Code fix provider that moves block lambda arguments to a new line after the opening parenthesis.
/// This improves readability per the project style guide.
/// </summary>
[ExportCodeFixProvider(
	LanguageNames.CSharp,
	Name = nameof(LambdaArgumentNewlineCodeFixProvider))]
[Shared]
public sealed class LambdaArgumentNewlineCodeFixProvider : CodeFixProvider
{
	/// <inheritdoc/>
	public sealed override ImmutableArray<string> FixableDiagnosticIds { get; } =
		ImmutableArray.Create(LambdaArgumentNewlineAnalyzer.DiagnosticId);

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

		// Find the argument that contains the lambda
		ArgumentSyntax? argument = root
			.FindNode(diagnosticSpan)
			.FirstAncestorOrSelf<ArgumentSyntax>();

		if (argument is null)
		{
			return;
		}

		context.RegisterCodeFix(
			CodeAction.Create(
				title: CodeFixTitles.MoveLambdaToNewLine,
				createChangedDocument: cancellationToken => MoveLambdaToNewLineAsync(
					context.Document,
					argument,
					cancellationToken),
				equivalenceKey: nameof(LambdaArgumentNewlineCodeFixProvider)),
			diagnostic);
	}

	private static async Task<Document> MoveLambdaToNewLineAsync(
		Document document,
		ArgumentSyntax argument,
		CancellationToken cancellationToken)
	{
		SyntaxNode? root = await document
			.GetSyntaxRootAsync(cancellationToken)
			.ConfigureAwait(false);

		if (root is null)
		{
			return document;
		}

		// Get the argument list to find indentation
		ArgumentListSyntax? argumentList = argument.Parent as ArgumentListSyntax;

		if (argumentList is null)
		{
			return document;
		}

		// Calculate proper indentation (one level deeper than the argument list)
		string baseIndentation = GetIndentation(argumentList);
		string newIndentation = baseIndentation + "\t";

		// Create newline + indentation trivia
		SyntaxTriviaList newLeadingTrivia = SyntaxFactory.TriviaList(
			SyntaxFactory.EndOfLine("\r\n"),
			SyntaxFactory.Whitespace(newIndentation));

		// Replace leading trivia on the argument
		ArgumentSyntax newArgument = argument.WithLeadingTrivia(newLeadingTrivia);

		SyntaxNode newRoot = root.ReplaceNode(argument, newArgument);

		return document.WithSyntaxRoot(newRoot);
	}

	/// <summary>
	/// Gets the indentation of a node by examining the whitespace trivia on its line.
	/// </summary>
	private static string GetIndentation(SyntaxNode node)
	{
		// Get the first token of the line containing this node
		SyntaxToken firstToken = node.GetFirstToken();
		SyntaxTriviaList leadingTrivia = firstToken.LeadingTrivia;

		// Look for whitespace trivia that represents indentation
		foreach (SyntaxTrivia trivia in leadingTrivia.Where(
				triviaItem => triviaItem.IsKind(SyntaxKind.WhitespaceTrivia)))
		{
			return trivia.ToString();
		}

		return string.Empty;
	}
}