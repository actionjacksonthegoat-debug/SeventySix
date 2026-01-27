// <copyright file="AssignmentNewlineAnalyzer.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Collections.Immutable;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.CSharp.Syntax;
using Microsoft.CodeAnalysis.Diagnostics;

namespace SeventySix.Analyzers;

/// <summary>
/// Analyzer that enforces newline after assignment operator (=) for complex expressions.
/// Simple literals, short identifiers, and empty collections are exempt.
/// PERFORMANCE OPTIMIZED: Uses SyntaxKind switches, avoids allocations, early returns.
/// </summary>
[DiagnosticAnalyzer(LanguageNames.CSharp)]
public sealed class AssignmentNewlineAnalyzer : DiagnosticAnalyzer
{
	/// <summary>
	/// Diagnostic ID for this analyzer.
	/// </summary>
	public const string DiagnosticId = "SS001";

	private const int MaxSimpleIdentifierLength = 20;
	private const int MaxSimpleMemberAccessLength = 25;
	private const int MaxSimpleInvocationLength = 30;

	private static readonly DiagnosticDescriptor Rule = new(
		DiagnosticId,
		"Assignment value should be on new line",
		"Complex assignment value should start on a new line after '='",
		"Formatting",
		DiagnosticSeverity.Warning,
		isEnabledByDefault: true,
		description: "For readability, complex expressions assigned to variables should start on a new line after the = operator."
	);

	/// <inheritdoc/>
	public override ImmutableArray<DiagnosticDescriptor> SupportedDiagnostics { get; } =
		ImmutableArray.Create(Rule);

	/// <inheritdoc/>
	public override void Initialize(AnalysisContext context)
	{
		context.ConfigureGeneratedCodeAnalysis(GeneratedCodeAnalysisFlags.None);
		context.EnableConcurrentExecution();

		// Register for specific syntax kinds - most efficient approach
		context.RegisterSyntaxNodeAction(
			AnalyzeVariableDeclaration,
			SyntaxKind.VariableDeclaration
		);

		context.RegisterSyntaxNodeAction(
			AnalyzeAssignmentExpression,
			SyntaxKind.SimpleAssignmentExpression
		);
	}

	private static void AnalyzeVariableDeclaration(
		SyntaxNodeAnalysisContext context
	)
	{
		VariableDeclarationSyntax declaration = (VariableDeclarationSyntax)
			context.Node;
		SeparatedSyntaxList<VariableDeclaratorSyntax> variables =
			declaration.Variables;

		// Use indexed for loop - faster than foreach for SeparatedSyntaxList
		for (int index = 0; index < variables.Count; index++)
		{
			VariableDeclaratorSyntax declarator = variables[index];
			EqualsValueClauseSyntax? initializer = declarator.Initializer;

			if (initializer is null)
			{
				continue;
			}

			// Fast path: skip simple values first
			if (IsSimpleValueFast(initializer.Value))
			{
				continue;
			}

			SyntaxToken equalsToken = initializer.EqualsToken;

			if (!HasNewlineAfterToken(equalsToken))
			{
				context.ReportDiagnostic(
					Diagnostic.Create(Rule, equalsToken.GetLocation())
				);
			}
		}
	}

	private static void AnalyzeAssignmentExpression(
		SyntaxNodeAnalysisContext context
	)
	{
		AssignmentExpressionSyntax assignment = (AssignmentExpressionSyntax)
			context.Node;

		// Skip property assignments inside object initializers
		// These use a different style convention
		if (IsInsideObjectInitializer(assignment))
		{
			return;
		}

		// Fast path: skip simple values first
		if (IsSimpleValueFast(assignment.Right))
		{
			return;
		}

		SyntaxToken operatorToken = assignment.OperatorToken;

		if (!HasNewlineAfterToken(operatorToken))
		{
			context.ReportDiagnostic(
				Diagnostic.Create(Rule, operatorToken.GetLocation())
			);
		}
	}

	/// <summary>
	/// Checks if the assignment is inside an object initializer.
	/// Property assignments inside object initializers follow a different style.
	/// </summary>
	private static bool IsInsideObjectInitializer(
		AssignmentExpressionSyntax assignment)
	{
		SyntaxNode? parent = assignment.Parent;

		while (parent is not null)
		{
			if (parent is InitializerExpressionSyntax initializer
				&& (initializer.Kind() == SyntaxKind.ObjectInitializerExpression
					|| initializer.Kind() == SyntaxKind.WithInitializerExpression))
			{
				return true;
			}

			parent = parent.Parent;
		}

		return false;
	}

	/// <summary>
	/// Fast check for simple values using SyntaxKind switch - avoids type checks and allocations.
	/// </summary>
	private static bool IsSimpleValueFast(ExpressionSyntax expression)
	{
		switch (expression.Kind())
		{
			// All literal types - always simple
			case SyntaxKind.NumericLiteralExpression:
			case SyntaxKind.StringLiteralExpression:
			case SyntaxKind.CharacterLiteralExpression:
			case SyntaxKind.TrueLiteralExpression:
			case SyntaxKind.FalseLiteralExpression:
			case SyntaxKind.NullLiteralExpression:
			case SyntaxKind.DefaultLiteralExpression:
			case SyntaxKind.DefaultExpression:
				return true;

			// Short identifiers - check length via ValueText (no allocation)
			case SyntaxKind.IdentifierName:
				return ((IdentifierNameSyntax)expression)
						.Identifier
						.ValueText
						.Length < MaxSimpleIdentifierLength;

			// Empty collection expressions
			case SyntaxKind.CollectionExpression:
				return ((CollectionExpressionSyntax)expression).Elements.Count
					== 0;

			// Object creation - check if empty
			case SyntaxKind.ObjectCreationExpression:
				ObjectCreationExpressionSyntax objCreate =
					(ObjectCreationExpressionSyntax)expression;
				return IsEmptyObjectCreation(
					objCreate.ArgumentList,
					objCreate.Initializer
				);

			case SyntaxKind.ImplicitObjectCreationExpression:
				ImplicitObjectCreationExpressionSyntax implCreate =
					(ImplicitObjectCreationExpressionSyntax)expression;
				return IsEmptyObjectCreation(
					implCreate.ArgumentList,
					implCreate.Initializer
				);

			// Unary expressions - recurse on operand
			case SyntaxKind.UnaryMinusExpression:
			case SyntaxKind.UnaryPlusExpression:
			case SyntaxKind.LogicalNotExpression:
			case SyntaxKind.BitwiseNotExpression:
				return IsSimpleValueFast(
					((PrefixUnaryExpressionSyntax)expression).Operand
				);

			// Parenthesized - recurse on inner
			case SyntaxKind.ParenthesizedExpression:
				return IsSimpleValueFast(
					((ParenthesizedExpressionSyntax)expression).Expression
				);

			// Member access - use Span.Length to avoid ToString allocation
			case SyntaxKind.SimpleMemberAccessExpression:
				MemberAccessExpressionSyntax memberAccess =
					(MemberAccessExpressionSyntax)expression;
				return memberAccess.Span.Length < MaxSimpleMemberAccessLength
					&& !HasDescendantArgumentList(memberAccess);

			// Method calls with no arguments
			case SyntaxKind.InvocationExpression:
				InvocationExpressionSyntax invocation =
					(InvocationExpressionSyntax)expression;
				return invocation.ArgumentList.Arguments.Count == 0
					&& invocation.Span.Length < MaxSimpleInvocationLength;

			default:
				return false;
		}
	}

	private static bool IsEmptyObjectCreation(
		ArgumentListSyntax? argumentList,
		InitializerExpressionSyntax? initializer
	)
	{
		bool hasNoArgs =
			argumentList is null || argumentList.Arguments.Count == 0;

		if (initializer is null)
		{
			return hasNoArgs;
		}

		return hasNoArgs && initializer.Expressions.Count == 0;
	}

	/// <summary>
	/// Checks if node contains argument list (method call) without allocating strings.
	/// </summary>
	private static bool HasDescendantArgumentList(SyntaxNode node)
	{
		foreach (SyntaxNode descendant in node.DescendantNodes())
		{
			if (descendant is ArgumentListSyntax)
			{
				return true;
			}
		}

		return false;
	}

	/// <summary>
	/// Checks for newline in trailing trivia using RawKind for fastest comparison.
	/// </summary>
	private static bool HasNewlineAfterToken(SyntaxToken token)
	{
		SyntaxTriviaList trailingTrivia = token.TrailingTrivia;

		foreach (SyntaxTrivia trivia in trailingTrivia)
		{
			if (trivia.RawKind == (int)SyntaxKind.EndOfLineTrivia)
			{
				return true;
			}
		}

		return false;
	}
}