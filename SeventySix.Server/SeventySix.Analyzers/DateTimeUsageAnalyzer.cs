// <copyright file="DateTimeUsageAnalyzer.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Collections.Immutable;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.CSharp.Syntax;
using Microsoft.CodeAnalysis.Diagnostics;

namespace SeventySix.Analyzers;

/// <summary>
/// Analyzer that enforces use of TimeProvider instead of DateTime.* usages (UtcNow/Now/new DateTime/System.DateTime).
/// </summary>
[DiagnosticAnalyzer(LanguageNames.CSharp)]
public sealed class DateTimeUsageAnalyzer : DiagnosticAnalyzer
{
	public const string DiagnosticId = "SS004";

	private static readonly DiagnosticDescriptor Rule = new(
		DiagnosticId,
		"Avoid DateTime.* usage",
		"Avoid direct DateTime usage (UtcNow/Now/new DateTime/System.DateTime). Inject TimeProvider instead for testability.",
		"Design",
		DiagnosticSeverity.Warning,
		isEnabledByDefault: true,
		description: "Using DateTime.UtcNow/Now or creating DateTime instances prevents testable time abstraction. Use TimeProvider instead.");

	public override ImmutableArray<DiagnosticDescriptor> SupportedDiagnostics { get; } =
		ImmutableArray.Create(Rule);

	// Small allowlist for legitimate DateTime literals (seeds, config files, etc.)
	private static readonly HashSet<string> AllowedFileNames =
		new(StringComparer.OrdinalIgnoreCase)
		{
			"SecurityRoleConfiguration.cs",
		};

	private static bool IsModelSnapshot(string fileName) =>
		fileName.Contains("ModelSnapshot", System.StringComparison.OrdinalIgnoreCase);

	private static bool ShouldIgnoreFile(SyntaxNodeAnalysisContext context)
	{
		string filePath = context.Node.SyntaxTree.FilePath ?? string.Empty;
		string fileName = System.IO.Path.GetFileName(filePath) ?? string.Empty;

		// Ignore EF migrations, generated designer files, and explicit allowlist
		if (filePath.Contains($"{System.IO.Path.DirectorySeparatorChar}Migrations{System.IO.Path.DirectorySeparatorChar}"))
		{
			return true;
		}

		if (fileName.EndsWith(".Designer.cs", StringComparison.OrdinalIgnoreCase))
		{
			return true;
		}

		if (IsModelSnapshot(fileName))
		{
			return true;
		}

		if (AllowedFileNames.Contains(fileName))
		{
			return true;
		}

		return false;
	}

	public override void Initialize(AnalysisContext context)
	{
		context.ConfigureGeneratedCodeAnalysis(GeneratedCodeAnalysisFlags.None);
		context.EnableConcurrentExecution();

		// Member access like DateTime.UtcNow or DateTime.Now
		context.RegisterSyntaxNodeAction(
			AnalyzeMemberAccess,
			SyntaxKind.SimpleMemberAccessExpression);

		// Object creation like new DateTime(...)
		context.RegisterSyntaxNodeAction(
			AnalyzeObjectCreation,
			SyntaxKind.ObjectCreationExpression);

		// Qualified name like System.DateTime
		context.RegisterSyntaxNodeAction(
			AnalyzeQualifiedName,
			SyntaxKind.QualifiedName);
	}

	private static void AnalyzeMemberAccess(SyntaxNodeAnalysisContext context)
	{
		if (ShouldIgnoreFile(context))
		{
			return;
		}

		MemberAccessExpressionSyntax member = (MemberAccessExpressionSyntax)context.Node;

		// Example: DateTime.UtcNow or DateTime.Now
		if (member.Expression is IdentifierNameSyntax identifier
			&& identifier.Identifier.ValueText == "DateTime"
			&& member.Name is IdentifierNameSyntax name
			&& (name.Identifier.ValueText == "UtcNow" || name.Identifier.ValueText == "Now"))
		{
			context.ReportDiagnostic(Diagnostic.Create(Rule, member.GetLocation()));
			return;
		}

		// Example: System.DateTime.UtcNow (member could be DateTime.UtcNow with left 'System.DateTime')
		if (member.Expression is MemberAccessExpressionSyntax innerMember
			&& innerMember.Expression is IdentifierNameSyntax sys && sys.Identifier.ValueText == "System"
			&& innerMember.Name is IdentifierNameSyntax dateTimeIdentifier
			&& dateTimeIdentifier.Identifier.ValueText == "DateTime"
			&& member.Name is IdentifierNameSyntax outerName
			&& (outerName.Identifier.ValueText == "UtcNow" || outerName.Identifier.ValueText == "Now"))
		{
			context.ReportDiagnostic(Diagnostic.Create(Rule, member.GetLocation()));
			return;
		}
	}

	private static void AnalyzeObjectCreation(SyntaxNodeAnalysisContext context)
	{
		if (ShouldIgnoreFile(context))
		{
			return;
		}

		ObjectCreationExpressionSyntax creation = (ObjectCreationExpressionSyntax)context.Node;

		if (creation.Type is IdentifierNameSyntax identifier
			&& identifier.Identifier.ValueText == "DateTime")
		{
			context.ReportDiagnostic(Diagnostic.Create(Rule, creation.GetLocation()));
		}

		// Also handle qualified object creation like new System.DateTime(...)
		if (creation.Type is QualifiedNameSyntax q && q.Right.Identifier.ValueText == "DateTime")
		{
			context.ReportDiagnostic(Diagnostic.Create(Rule, creation.GetLocation()));
		}
	}

	private static void AnalyzeQualifiedName(SyntaxNodeAnalysisContext context)
	{
		if (ShouldIgnoreFile(context))
		{
			return;
		}

		QualifiedNameSyntax qualified = (QualifiedNameSyntax)context.Node;

		// Example: System.DateTime used as a type or member
		if (qualified.Right.Identifier.ValueText == "DateTime")
		{
			context.ReportDiagnostic(Diagnostic.Create(Rule, qualified.GetLocation()));
		}
	}
}
