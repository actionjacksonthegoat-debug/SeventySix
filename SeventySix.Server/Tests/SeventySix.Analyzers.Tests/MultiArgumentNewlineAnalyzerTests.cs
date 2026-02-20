// <copyright file="MultiArgumentNewlineAnalyzerTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using static SeventySix.Analyzers.Tests.AnalyzerTestHelpers;

namespace SeventySix.Analyzers.Tests;

/// <summary>
/// Tests for SS006 - Multi-argument newline analyzer.
/// Enforces 2+ arguments to be on separate lines.
/// Follows 80/20 rule: critical paths only.
/// </summary>
public sealed class MultiArgumentNewlineAnalyzerTests
{
	[Fact]
	public async Task TwoArguments_OnSameLine_ShouldReportDiagnosticAsync()
	{
		const string testCode = """
			class TestClass
			{
				void TestMethod()
				{
					Process(GetFirstValue(), GetSecondValue());
				}

				void Process(int first, int second) { }
				int GetFirstValue() => 1;
				int GetSecondValue() => 2;
			}
			""";

		await VerifyAnalyzerAsync<MultiArgumentNewlineAnalyzer>(
			testCode,
			ExpectSS006(line: 5, column: 11));
	}

	[Fact]
	public async Task TwoArguments_OnSeparateLines_ShouldNotReportAsync()
	{
		const string testCode = """
			class TestClass
			{
				void TestMethod()
				{
					int firstArgument = 1;
					int secondArgument = 2;
					Process(
						firstArgument,
						secondArgument);
				}

				void Process(int first, int second) { }
			}
			""";

		await VerifyNoDiagnosticsAsync<MultiArgumentNewlineAnalyzer>(testCode);
	}

	[Fact]
	public async Task SingleArgument_ShouldNotReportAsync()
	{
		const string testCode = """
			class TestClass
			{
				void TestMethod()
				{
					int singleArgument = 1;
					Process(singleArgument);
				}

				void Process(int value) { }
			}
			""";

		await VerifyNoDiagnosticsAsync<MultiArgumentNewlineAnalyzer>(testCode);
	}

	[Fact]
	public async Task EmptyArgumentList_ShouldNotReportAsync()
	{
		const string testCode = """
			class TestClass
			{
				void TestMethod()
				{
					Process();
				}

				void Process() { }
			}
			""";

		await VerifyNoDiagnosticsAsync<MultiArgumentNewlineAnalyzer>(testCode);
	}

	[Fact]
	public async Task ShortSimpleArguments_ShouldNotReportAsync()
	{
		// Short identifiers under threshold are allowed on same line
		const string testCode = """
			class TestClass
			{
				void TestMethod()
				{
					int valueX = 1;
					int valueY = 2;
					Process(valueX, valueY);
				}

				void Process(int first, int second) { }
			}
			""";

		await VerifyNoDiagnosticsAsync<MultiArgumentNewlineAnalyzer>(testCode);
	}

	[Fact]
	public async Task MethodCallWithLongArguments_ShouldReportDiagnosticAsync()
	{
		const string testCode = """
			class TestClass
			{
				void TestMethod()
				{
					int veryLongArgumentName = 1;
					int anotherLongArgumentName = 2;
					Process(veryLongArgumentName, anotherLongArgumentName);
				}

				void Process(int first, int second) { }
			}
			""";

		await VerifyAnalyzerAsync<MultiArgumentNewlineAnalyzer>(
			testCode,
			ExpectSS006(line: 7, column: 11));
	}
}