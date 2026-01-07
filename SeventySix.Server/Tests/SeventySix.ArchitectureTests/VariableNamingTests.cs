// <copyright file="VariableNamingTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;
using Xunit;

namespace SeventySix.ArchitectureTests;

/// <summary>
/// Tests that enforce variable naming conventions across the codebase.
/// Rules:
/// - Lambda parameters must be 3+ characters and descriptive
/// - Loop variables must use 'foreach' or descriptive names (not 'i')
/// - All local variables must be 3+ characters
/// Exceptions: FluentValidation 'x =>' in test files only.
/// </summary>
public class VariableNamingTests : SourceCodeArchitectureTest
{
	// FluentValidation idiomatic pattern - allowed in test files ONLY
	private static readonly HashSet<string> AllowedInTestsOnly =
		[
		"x", // FluentValidation: x => x.Property
	];

	[Fact]
	public void Production_Code_Should_Not_Have_Single_Letter_Lambda_Parameters()
	{
		IEnumerable<string> allFiles =
			GetSourceFiles("*.cs").ToList();

		// Lambda patterns - more precise to avoid false positives like copyright (c)
		// Matches: .Where(x => or .Select(t => or (u) => or => x. etc.
		Regex lambdaPattern =
			new Regex(
			@"(?:=>|\.(?:Where|Select|Any|All|First|Single|OrderBy|ThenBy|GroupBy|ToDictionary|Count))\s*\(\s*([a-z])\s*(?:=>|\))",
			RegexOptions.IgnoreCase | RegexOptions.Compiled);

		List<string> violations = [];

		// Act
		foreach (string filePath in allFiles)
		{
			string content =
				ReadFileContent(filePath);
			string relativePath =
				GetRelativePath(filePath);

			MatchCollection matches =
				lambdaPattern.Matches(content);

			foreach (Match match in matches)
			{
				string variableName = match.Groups[1].Value;

				// Single letter found - violation
				if (variableName.Length == 1)
				{
					string contextSnippet =
						GetCodeContext(
						content,
						match.Index);

					violations.Add(
						$"{relativePath}: '{variableName}' in {contextSnippet}");
				}
			}
		}

		// Assert
		if (violations.Count > 0)
		{
			string violationDetails =
				string.Join("\n", violations);
			throw new Xunit.Sdk.XunitException(
				$"Single-letter lambda parameters found in production code:\n{violationDetails}");
		}

		Assert.Empty(violations);
	}

	[Fact]
	public void All_Code_Should_Not_Have_For_Loop_Counters()
	{
		// Arrange - Includes all files (production and test) for consistent naming
		IEnumerable<string> allFiles =
			GetSourceFiles("*.cs").ToList();

		// Pattern: for (int i = or for (var i =
		Regex forLoopPattern =
			new Regex(
			@"for\s*\(\s*(?:int|var)\s+([a-z])\s*=",
			RegexOptions.Compiled);

		List<string> violations = [];

		// Act
		foreach (string filePath in allFiles)
		{
			string content =
				ReadFileContent(filePath);
			string relativePath =
				GetRelativePath(filePath);

			MatchCollection matches =
				forLoopPattern.Matches(content);

			foreach (Match match in matches)
			{
				string loopVariable = match.Groups[1].Value;

				violations.Add(
					$"{relativePath}: for loop with '{loopVariable}' (use foreach or descriptive name)");
			}
		}

		// Assert
		if (violations.Count > 0)
		{
			string violationDetails =
				string.Join("\n", violations);
			throw new Xunit.Sdk.XunitException(
				$"For loop counters found in production code:\n{violationDetails}");
		}

		Assert.Empty(violations);
	}

	private static string GetCodeContext(string content, int matchIndex)
	{
		int contextLength = 50;
		int startIndex =
			Math.Max(0, matchIndex - contextLength);
		int endIndex =
			Math.Min(content.Length, matchIndex + contextLength);

		return content
			.Substring(startIndex, endIndex - startIndex)
			.Replace("\r", string.Empty)
			.Replace("\n", " ")
			.Trim();
	}
}