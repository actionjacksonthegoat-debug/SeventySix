// <copyright file="ClosingParenSameLineCodeFixTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using static SeventySix.Analyzers.Tests.AnalyzerTestHelpers;

namespace SeventySix.Analyzers.Tests;

/// <summary>
/// Tests for SS002 CodeFix provider.
/// Verifies that closing parenthesis is moved to same line as last content.
/// Follows 80/20 rule: critical paths only.
/// </summary>
public sealed class ClosingParenSameLineCodeFixTests
{
	/// <summary>
	/// Basic method call with closing paren alone on line should be fixed.
	/// </summary>
	[Fact]
	public async Task MethodCall_ClosingParenAlone_MovesToSameLineAsync()
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

		const string fixedCode = """
			class TestClass
			{
				void TestMethod()
				{
					System.Console.WriteLine(
						"test");
				}
			}
			""";

		await VerifyCodeFixAsync<
			ClosingParenSameLineAnalyzer,
			ClosingParenSameLineCodeFixProvider>(
			testCode,
			fixedCode,
			ExpectSS002(line: 7, column: 3));
	}

	/// <summary>
	/// Nested method calls with multiple closing parens should all be fixed.
	/// </summary>
	[Fact]
	public async Task NestedCalls_MultipleClosingParens_AllMovedToSameLineAsync()
	{
		const string testCode = """
			class TestClass
			{
				void TestMethod()
				{
					System.Console.WriteLine(
						string.Format(
							"{0}",
							"test"
						)
					);
				}
			}
			""";

		const string fixedCode = """
			class TestClass
			{
				void TestMethod()
				{
					System.Console.WriteLine(
						string.Format(
							"{0}",
							"test"));
				}
			}
			""";

		await VerifyCodeFixAsync<
			ClosingParenSameLineAnalyzer,
			ClosingParenSameLineCodeFixProvider>(
			testCode,
			fixedCode,
			ExpectSS002(line: 9, column: 4),
			ExpectSS002(line: 10, column: 3));
	}

	/// <summary>
	/// If statement with closing paren alone should be fixed.
	/// </summary>
	[Fact]
	public async Task IfStatement_ClosingParenAlone_MovesToSameLineAsync()
	{
		const string testCode = """
			class TestClass
			{
				void TestMethod()
				{
					if (
						true
					)
					{
					}
				}
			}
			""";

		const string fixedCode = """
			class TestClass
			{
				void TestMethod()
				{
					if (
						true)
					{
					}
				}
			}
			""";

		await VerifyCodeFixAsync<
			ClosingParenSameLineAnalyzer,
			ClosingParenSameLineCodeFixProvider>(
			testCode,
			fixedCode,
			ExpectSS002(line: 7, column: 3));
	}
}