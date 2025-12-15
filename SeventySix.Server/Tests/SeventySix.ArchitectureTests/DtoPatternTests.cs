// <copyright file="DtoPatternTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Collections.Generic;
using System.Text.RegularExpressions;
using Xunit;

namespace SeventySix.ArchitectureTests;

/// <summary>
/// Tests that enforce DTO pattern standards.
/// Rules:
/// - DTOs must be records
/// - DTOs must use positional parameters (primary constructors).
/// </summary>
public class DtoPatternTests : SourceCodeArchitectureTest
{
	[Fact]
	public void Dtos_ShouldBeRecords()
	{
		// Arrange
		IEnumerable<string> csFiles =
			GetSourceFiles("*.cs");

		Regex dtoClassPattern =
			new Regex(
				@"public\s+class\s+\w+Dto\b",
				RegexOptions.Compiled);

		List<string> violations = [];

		// Act
		foreach (string file in csFiles)
		{
			string content =
				ReadFileContent(file);

			MatchCollection matches =
				dtoClassPattern.Matches(content);

			if (matches.Count > 0)
			{
				string relativePath =
					GetRelativePath(file);

				foreach (Match match in matches)
				{
					violations.Add($"{relativePath}: {match.Value}");
				}
			}
		}

		// Assert
		Assert.Empty(violations);
	}

	[Fact]
	public void Dtos_ShouldUsePositionalParameters()
	{
		// Arrange
		IEnumerable<string> csFiles =
			GetSourceFiles("*.cs");

		// Match: "public record SomeDto" but NOT "public record SomeDto("
		Regex dtoRecordWithoutParamsPattern =
			new Regex(
				@"public\s+record\s+(\w+Dto)\s*\{",
				RegexOptions.Compiled);

		List<string> violations = [];

		// Act
		foreach (string file in csFiles)
		{
			string content =
				ReadFileContent(file);

			MatchCollection matches =
				dtoRecordWithoutParamsPattern.Matches(content);

			if (matches.Count > 0)
			{
				string relativePath =
					GetRelativePath(file);

				foreach (Match match in matches)
				{
					string dtoName =
						match.Groups[1].Value;

					violations.Add($"{relativePath}: {dtoName} (should use positional parameters)");
				}
			}
		}

		// Assert
		Assert.Empty(violations);
	}
}
