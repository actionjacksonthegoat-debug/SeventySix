// <copyright file="NamingConventionTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;
using Xunit;

namespace SeventySix.ArchitectureTests;

/// <summary>
/// Tests that enforce naming conventions across the codebase.
/// Rules:
/// - FK properties must end with Id (e.g., UserId, RoleId)
/// - Audit fields (CreatedBy, ModifiedBy) should be strings, not FKs.
/// </summary>
public class NamingConventionTests : SourceCodeArchitectureTest
{
	[Fact]
	public void Foreign_Key_Properties_Should_End_With_Id()
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

		// Match: public int PropertyName { get; set; }
		// Look for navigation property patterns (User, Role, Parent, etc.)
		Regex navigationPropertyPattern =
			new Regex(
			@"public\s+int\s+(\w+)\s*\{\s*get;\s*set;\s*\}",
			RegexOptions.Compiled);

		List<string> violations = [];

		// Act
		foreach (string file in entityFiles)
		{
			string content =
				ReadFileContent(file);

			MatchCollection matches =
				navigationPropertyPattern.Matches(
				content);

			foreach (Match match in matches)
			{
				string propertyName = match.Groups[1].Value;

				// Skip if it's Id property itself or already ends with Id
				if (propertyName == "Id" || propertyName.EndsWith("Id"))
				{
					continue;
				}

				// Check if there's a corresponding navigation property
				// e.g., if we have "public int User" check for "public User? User"
				bool hasNavigationProperty =
					content.Contains($"public {propertyName}?")
					|| content.Contains($"public {propertyName} ")
					|| content.Contains($"public virtual {propertyName}");

				if (hasNavigationProperty)
				{
					string relativePath =
						GetRelativePath(file);

					violations.Add(
						$"{relativePath}: Property '{propertyName}' (should be '{propertyName}Id')");
				}
			}
		}

		// Assert
		Assert.Empty(violations);
	}
}
