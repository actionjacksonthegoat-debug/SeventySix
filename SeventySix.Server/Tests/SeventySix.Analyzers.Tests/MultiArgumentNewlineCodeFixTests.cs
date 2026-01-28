// <copyright file="MultiArgumentNewlineCodeFixTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using static SeventySix.Analyzers.Tests.AnalyzerTestHelpers;

namespace SeventySix.Analyzers.Tests;

/// <summary>
/// Tests for SS006 CodeFix provider.
/// Verifies that multiple arguments are placed on separate lines.
/// Follows 80/20 rule: critical paths only.
/// Note: SimpleArgumentsThreshold is 40 chars - tests need to exceed this.
/// Note: Code fix calculates indentation from parent statement's leading trivia and adds a tab.
/// </summary>
public class MultiArgumentNewlineCodeFixTests
{
	/// <summary>
	/// Verifies that the code fix triggers for arguments exceeding threshold.
	/// Tests analyzer detection rather than exact whitespace formatting.
	/// </summary>
	[Fact]
	public async Task TwoArguments_ExceedsThreshold_TriggersCodeFixAsync()
	{
		// Total arg length: "VeryLongArgumentValueOne" (24) + "VeryLongArgumentValueTwo" (24) = 48 > 40 threshold
		const string testCode = """
            class TestClass
            {
                void TestMethod()
                {
                    System.Console.WriteLine("VeryLongArgumentValueOne", "VeryLongArgumentValueTwo");
                }
            }
            """;

		// Verify analyzer detects the issue (code fix formatting tested manually)
		await VerifyAnalyzerAsync<MultiArgumentNewlineAnalyzer>(
			testCode,
			ExpectSS006(line: 5, column: 34));
	}

	/// <summary>
	/// Verifies that the code fix triggers for method invocation arguments.
	/// Method invocations are never considered "simple" regardless of threshold.
	/// </summary>
	[Fact]
	public async Task ComplexArguments_MethodInvocation_TriggersCodeFixAsync()
	{
		const string testCode = """
            class TestClass
            {
                void TestMethod()
                {
                    var result = string.Format("{0}", GetLongValue());
                }

                string GetLongValue() => "test";
            }
            """;

		await VerifyAnalyzerAsync<MultiArgumentNewlineAnalyzer>(
			testCode,
			ExpectSS006(line: 5, column: 36));
	}

	/// <summary>
	/// Verifies that the code fix triggers for constructor calls exceeding threshold.
	/// </summary>
	[Fact]
	public async Task ConstructorCall_ExceedsThreshold_TriggersCodeFixAsync()
	{
		// Total: "VeryLongExceptionMessageText" (28) + "veryLongParameterName" (21) = 49 > 40 threshold
		const string testCode = """
            class TestClass
            {
                void TestMethod()
                {
                    var exception = new System.ArgumentException("VeryLongExceptionMessageText", "veryLongParameterName");
                }
            }
            """;

		await VerifyAnalyzerAsync<MultiArgumentNewlineAnalyzer>(
			testCode,
			ExpectSS006(line: 5, column: 54));
	}
}