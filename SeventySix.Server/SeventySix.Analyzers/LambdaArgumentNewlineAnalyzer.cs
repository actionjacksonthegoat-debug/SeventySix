// <copyright file="LambdaArgumentNewlineAnalyzer.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Collections.Immutable;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.CSharp.Syntax;
using Microsoft.CodeAnalysis.Diagnostics;

namespace SeventySix.Analyzers;

/// <summary>
/// Analyzer that enforces block lambda arguments to start on a new line after the opening parenthesis.
/// Expression-bodied lambdas (like <c>user =&gt; user.Id</c>) are exempt.
/// This aligns with the project style guide: "Lambda params: Lambda on new line after (".
/// </summary>
[DiagnosticAnalyzer(LanguageNames.CSharp)]
public sealed class LambdaArgumentNewlineAnalyzer : DiagnosticAnalyzer
{
	/// <summary>
	/// Diagnostic ID for this analyzer.
	/// </summary>
	public const string DiagnosticId = "SS005";

	private static readonly DiagnosticDescriptor Rule = new(
		DiagnosticId,
		"Block lambda should start on new line",
		"Block lambda argument should start on a new line after '('",
		DiagnosticCategories.Formatting,
		DiagnosticSeverity.Warning,
		isEnabledByDefault: true,
		description: "Lambda arguments with block bodies should start on their own line after the opening parenthesis for readability.");

	/// <inheritdoc/>
	public override ImmutableArray<DiagnosticDescriptor> SupportedDiagnostics { get; } =
		ImmutableArray.Create(Rule);

	/// <inheritdoc/>
	public override void Initialize(AnalysisContext context)
	{
		context.ConfigureGeneratedCodeAnalysis(GeneratedCodeAnalysisFlags.None);
		context.EnableConcurrentExecution();

		context.RegisterSyntaxNodeAction(
			AnalyzeArgumentList,
			SyntaxKind.ArgumentList);
	}

	private static void AnalyzeArgumentList(SyntaxNodeAnalysisContext context)
	{
		ArgumentListSyntax argumentList = (ArgumentListSyntax)context.Node;

		// Skip empty argument lists
		if (argumentList.Arguments.Count == 0)
		{
			return;
		}

		foreach (ArgumentSyntax argument in argumentList.Arguments)
		{
			AnalyzeLambdaArgument(
				context,
				argumentList.OpenParenToken,
				argument);
		}
	}

	private static void AnalyzeLambdaArgument(
		SyntaxNodeAnalysisContext context,
		SyntaxToken openParenToken,
		ArgumentSyntax argument)
	{
		// Check if argument is a lambda expression with a block body
		LambdaExpressionSyntax? lambdaExpression = argument.Expression switch
		{
			SimpleLambdaExpressionSyntax simpleLambda => simpleLambda,
			ParenthesizedLambdaExpressionSyntax parenLambda => parenLambda,
			_ => null
		};

		if (lambdaExpression is null)
		{
			return;
		}

		// Only check block lambdas (not expression-bodied)
		if (lambdaExpression.Block is null)
		{
			return;
		}

		// Check if lambda is a trivial single-line block (e.g., () => { })
		if (IsTrivialSingleLineBlock(lambdaExpression.Block))
		{
			return;
		}

		// Check if lambda starts on same line as opening paren
		int openParenLine = openParenToken
			.GetLocation()
			.GetLineSpan()
			.StartLinePosition.Line;

		int lambdaStartLine = lambdaExpression
			.GetLocation()
			.GetLineSpan()
			.StartLinePosition.Line;

		if (lambdaStartLine == openParenLine)
		{
			context.ReportDiagnostic(
				Diagnostic.Create(Rule, argument.GetLocation()));
		}
	}

	/// <summary>
	/// Checks if a block is a trivial single-line block (e.g., { } or { return; }).
	/// These are allowed to stay on the same line.
	/// </summary>
	private static bool IsTrivialSingleLineBlock(BlockSyntax block)
	{
		int openBraceLine = block.OpenBraceToken
			.GetLocation()
			.GetLineSpan()
			.StartLinePosition.Line;

		int closeBraceLine = block.CloseBraceToken
			.GetLocation()
			.GetLineSpan()
			.StartLinePosition.Line;

		return openBraceLine == closeBraceLine;
	}
}