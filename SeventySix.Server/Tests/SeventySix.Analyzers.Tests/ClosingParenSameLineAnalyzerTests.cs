// <copyright file="ClosingParenSameLineAnalyzerTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using static SeventySix.Analyzers.Tests.AnalyzerTestHelpers;

namespace SeventySix.Analyzers.Tests;

/// <summary>
/// Tests for SS002 - Closing parenthesis same line analyzer.
/// Enforces ')' to be on same line as last content.
/// Follows 80/20 rule: critical paths only.
/// </summary>
public sealed class ClosingParenSameLineAnalyzerTests
{
	[Fact]
	public async Task ClosingParen_AloneOnLine_ReportsDiagnosticAsync()
	{
		const string testCode = """
			class TestClass
			{
				void TestMethod()
				{
					System.Console.WriteLine(
						"test"
					);
				}
			}
			""";

		await VerifyAnalyzerAsync<ClosingParenSameLineAnalyzer>(
			testCode,
			ExpectSS002(line: 7, column: 3));
	}

	[Fact]
	public async Task ClosingParen_OnSameLineAsContent_NoDiagnosticAsync()
	{
		const string testCode = """
			class TestClass
			{
				void TestMethod()
				{
					System.Console.WriteLine(
						"test");
				}
			}
			""";

		await VerifyNoDiagnosticsAsync<ClosingParenSameLineAnalyzer>(testCode);
	}

	[Fact]
	public async Task MultipleClosingParens_AllAloneOnLine_ReportsDiagnosticsAsync()
	{
		const string testCode = """
			class TestClass
			{
				void TestMethod()
				{
					if (
						string.Equals(
							"a",
							"b"
						)
					)
					{
					}
				}
			}
			""";

		await VerifyAnalyzerAsync<ClosingParenSameLineAnalyzer>(
			testCode,
			ExpectSS002(line: 9, column: 4),
			ExpectSS002(line: 10, column: 3));
	}

	[Fact]
	public async Task NestedMethodCalls_CorrectFormat_NoDiagnosticAsync()
	{
		const string testCode = """
			class TestClass
			{
				void TestMethod()
				{
					if (string.Equals(
						"a",
						"b"))
					{
					}
				}
			}
			""";

		await VerifyNoDiagnosticsAsync<ClosingParenSameLineAnalyzer>(testCode);
	}

	[Fact]
	public async Task EmptyArgumentList_NoDiagnosticAsync()
	{
		const string testCode = """
			class TestClass
			{
				void TestMethod()
				{
					System.Console.WriteLine();
				}
			}
			""";

		await VerifyNoDiagnosticsAsync<ClosingParenSameLineAnalyzer>(testCode);
	}
}