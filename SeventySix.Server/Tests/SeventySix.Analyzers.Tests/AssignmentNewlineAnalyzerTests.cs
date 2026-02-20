// <copyright file="AssignmentNewlineAnalyzerTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using static SeventySix.Analyzers.Tests.AnalyzerTestHelpers;

namespace SeventySix.Analyzers.Tests;

/// <summary>
/// Tests for SS001 - Assignment newline analyzer.
/// Enforces newline after '=' for complex expressions.
/// Follows 80/20 rule: critical paths only.
/// </summary>
public sealed class AssignmentNewlineAnalyzerTests
{
	[Fact]
	public async Task ComplexExpression_OnSameLine_ReportsDiagnosticAsync()
	{
		const string testCode = """
			class TestClass
			{
				void TestMethod()
				{
					string value = new System.Text.StringBuilder().ToString();
				}
			}
			""";

		await VerifyAnalyzerAsync<AssignmentNewlineAnalyzer>(
			testCode,
			ExpectSS001(line: 5, column: 16));
	}

	[Fact]
	public async Task ComplexExpression_OnNewLine_NoDiagnosticAsync()
	{
		const string testCode = """
			class TestClass
			{
				void TestMethod()
				{
					string value =
						new System.Text.StringBuilder().ToString();
				}
			}
			""";

		await VerifyNoDiagnosticsAsync<AssignmentNewlineAnalyzer>(testCode);
	}

	[Fact]
	public async Task SimpleLiteral_OnSameLine_NoDiagnosticAsync()
	{
		const string testCode = """
			class TestClass
			{
				void TestMethod()
				{
					int count = 5;
					string name = "test";
					bool flag = true;
				}
			}
			""";

		await VerifyNoDiagnosticsAsync<AssignmentNewlineAnalyzer>(testCode);
	}

	[Fact]
	public async Task ShortIdentifier_OnSameLine_NoDiagnosticAsync()
	{
		const string testCode = """
			class TestClass
			{
				void TestMethod()
				{
					string other = "test";
					string value = other;
				}
			}
			""";

		await VerifyNoDiagnosticsAsync<AssignmentNewlineAnalyzer>(testCode);
	}

	[Fact]
	public async Task ObjectCreation_OnSameLine_ReportsDiagnosticAsync()
	{
		const string testCode = """
			using System.Collections.Generic;

			class TestClass
			{
				void TestMethod()
				{
					List<string> items = new List<string> { "one", "two" };
				}
			}
			""";

		await VerifyAnalyzerAsync<AssignmentNewlineAnalyzer>(
			testCode,
			ExpectSS001(line: 7, column: 22));
	}
}