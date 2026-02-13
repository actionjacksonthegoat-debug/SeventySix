// <copyright file="IdentityCacheKeysUnitTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Shouldly;

namespace SeventySix.Identity.Tests.Helpers;

/// <summary>
/// Unit tests for <see cref="SeventySix.Identity.IdentityCacheKeys"/>.
/// </summary>
public sealed class IdentityCacheKeysUnitTests
{
	/// <summary>
	/// Verifies UserByEmail generates correct key format.
	/// </summary>
	[Fact]
	public void UserByEmail_ValidEmail_ReturnsExpectedFormat()
	{
		// Arrange
		string email = "test@example.com";

		// Act
		string cacheKey =
			SeventySix.Identity.IdentityCacheKeys.UserByEmail(email);

		// Assert
		cacheKey.ShouldBe("identity:user:email:test@example.com");
	}

	/// <summary>
	/// Verifies UserByEmail sanitizes special characters.
	/// </summary>
	[Fact]
	public void UserByEmail_SpecialCharacters_SanitizesKey()
	{
		// Arrange
		string email = "Test:User@Example.Com";

		// Act
		string cacheKey =
			SeventySix.Identity.IdentityCacheKeys.UserByEmail(email);

		// Assert
		cacheKey.ShouldBe("identity:user:email:test_user@example.com");
	}

	/// <summary>
	/// Verifies UserByUsername generates correct key format.
	/// </summary>
	[Fact]
	public void UserByUsername_ValidUsername_ReturnsExpectedFormat()
	{
		// Arrange
		string username = "johndoe";

		// Act
		string cacheKey =
			SeventySix.Identity.IdentityCacheKeys.UserByUsername(username);

		// Assert
		cacheKey.ShouldBe("identity:user:username:johndoe");
	}

	/// <summary>
	/// Verifies UserByUsername sanitizes special characters.
	/// </summary>
	[Fact]
	public void UserByUsername_SpecialCharacters_SanitizesKey()
	{
		// Arrange
		string username = "John:Doe User";

		// Act
		string cacheKey =
			SeventySix.Identity.IdentityCacheKeys.UserByUsername(username);

		// Assert
		cacheKey.ShouldBe("identity:user:username:john_doe_user");
	}

	/// <summary>
	/// Verifies UserById generates correct key format.
	/// </summary>
	[Fact]
	public void UserById_ValidId_ReturnsExpectedFormat()
	{
		// Arrange
		long userId = 123;

		// Act
		string cacheKey =
			SeventySix.Identity.IdentityCacheKeys.UserById(userId);

		// Assert
		cacheKey.ShouldBe("identity:user:123");
	}

	/// <summary>
	/// Verifies UserProfile generates correct key format.
	/// </summary>
	[Fact]
	public void UserProfile_ValidId_ReturnsExpectedFormat()
	{
		// Arrange
		long userId = 456;

		// Act
		string cacheKey =
			SeventySix.Identity.IdentityCacheKeys.UserProfile(userId);

		// Assert
		cacheKey.ShouldBe("identity:profile:456");
	}

	/// <summary>
	/// Verifies UserRoles generates correct key format.
	/// </summary>
	[Fact]
	public void UserRoles_ValidId_ReturnsExpectedFormat()
	{
		// Arrange
		long userId = 789;

		// Act
		string cacheKey =
			SeventySix.Identity.IdentityCacheKeys.UserRoles(userId);

		// Assert
		cacheKey.ShouldBe("identity:user-roles:789");
	}

	/// <summary>
	/// Verifies AllUsers generates correct key format.
	/// </summary>
	[Fact]
	public void AllUsers_ReturnsExpectedFormat()
	{
		// Act
		string cacheKey =
			SeventySix.Identity.IdentityCacheKeys.AllUsers();

		// Assert
		cacheKey.ShouldBe("identity:all-users");
	}
}