// <copyright file="GodMethodTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.RegularExpressions;
using Xunit;

namespace SeventySix.ArchitectureTests;

/// <summary>
/// Architectural tests to prevent god methods.
/// Methods with 80+ lines violate SRP and must be split.
/// </summary>
/// <remarks>
/// Per CLAUDE.md and copilot-instructions.md:
/// - Under 80 lines: OK - focused method
/// - 80+ lines: MUST SPLIT - violates single responsibility
/// Counts non-blank, non-comment lines only.
/// </remarks>
public class GodMethodTests : SourceCodeArchitectureTest
{
	/// <summary>
	/// Maximum allowed lines per method before requiring split.
	/// </summary>
	private const int MaxLinesPerMethod = 79;

	/// <summary>
	/// Methods that are explicitly allowed to exceed the line limit.
	/// These are technical debt items to be refactored.
	/// </summary>
	private static readonly HashSet<string> AllowedExceptions =
		[
			// No exceptions - all methods must follow the 80-line rule
		];

	[Fact]
	public void All_Methods_Should_Be_Under_80_Lines()
	{
		// Arrange
		IEnumerable<string> sourceFiles = GetAllSourceFiles();
		List<string> godMethodViolations = [];

		// Act
		foreach (string filePath in sourceFiles)
		{
			string fileContent = ReadFileContent(filePath);
			string relativePath = GetRelativePath(filePath);

			List<MethodInfo> methods = FindAllMethods(fileContent);

			foreach (MethodInfo method in methods)
			{
				string methodIdentifier =
					$"{relativePath}::{method.Name}";

				if (AllowedExceptions.Contains(methodIdentifier))
				{
					continue;
				}

				int lineCount =
					CountMethodLines(
						fileContent,
						method.StartIndex);

				if (lineCount > MaxLinesPerMethod)
				{
					godMethodViolations.Add(
						$"{methodIdentifier}: {lineCount} lines (max {MaxLinesPerMethod})");
				}
			}
		}

		// Assert - output violations for debugging
		if (godMethodViolations.Count > 0)
		{
			string violations = string.Join("\n", godMethodViolations);
			throw new Xunit.Sdk.XunitException($"God method violations found:\n{violations}");
		}

		// Assert
		Assert.Empty(godMethodViolations);
	}

	private static readonly Regex MethodDeclarationRegex =
		new(
			@"^\s*(?:public|private|protected|internal|static|virtual|override|async|sealed|\s)+\s+(?:\w+(?:<[^>]+>)?(?:\?)?(?:\[\])?)\s+(\w+)\s*\([^)]*\)\s*(?:where[^{]*)?{",
			RegexOptions.Multiline | RegexOptions.Compiled);

	private static List<MethodInfo> FindAllMethods(string fileContent)
	{
		List<MethodInfo> methods = [];
		MatchCollection matches = MethodDeclarationRegex.Matches(fileContent);

		foreach (Match match in matches)
		{
			MethodInfo? method = TryCreateMethodInfo(match);
			if (method != null)
			{
				methods.Add(method);
			}
		}

		return methods;
	}

	private static MethodInfo? TryCreateMethodInfo(Match match)
	{
		string matchText = match.Value;

		// Skip class/struct/record primary constructors
		if (matchText.Contains("class ") || matchText.Contains("struct ") || matchText.Contains("record "))
		{
			return null;
		}

		string methodName = match.Groups[1].Value;
		if (methodName is "get" or "set" or "init")
		{
			return null;
		}

		return new MethodInfo { Name = methodName, StartIndex = match.Index };
	}

	private static int CountMethodLines(
		string fileContent,
		int methodStartIndex)
	{
		int openingBraceIndex = FindOpeningBrace(fileContent, methodStartIndex);
		if (openingBraceIndex < 0)
		{
			return 0;
		}

		return CountLinesInMethodBody(fileContent, openingBraceIndex);
	}

	private static int FindOpeningBrace(string content, int startIndex)
	{
		for (int i = startIndex; i < content.Length; i++)
		{
			if (content[i] == '{')
			{
				return i + 1;
			}
		}

		return -1;
	}

	private static int CountLinesInMethodBody(string content, int startIndex)
	{
		int braceDepth = 1;
		int nonBlankLineCount = 0;
		int currentLineStart = startIndex;

		for (int i = startIndex; i < content.Length; i++)
		{
			char c = content[i];

			if (c == '{')
			{
				braceDepth++;
			}
			else if (c == '}')
			{
				braceDepth--;
				if (braceDepth == 0)
				{
					nonBlankLineCount += CountLineIfNotBlank(content, currentLineStart, i);
					break;
				}
			}
			else if (c == '\n')
			{
				nonBlankLineCount += CountLineIfNotBlank(content, currentLineStart, i);
				currentLineStart = i + 1;
			}
		}

		return nonBlankLineCount;
	}

	private static int CountLineIfNotBlank(string content, int start, int end)
	{
		string line = content.Substring(start, end - start).Trim();
		return !string.IsNullOrWhiteSpace(line) && !line.StartsWith("//") ? 1 : 0;
	}

	private sealed class MethodInfo
	{
		public string Name { get; init; } = string.Empty;

		public int StartIndex
		{
			get; init;
		}
	}
}