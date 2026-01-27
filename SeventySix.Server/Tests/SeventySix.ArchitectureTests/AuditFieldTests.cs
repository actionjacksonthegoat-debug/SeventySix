// <copyright file="AuditFieldTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;
using Shouldly;
using Xunit;

namespace SeventySix.ArchitectureTests;

/// <summary>
/// Tests that enforce audit field standards.
/// Rules:
/// - CreatedBy and ModifiedBy must be strings (usernames), not int FKs
/// - Audit fields should follow consistent naming (CreateDate, ModifyDate, CreatedBy, ModifiedBy).
/// </summary>
public class AuditFieldTests : SourceCodeArchitectureTest
{
	[Fact]
	public void Audit_Fields_Should_Be_Strings_Not_Foreign_Keys()
	{
		// Arrange
		IEnumerable<string> entityFiles =
			GetSourceFiles("*.cs")
			.Where(f =>
				f.Contains("\\Models\\")
				&& !f.Contains("Dto")
				&& !f.Contains("Request")
				&& !f.Contains("Response"))
			.ToList();

		// Match: public int CreatedBy or public int ModifiedBy
		Regex intAuditFieldPattern =
			new Regex(
			@"public\s+int\s+(CreatedBy|ModifiedBy)",
			RegexOptions.Compiled);

		List<string> violations = [];

		// Act
		foreach (string file in entityFiles)
		{
			string content =
				ReadFileContent(file);

			MatchCollection matches =
				intAuditFieldPattern.Matches(content);

			if (matches.Count > 0)
			{
				string relativePath =
					GetRelativePath(file);

				string[] fields =
					matches
					.Cast<Match>()
					.Select(m => m.Groups[1].Value)
					.Distinct()
					.ToArray();

				violations.Add(
					$"{relativePath}: {string.Join(", ", fields)} (should be string, not int FK)");
			}
		}

		// Assert
		violations.ShouldBeEmpty();
	}

	[Fact]
	public void Entities_With_Audit_Fields_Should_Have_Consistent_Naming()
	{
		// Arrange
		IEnumerable<string> entityFiles =
			GetSourceFiles("*.cs")
			.Where(f =>
				f.Contains("\\Models\\")
				&& !f.Contains("Dto")
				&& !f.Contains("Request")
				&& !f.Contains("Response"))
			.ToList();

		// Check for inconsistent patterns like CreatedDate vs CreateDate
		Regex inconsistentDatePattern =
			new Regex(
			@"public\s+DateTime\??\s+(CreatedDate|ModifiedDate)",
			RegexOptions.Compiled);

		List<string> violations = [];

		// Act
		foreach (string file in entityFiles)
		{
			string content =
				ReadFileContent(file);

			MatchCollection matches =
				inconsistentDatePattern.Matches(content);

			if (matches.Count > 0)
			{
				string relativePath =
					GetRelativePath(file);

				string[] fields =
					matches
					.Cast<Match>()
					.Select(m => m.Groups[1].Value)
					.Distinct()
					.ToArray();

				violations.Add(
					$"{relativePath}: {string.Join(", ", fields)}"
						+ " (use CreateDate/ModifyDate, not CreatedDate/ModifiedDate)");
			}
		}

		// Assert
		violations.ShouldBeEmpty();
	}
}