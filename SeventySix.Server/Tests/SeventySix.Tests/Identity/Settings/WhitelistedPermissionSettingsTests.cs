// <copyright file="WhitelistedPermissionSettingsTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using SeventySix.Identity;
using Shouldly;

namespace SeventySix.Tests.Identity.Settings;

/// <summary>
/// Unit tests for WhitelistedPermissionSettings.
/// Focus: IsWhitelisted method validation.
/// </summary>
public class WhitelistedPermissionSettingsTests
{
	[Fact]
	public void IsWhitelisted_ReturnsTrue_WhenEmailAndRoleMatch()
	{
		// Arrange
		WhitelistedPermissionSettings settings =
			new()
			{
				Grants =
				[
					new WhitelistedGrant
					{
						Email = "dev@company.com",
						Roles = ["Developer"]
					}
				]
			};

		// Act
		bool result =
			settings.IsWhitelisted(
				"dev@company.com",
				"Developer");

		// Assert
		result.ShouldBeTrue();
	}

	[Fact]
	public void IsWhitelisted_ReturnsTrue_WhenEmailMatchesCaseInsensitive()
	{
		// Arrange
		WhitelistedPermissionSettings settings =
			new()
			{
				Grants =
				[
					new WhitelistedGrant
					{
						Email = "dev@company.com",
						Roles = ["Developer"]
					}
				]
			};

		// Act
		bool result =
			settings.IsWhitelisted(
				"DEV@COMPANY.COM",
				"Developer");

		// Assert
		result.ShouldBeTrue();
	}

	[Fact]
	public void IsWhitelisted_ReturnsTrue_WhenRoleMatchesCaseInsensitive()
	{
		// Arrange
		WhitelistedPermissionSettings settings =
			new()
			{
				Grants =
				[
					new WhitelistedGrant
					{
						Email = "dev@company.com",
						Roles = ["Developer"]
					}
				]
			};

		// Act
		bool result =
			settings.IsWhitelisted(
				"dev@company.com",
				"DEVELOPER");

		// Assert
		result.ShouldBeTrue();
	}

	[Fact]
	public void IsWhitelisted_ReturnsFalse_WhenEmailDoesNotMatch()
	{
		// Arrange
		WhitelistedPermissionSettings settings =
			new()
			{
				Grants =
				[
					new WhitelistedGrant
					{
						Email = "dev@company.com",
						Roles = ["Developer"]
					}
				]
			};

		// Act
		bool result =
			settings.IsWhitelisted(
				"other@company.com",
				"Developer");

		// Assert
		result.ShouldBeFalse();
	}

	[Fact]
	public void IsWhitelisted_ReturnsFalse_WhenRoleDoesNotMatch()
	{
		// Arrange
		WhitelistedPermissionSettings settings =
			new()
			{
				Grants =
				[
					new WhitelistedGrant
					{
						Email = "dev@company.com",
						Roles = ["Developer"]
					}
				]
			};

		// Act
		bool result =
			settings.IsWhitelisted(
				"dev@company.com",
				"Admin");

		// Assert
		result.ShouldBeFalse();
	}

	[Fact]
	public void IsWhitelisted_ReturnsFalse_WhenGrantsEmpty()
	{
		// Arrange
		WhitelistedPermissionSettings settings =
			new()
			{
				Grants = []
			};

		// Act
		bool result =
			settings.IsWhitelisted(
				"dev@company.com",
				"Developer");

		// Assert
		result.ShouldBeFalse();
	}

	[Fact]
	public void IsWhitelisted_ReturnsTrue_WhenUserHasMultipleRoles()
	{
		// Arrange
		WhitelistedPermissionSettings settings =
			new()
			{
				Grants =
				[
					new WhitelistedGrant
					{
						Email = "admin@company.com",
						Roles = ["Developer", "Admin"]
					}
				]
			};

		// Act
		bool developerResult =
			settings.IsWhitelisted(
				"admin@company.com",
				"Developer");
		bool adminResult =
			settings.IsWhitelisted(
				"admin@company.com",
				"Admin");

		// Assert
		developerResult.ShouldBeTrue();
		adminResult.ShouldBeTrue();
	}
}