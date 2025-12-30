// <copyright file="AnalyzerTestHelpers.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.CodeAnalysis.CodeFixes;
using Microsoft.CodeAnalysis.CSharp.Testing;
using Microsoft.CodeAnalysis.Diagnostics;

namespace SeventySix.Analyzers.Tests;

/// <summary>
/// Helper methods and base configurations for analyzer testing.
/// Centralizes common test setup to follow DRY principle.
/// </summary>
public static class AnalyzerTestHelpers
{
	/// <summary>
	/// Creates a diagnostic result for SS001 at the specified location.
	/// </summary>
	public static DiagnosticResult ExpectSS001(int line, int column) =>
		new DiagnosticResult(
			AssignmentNewlineAnalyzer.DiagnosticId,
			DiagnosticSeverity.Warning).WithLocation(line, column);

	/// <summary>
	/// Creates a diagnostic result for SS002 at the specified location.
	/// </summary>
	public static DiagnosticResult ExpectSS002(int line, int column) =>
		new DiagnosticResult(
			ClosingParenSameLineAnalyzer.DiagnosticId,
			DiagnosticSeverity.Warning).WithLocation(line, column);

	/// <summary>
	/// Creates a diagnostic result for SS003 at the specified location.
	/// </summary>
	public static DiagnosticResult ExpectSS003(int line, int column) =>
		new DiagnosticResult(
			AssignmentContinuationIndentAnalyzer.DiagnosticId,
			DiagnosticSeverity.Warning).WithLocation(line, column);

	/// <summary>
	/// Creates a diagnostic result for SS004 at the specified location.
	/// </summary>
	public static DiagnosticResult ExpectSS004(int line, int column) =>
		new DiagnosticResult(
			DateTimeUsageAnalyzer.DiagnosticId,
			DiagnosticSeverity.Warning).WithLocation(line, column);

	/// <summary>
	/// Verifies that the analyzer produces expected diagnostics for the given code.
	/// </summary>
	public static async Task VerifyAnalyzerAsync<TAnalyzer>(
		string source,
		params DiagnosticResult[] expected)
		where TAnalyzer : DiagnosticAnalyzer, new()
	{
		CSharpAnalyzerTest<TAnalyzer, DefaultVerifier> test =
			new()
			{
				TestCode = source,
				ReferenceAssemblies =
					ReferenceAssemblies.Net.Net80,
			};

		test.ExpectedDiagnostics.AddRange(expected);

		await test.RunAsync(CancellationToken.None);
	}

	/// <summary>
	/// Verifies that the analyzer produces no diagnostics for the given code.
	/// </summary>
	public static Task VerifyNoDiagnosticsAsync<TAnalyzer>(string source)
		where TAnalyzer : DiagnosticAnalyzer, new() =>
		VerifyAnalyzerAsync<TAnalyzer>(source);

	/// <summary>
	/// Verifies that the code fix provider transforms the source to the expected fixed code.
	/// </summary>
	public static async Task VerifyCodeFixAsync<TAnalyzer, TCodeFix>(
		string source,
		string fixedSource,
		params DiagnosticResult[] expected)
		where TAnalyzer : DiagnosticAnalyzer, new()
		where TCodeFix : CodeFixProvider, new()
	{
		CSharpCodeFixTest<TAnalyzer, TCodeFix, DefaultVerifier> test =
			new()
			{
				TestCode = source,
				FixedCode = fixedSource,
				ReferenceAssemblies =
					ReferenceAssemblies.Net.Net80,
			};

		test.ExpectedDiagnostics.AddRange(expected);

		await test.RunAsync(CancellationToken.None);
	}
}