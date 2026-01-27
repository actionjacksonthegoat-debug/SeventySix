// <copyright file="LambdaArgumentNewlineAnalyzerTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using static SeventySix.Analyzers.Tests.AnalyzerTestHelpers;

namespace SeventySix.Analyzers.Tests;

/// <summary>
/// Tests for SS005 - Lambda argument newline analyzer.
/// Enforces block lambdas to start on new line after opening paren.
/// Follows 80/20 rule: critical paths only.
/// </summary>
public class LambdaArgumentNewlineAnalyzerTests
{
	[Fact]
	public async Task BlockLambdaInline_WithMethodCall_ShouldReportDiagnosticAsync()
	{
		const string testCode = """
			using System;
			using System.Collections.Generic;
			class TestClass
			{
				void TestMethod()
				{
					List<int> numbers = new List<int>();
					numbers.ForEach(number => {
						Console.WriteLine(number);
					});
				}
			}
			""";

		await VerifyAnalyzerAsync<LambdaArgumentNewlineAnalyzer>(
			testCode,
			ExpectSS005(line: 8, column: 19));
	}

	[Fact]
	public async Task BlockLambdaOnNewLine_WithMethodCall_ShouldNotReportAsync()
	{
		const string testCode = """
			using System;
			using System.Collections.Generic;
			class TestClass
			{
				void TestMethod()
				{
					List<int> numbers = new List<int>();
					numbers.ForEach(
						number =>
						{
							Console.WriteLine(number);
						});
				}
			}
			""";

		await VerifyNoDiagnosticsAsync<LambdaArgumentNewlineAnalyzer>(testCode);
	}

	[Fact]
	public async Task ExpressionLambda_WithSelect_ShouldNotReportAsync()
	{
		const string testCode = """
			using System.Linq;
			using System.Collections.Generic;
			class TestClass
			{
				void TestMethod()
				{
					List<int> numbers = new List<int> { 1, 2, 3 };
					var result = numbers.Select(number => number * 2);
				}
			}
			""";

		await VerifyNoDiagnosticsAsync<LambdaArgumentNewlineAnalyzer>(testCode);
	}

	[Fact]
	public async Task ExpressionLambda_WithWhere_ShouldNotReportAsync()
	{
		const string testCode = """
			using System.Linq;
			using System.Collections.Generic;
			class TestClass
			{
				void TestMethod()
				{
					List<int> numbers = new List<int> { 1, 2, 3 };
					var result = numbers.Where(number => number > 1);
				}
			}
			""";

		await VerifyNoDiagnosticsAsync<LambdaArgumentNewlineAnalyzer>(testCode);
	}

	[Fact]
	public async Task ParenthesizedBlockLambdaInline_ShouldReportDiagnosticAsync()
	{
		const string testCode = """
			using System;
			class TestClass
			{
				void TestMethod()
				{
					Process((first, second) => {
						Console.WriteLine(first + second);
					});
				}

				void Process(Action<int, int> action) { }
			}
			""";

		await VerifyAnalyzerAsync<LambdaArgumentNewlineAnalyzer>(
			testCode,
			ExpectSS005(line: 6, column: 11));
	}

	[Fact]
	public async Task SingleLineBlockLambda_WithTrivialBody_ShouldNotReportAsync()
	{
		// Edge case: single-line block lambda with trivial body is OK
		const string testCode = """
			using System;
			using System.Collections.Generic;
			class TestClass
			{
				void TestMethod()
				{
					List<int> numbers = new List<int>();
					numbers.ForEach(number => { });
				}
			}
			""";

		await VerifyNoDiagnosticsAsync<LambdaArgumentNewlineAnalyzer>(testCode);
	}
}