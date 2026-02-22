// <copyright file="EntityConfigurationTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Collections.Generic;
using System.IO;
using System.Linq;
using Shouldly;
using Xunit;

namespace SeventySix.ArchitectureTests;

/// <summary>
/// Tests that enforce entity configuration standards.
/// Rules:
/// - NEVER use data annotations on entities
/// - ALWAYS use Fluent API
/// - All entities must have corresponding EntityConfiguration classes.
/// </summary>
public sealed class EntityConfigurationTests : SourceCodeArchitectureTest
{
	private static readonly string[] DataAnnotations =
		[
		"[Key]",
		"[Required]",
		"[MaxLength",
		"[StringLength",
		"[Column",
		"[Table",
		"[ForeignKey",
		"[Index",
	];

	[Fact]
	public void Entities_ShouldNotUseDataAnnotations()
	{
		// Arrange
		IEnumerable<string> entityFiles =
			GetSourceFiles("*.cs")
			.Where(file =>
				file.Contains("/Models/")
				&& !file.Contains("Dto")
				&& !file.Contains("Request")
				&& !file.Contains("Response")
				&& !file.EndsWith("Settings.cs"));

		List<string> violations = [];

		// Act
		foreach (string file in entityFiles)
		{
			string content =
				ReadFileContent(file);

			foreach (string annotation in DataAnnotations)
			{
				if (content.Contains(annotation))
				{
					string relativePath =
						GetRelativePath(file);

					violations.Add($"{relativePath}: Contains {annotation}");
				}
			}
		}

		// Assert
		violations.ShouldBeEmpty();
	}

	[Fact]
	public void Entities_ShouldHaveFluentApiConfiguration()
	{
		// Arrange
		IEnumerable<string> entityFiles =
			GetSourceFiles("*.cs")
			.Where(file =>
				file.Contains("/Models/")
				&& !file.Contains("Dto")
				&& !file.Contains("Request")
				&& !file.Contains("Response")
				&& !file.Contains("Result")
				&& !file.Contains("OAuth")
				&& !file.EndsWith("Settings.cs"))
			.ToList();

		List<string> violations = [];

		// Act
		foreach (string entityFile in entityFiles)
		{
			string content =
				ReadFileContent(entityFile);

			// Skip if it's not a persisted entity (no DbSet reference expected)
			bool isPersistedEntity =
				content.Contains("public int Id")
				|| content.Contains("public long Id")
				|| content.Contains("public string Id");

			if (!isPersistedEntity)
			{
				continue;
			}

			string entityName =
				Path.GetFileNameWithoutExtension(entityFile);

			string expectedConfigFile =
				entityFile
				.Replace(
					"/Models/",
					"/Data/Configurations/")
				.Replace(
					$"{entityName}.cs",
					$"{entityName}Configuration.cs");

			if (!File.Exists(expectedConfigFile))
			{
				string relativePath =
					GetRelativePath(entityFile);

				violations.Add(
					$"{relativePath}: Missing {entityName}Configuration.cs");
			}
		}

		// Assert
		violations.ShouldBeEmpty();
	}
}