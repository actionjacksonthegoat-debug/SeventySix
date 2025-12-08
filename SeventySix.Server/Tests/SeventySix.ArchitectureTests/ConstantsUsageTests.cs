// <copyright file="ConstantsUsageTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;
using Xunit;

namespace SeventySix.ArchitectureTests;

/// <summary>
/// Tests that enforce constants usage instead of hardcoded strings.
/// Rules:
/// - No hardcoded role names ("Admin", "Developer") in code (excluding comments/seed data)
/// - No hardcoded API endpoints in tests
/// - Use RoleConstants, ClaimConstants, ApiEndpoints.
/// </summary>
/// <remarks>
/// Note: "User" is excluded because it's ambiguous - often used as entity name in exceptions.
/// Configuration files are excluded as they define seed data (source of truth).
/// XML documentation comments are excluded as they're examples only.
/// </remarks>
public class ConstantsUsageTests : SourceCodeArchitectureTest
{
	/// <summary>
	/// Role strings that should use RoleConstants.
	/// Note: "User" excluded - ambiguous with entity name usage.
	/// </summary>
	private static readonly string[] HardcodedRoles =
		[
			"\"Admin\"",
			"\"Developer\""
		];

	[Fact]
	public void Production_Code_Should_Not_Have_Hardcoded_Role_Strings()
	{
		// Arrange
		IEnumerable<string> csFiles =
			GetSourceFiles("*.cs")
				.Where(file => !file.Contains("Configuration.cs")); // Exclude seed data definitions

		List<string> violations = [];

		// Act
		foreach (string file in csFiles)
		{
			string content =
				ReadFileContent(file);

			// Skip if file uses RoleConstants (it's compliant)
			if (content.Contains("RoleConstants."))
			{
				continue;
			}

			// Remove XML documentation comments before checking
			string codeWithoutComments =
				Regex.Replace(
					content,
					@"^\s*///.*$",
					string.Empty,
					RegexOptions.Multiline);

			foreach (string hardcodedRole in HardcodedRoles)
			{
				if (codeWithoutComments.Contains(hardcodedRole))
				{
					string relativePath =
						GetRelativePath(file);

					violations.Add($"{relativePath}: Contains {hardcodedRole} (use RoleConstants)");
					break; // Only report once per file
				}
			}
		}

		// Assert
		Assert.Empty(violations);
	}

	[Fact]
	public void Test_Code_Should_Not_Have_Hardcoded_Api_Endpoints()
	{
		// Arrange
		IEnumerable<string> testFiles =
			GetSourceFiles("*.cs")
				.Where(f => f.Contains("\\Tests\\") && f.EndsWith("Tests.cs"))
				.ToList();

		// Match: "/api/something" or "/auth/something"
		Regex endpointPattern =
			new Regex(
				@"""/(api|auth|admin|health)/[^""]+""",
				RegexOptions.Compiled | RegexOptions.IgnoreCase);

		List<string> violations = [];

		// Act
		foreach (string file in testFiles)
		{
			string content =
				ReadFileContent(file);

			// Skip if file uses ApiEndpoints (it's compliant)
			if (content.Contains("ApiEndpoints.") || content.Contains("TestEndpoints."))
			{
				continue;
			}

			MatchCollection matches =
				endpointPattern.Matches(content);

			if (matches.Count > 0)
			{
				string relativePath =
					GetRelativePath(file);

				string[] endpoints =
					matches.Cast<Match>()
						.Select(m => m.Value)
						.Distinct()
						.ToArray();

				violations.Add(
					$"{relativePath}: {string.Join(", ", endpoints)}"
						+ " (use ApiEndpoints constants)");
			}
		}

		// Assert
		Assert.Empty(violations);
	}
}