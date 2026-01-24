// <copyright file="GodMethodTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Collections.Generic;
using System.Text.RegularExpressions;
using Shouldly;
using Xunit;

namespace SeventySix.ArchitectureTests;

/// <summary>
/// Architectural tests to prevent god methods and enforce SRP.
/// Validates method complexity through line count and parameter count.
/// </summary>
/// <remarks>
/// Per CLAUDE.md and copilot-instructions.md:
/// - Under 80 lines: OK - focused method
/// - 80+ lines: MUST SPLIT - violates single responsibility
/// - Max 6 parameters: Beyond this, consider compound handlers or grouping dependencies
/// Counts non-blank, non-comment lines only.
/// </remarks>
public class GodMethodTests : SourceCodeArchitectureTest
{
	/// <summary>
	/// Maximum allowed lines per method before requiring split.
	/// </summary>
	private const int MaxLinesPerMethod = 79;

	/// <summary>
	/// Maximum allowed parameters for any method before requiring refactoring.
	/// </summary>
	/// <remarks>
	/// 6 parameters is the threshold:
	/// - Message/DTO/Request (1)
	/// - 2-3 repositories/services (2-4)
	/// - CancellationToken (1)
	/// Beyond this, consider compound handlers or grouping dependencies.
	/// </remarks>
	private const int MaxMethodParameters = 6;

	/// <summary>
	/// Methods that are explicitly allowed to exceed the line limit.
	/// These are technical debt items to be refactored.
	/// </summary>
	private static readonly HashSet<string> AllowedLineExceptions =
		[
			// Architecture test self-detection issue - method parser incorrectly counts helper methods
			"Tests\\SeventySix.ArchitectureTests\\GodMethodTests.cs::FindOpeningBrace",
			// Roslyn analyzers - complex AST traversal is inherently long, split would reduce readability
			"SeventySix.Analyzers\\AssignmentContinuationIndentAnalyzer.cs::AnalyzeObjectCreationInitializerBrace",
			"SeventySix.Analyzers.CodeFixes\\AssignmentContinuationIndentCodeFixProvider.cs::CalculateExpectedIndent",
			// Analyzer tests - test methods with large code strings are unavoidably long
			"Tests\\SeventySix.Analyzers.Tests\\AssignmentContinuationIndentCodeFixTests.cs::ExtensionsInitializer_WrongIndent_FixesToCorrectIndentAsync",
			"Tests\\SeventySix.Analyzers.Tests\\AssignmentContinuationIndentCodeFixTests.cs::NestedDictionary_OuterBraceWrong_InnerNotFlaggedAsync",
		];

	/// <summary>
	/// Methods that are explicitly allowed to exceed the parameter limit.
	/// These are technical debt items to be refactored using compound handler pattern.
	/// GREENFIELD CODE: As these are refactored, remove them from this list immediately.
	/// </summary>
	private static readonly HashSet<string> AllowedParameterExceptions =
		[
			// Authentication handlers - Wolverine Injected dependencies
			"SeventySix.Domains\\Identity\\Commands\\ChangePassword\\ChangePasswordCommandHandler.cs::HandleAsync",
			"SeventySix.Domains\\Identity\\Commands\\SetPassword\\SetPasswordCommandHandler.cs::HandleAsync",
			"SeventySix.Domains\\Identity\\Commands\\Register\\RegisterCommandHandler.cs::HandleAsync",
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
			string fileContent =
				ReadFileContent(filePath);
			string relativePath =
				GetRelativePath(filePath);

			List<MethodInfo> methods =
				FindAllMethods(fileContent);

			foreach (MethodInfo method in methods)
			{
				string methodIdentifier =
					$"{relativePath}::{method.Name}";

				if (AllowedLineExceptions.Contains(methodIdentifier))
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

		// Assert
		godMethodViolations.ShouldBeEmpty(
			$"God method violations found (split into smaller methods):\n{string.Join("\n", godMethodViolations)}");
	}

	[Fact]
	public void All_Methods_Should_Have_At_Most_6_Parameters()
	{
		// Arrange
		IEnumerable<string> sourceFiles = GetAllSourceFiles();
		List<string> parameterViolations = [];

		// Act
		foreach (string filePath in sourceFiles)
		{
			string fileContent =
				ReadFileContent(filePath);
			string relativePath =
				GetRelativePath(filePath);

			List<MethodInfo> methods =
				FindAllMethods(fileContent);

			foreach (MethodInfo method in methods)
			{
				string methodIdentifier =
					$"{relativePath}::{method.Name}";

				if (AllowedParameterExceptions.Contains(methodIdentifier))
				{
					continue;
				}

				int parameterCount =
					CountMethodParameters(
					fileContent,
					method.StartIndex);

				if (parameterCount > MaxMethodParameters)
				{
					parameterViolations.Add(
						$"{methodIdentifier}: {parameterCount} parameters (max {MaxMethodParameters})");
				}
			}
		}

		// Assert
		parameterViolations.ShouldBeEmpty(
			$"Parameter explosion violations found (consider compound handler pattern):\n{string.Join("\n", parameterViolations)}");
	}

	private static readonly Regex MethodDeclarationRegex =
		new(
		@"^\s*(?:public|private|protected|internal|static|virtual|override|async|sealed|\s)+\s+(?:\w+(?:<[^>]+>)?(?:\?)?(?:\[\])?)\s+(\w+)\s*\([^)]*\)\s*(?:where[^{]*)?{",
		RegexOptions.Multiline | RegexOptions.Compiled);

	private static List<MethodInfo> FindAllMethods(string fileContent)
	{
		List<MethodInfo> methods = [];
		MatchCollection matches =
			MethodDeclarationRegex.Matches(fileContent);

		foreach (Match match in matches)
		{
			MethodInfo? method =
				TryCreateMethodInfo(match);
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
		if (
			matchText.Contains("class ")
			|| matchText.Contains("struct ")
			|| matchText.Contains("record "))
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
		int openingBraceIndex =
			FindOpeningBrace(fileContent, methodStartIndex);
		if (openingBraceIndex < 0)
		{
			return 0;
		}

		return CountLinesInMethodBody(fileContent, openingBraceIndex);
	}

	private static int FindOpeningBrace(string content, int startIndex)
	{
		for (int charIndex = startIndex; charIndex < content.Length; charIndex++)
		{
			if (content[charIndex] == '{')
			{
				return charIndex + 1;
			}
		}

		return -1;
	}

	private static int CountLinesInMethodBody(string content, int startIndex)
	{
		int braceDepth = 1;
		int nonBlankLineCount = 0;
		int currentLineStart = startIndex;

		for (int charIndex = startIndex; charIndex < content.Length; charIndex++)
		{
			char charValue =
				content[charIndex];

			if (charValue == '{')
			{
				braceDepth++;
			}
			else if (charValue == '}')
			{
				braceDepth--;
				if (braceDepth == 0)
				{
					nonBlankLineCount += CountLineIfNotBlank(
						content,
						currentLineStart,
						charIndex);
					break;
				}
			}
			else if (charValue == '\n')
			{
				nonBlankLineCount += CountLineIfNotBlank(
					content,
					currentLineStart,
					charIndex);
				currentLineStart =
					charIndex + 1;
			}
		}

		return nonBlankLineCount;
	}

	private static int CountLineIfNotBlank(string content, int start, int end)
	{
		string line =
			content.Substring(
				start,
				end - start).Trim();
		return !string.IsNullOrWhiteSpace(line) && !line.StartsWith("//")
			? 1
			: 0;
	}

	private static int CountMethodParameters(
		string fileContent,
		int methodStartIndex)
	{
		int openParenIndex =
			FindOpeningParen(fileContent, methodStartIndex);
		if (openParenIndex < 0)
		{
			return 0;
		}

		int closeParenIndex =
			FindClosingParen(fileContent, openParenIndex);
		if (closeParenIndex < 0)
		{
			return 0;
		}

		string parameterList =
			fileContent
			.Substring(
				openParenIndex + 1,
				closeParenIndex - openParenIndex - 1)
			.Trim();

		if (string.IsNullOrWhiteSpace(parameterList))
		{
			return 0;
		}

		// Count parameters by counting commas at the correct nesting level
		int parameterCount = 1;
		int angleDepth = 0;
		int parenDepth = 0;
		int bracketDepth = 0;

		foreach (char c in parameterList)
		{
			switch (c)
			{
				case '<':
					angleDepth++;
					break;
				case '>':
					angleDepth--;
					break;
				case '(':
					parenDepth++;
					break;
				case ')':
					parenDepth--;
					break;
				case '[':
					bracketDepth++;
					break;
				case ']':
					bracketDepth--;
					break;
				case ','
					when angleDepth == 0
						&& parenDepth == 0
						&& bracketDepth == 0:
					parameterCount++;
					break;
			}
		}

		return parameterCount;
	}

	private static int FindOpeningParen(string content, int startIndex)
	{
		for (int charIndex = startIndex; charIndex < content.Length; charIndex++)
		{
			if (content[charIndex] == '(')
			{
				return charIndex;
			}

			if (content[charIndex] == '{')
			{
				return -1;
			}
		}

		return -1;
	}

	private static int FindClosingParen(string content, int openParenIndex)
	{
		int depth = 1;
		for (int charIndex =
			openParenIndex + 1; charIndex < content.Length; charIndex++)
		{
			if (content[charIndex] == '(')
			{
				depth++;
			}
			else if (content[charIndex] == ')')
			{
				depth--;
				if (depth == 0)
				{
					return charIndex;
				}
			}
		}

		return -1;
	}

	private sealed class MethodInfo
	{
		public string Name { get; init; } = string.Empty;

		public int StartIndex { get; init; }
	}
}