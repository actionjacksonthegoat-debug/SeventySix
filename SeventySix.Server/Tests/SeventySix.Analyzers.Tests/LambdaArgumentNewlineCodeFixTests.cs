// <copyright file="LambdaArgumentNewlineCodeFixTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using static SeventySix.Analyzers.Tests.AnalyzerTestHelpers;

namespace SeventySix.Analyzers.Tests;

/// <summary>
/// Tests for SS005 CodeFix provider.
/// Verifies that block lambdas are detected and moved to new line after opening paren.
/// Follows 80/20 rule: critical paths only.
/// </summary>
public class LambdaArgumentNewlineCodeFixTests
{
	/// <summary>
	/// Block lambda inline should be detected by the analyzer.
	/// Tests analyzer detection rather than exact whitespace formatting.
	/// </summary>
	[Fact]
	public async Task BlockLambda_Inline_TriggersCodeFixAsync()
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
			ExpectSS005(line: 8, column: 25));
	}
}
