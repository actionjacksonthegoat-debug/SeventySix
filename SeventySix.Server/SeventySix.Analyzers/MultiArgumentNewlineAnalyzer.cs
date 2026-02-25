// <copyright file="MultiArgumentNewlineAnalyzer.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Collections.Immutable;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.CSharp.Syntax;
using Microsoft.CodeAnalysis.Diagnostics;

namespace SeventySix.Analyzers;

/// <summary>
/// Analyzer that enforces 2+ arguments to be on separate lines.
/// This aligns with the project style guide: "2+ params: Each on new line, indented".
/// </summary>
[DiagnosticAnalyzer(LanguageNames.CSharp)]
public sealed class MultiArgumentNewlineAnalyzer : DiagnosticAnalyzer
{
	/// <summary>
	/// Diagnostic ID for this analyzer.
	/// </summary>
	public const string DiagnosticId = "SS006";

	/// <summary>
	/// Maximum total length of simple arguments that can stay on one line.
	/// </summary>
	/// <remarks>
	/// When the combined length of all arguments is under this threshold,
	/// the arguments may remain on one line for brevity. This prevents
	/// overly strict formatting for simple calls like <c>Math.Max(a, b)</c>.
	/// </remarks>
	private const int SimpleArgumentsThreshold = 40;

	private static readonly DiagnosticDescriptor Rule = new(
		DiagnosticId,
		"Multiple arguments should be on separate lines",
		"Method call with 2+ arguments should have each argument on a separate line",
		DiagnosticCategories.Formatting,
		DiagnosticSeverity.Warning,
		isEnabledByDefault: true,
		description: "When a method call has two or more arguments, each argument should be on its own line for readability.");

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

		// Rule only applies to 2+ arguments
		if (argumentList.Arguments.Count < 2)
		{
			return;
		}

		// Check if all arguments are on the same line
		if (!AreAllArgumentsOnSameLine(argumentList))
		{
			return; // Already on separate lines
		}

		// Allow short simple arguments to stay on one line
		if (AreSimpleShortArguments(argumentList))
		{
			return;
		}

		// Report diagnostic on the first argument
		ArgumentSyntax firstArgument = argumentList.Arguments[0];
		context.ReportDiagnostic(
			Diagnostic.Create(Rule, firstArgument.GetLocation()));
	}

	/// <summary>
	/// Checks if all arguments in the list are on the same line.
	/// </summary>
	private static bool AreAllArgumentsOnSameLine(ArgumentListSyntax argumentList)
	{
		int? firstLine = null;

		foreach (int argumentLine in argumentList.Arguments.Select(
			argument =>
				argument
					.GetLocation()
					.GetLineSpan()
					.StartLinePosition.Line))
		{
			if (firstLine is null)
			{
				firstLine = argumentLine;
			}
			else if (argumentLine != firstLine)
			{
				return false;
			}
		}

		return true;
	}

	/// <summary>
	/// Checks if arguments are simple identifiers or literals under a length threshold.
	/// These are allowed to stay on one line (e.g., "Method(x, y)" is OK).
	/// </summary>
	private static bool AreSimpleShortArguments(ArgumentListSyntax argumentList)
	{
		int totalLength = 0;

		foreach (ExpressionSyntax expression in argumentList.Arguments.Select(
			argument => argument.Expression))
		{
			// Only simple identifiers and literals qualify
			bool isSimple = expression switch
			{
				IdentifierNameSyntax => true,
				LiteralExpressionSyntax => true,
				MemberAccessExpressionSyntax memberAccess =>
					IsSimpleMemberAccess(memberAccess),
				_ => false
			};

			if (!isSimple)
			{
				return false;
			}

			totalLength += expression.Span.Length;

			// Add comma + space between arguments
			totalLength += 2;
		}

		// Remove last comma + space
		totalLength -= 2;

		return totalLength <= SimpleArgumentsThreshold;
	}

	/// <summary>
	/// Checks if a member access is simple (e.g., obj.Property, not obj.Method().Property).
	/// </summary>
	private static bool IsSimpleMemberAccess(MemberAccessExpressionSyntax memberAccess)
	{
		// Check if it's a chain of simple identifiers
		ExpressionSyntax current = memberAccess;

		while (current is MemberAccessExpressionSyntax access)
		{
			current = access.Expression;
		}

		return current is IdentifierNameSyntax;
	}
}