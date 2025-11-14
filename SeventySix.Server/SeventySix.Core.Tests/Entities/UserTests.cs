// <copyright file="UserTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using SeventySix.Core.Entities;

namespace SeventySix.Core.Tests.Entities;

/// <summary>
/// Unit tests for the User domain entity.
/// Tests entity initialization, properties, and business rules.
/// </summary>
/// <remarks>
/// Following TDD principles:
/// - Test entity creation with valid data
/// - Test default values
/// - Test property assignments
/// - Test business rule enforcement
///
/// Coverage Focus:
/// - Entity initialization
/// - Property get/set operations
/// - Default values (CreatedAt, IsActive)
/// </remarks>
public class UserTests
{
	[Fact]
	public void User_ShouldInitializeWithDefaultValues()
	{
		// Arrange & Act
		User user = new();

		// Assert
		Assert.Equal(0, user.Id);
		Assert.Equal(string.Empty, user.Username);
		Assert.Equal(string.Empty, user.Email);
		Assert.Null(user.FullName);
		Assert.True(user.IsActive);
		Assert.True(user.CreatedAt <= DateTime.UtcNow);
		Assert.True(user.CreatedAt > DateTime.UtcNow.AddSeconds(-1));
	}

	[Fact]
	public void User_ShouldSetAndGetProperties()
	{
		// Arrange
		DateTime createdAt = DateTime.UtcNow.AddDays(-10);
		User user = new()
		{
			Id = 123,
			Username = "john_doe",
			Email = "john@example.com",
			FullName = "John Doe",
			CreatedAt = createdAt,
			IsActive = false,
		};

		// Assert
		Assert.Equal(123, user.Id);
		Assert.Equal("john_doe", user.Username);
		Assert.Equal("john@example.com", user.Email);
		Assert.Equal("John Doe", user.FullName);
		Assert.Equal(createdAt, user.CreatedAt);
		Assert.False(user.IsActive);
	}

	[Fact]
	public void User_ShouldAllowNullFullName()
	{
		// Arrange & Act
		User user = new()
		{
			Username = "test_user",
			Email = "test@example.com",
			FullName = null,
		};

		// Assert
		Assert.Null(user.FullName);
	}

	[Fact]
	public void User_ShouldAllowEmptyFullName()
	{
		// Arrange & Act
		User user = new()
		{
			Username = "test_user",
			Email = "test@example.com",
			FullName = string.Empty,
		};

		// Assert
		Assert.Equal(string.Empty, user.FullName);
	}

	[Fact]
	public void User_ShouldSetIsActiveToTrue_ByDefault()
	{
		// Arrange & Act
		User user = new();

		// Assert
		Assert.True(user.IsActive);
	}

	[Fact]
	public void User_ShouldAllowSettingIsActiveToFalse()
	{
		// Arrange & Act
		User user = new() { IsActive = false };

		// Assert
		Assert.False(user.IsActive);
	}

	[Fact]
	public void User_CreatedAt_ShouldBeSetToUtcNow_ByDefault()
	{
		// Arrange
		DateTime beforeCreation = DateTime.UtcNow;

		// Act
		User user = new();

		// Assert
		DateTime afterCreation = DateTime.UtcNow;
		Assert.InRange(user.CreatedAt, beforeCreation, afterCreation);
		Assert.Equal(DateTimeKind.Utc, user.CreatedAt.Kind);
	}

	[Fact]
	public void User_ShouldAllowOverridingCreatedAt()
	{
		// Arrange
		DateTime specificDate = new(2024, 1, 1, 12, 0, 0, DateTimeKind.Utc);

		// Act
		User user = new() { CreatedAt = specificDate };

		// Assert
		Assert.Equal(specificDate, user.CreatedAt);
	}

	[Theory]
	[InlineData("")]
	[InlineData("a")]
	[InlineData("user123")]
	[InlineData("john_doe_smith")]
	[InlineData("a_very_long_username_that_might_exceed_limits")]
	public void User_ShouldAcceptVariousUsernameFormats(string username)
	{
		// Arrange & Act
		User user = new() { Username = username };

		// Assert
		Assert.Equal(username, user.Username);
	}

	[Theory]
	[InlineData("")]
	[InlineData("test@example.com")]
	[InlineData("user.name+tag@example.co.uk")]
	[InlineData("invalid-email")]
	public void User_ShouldAcceptVariousEmailFormats(string email)
	{
		// Arrange & Act
		// Note: Entity doesn't validate format; that's validation layer's job
		User user = new() { Email = email };

		// Assert
		Assert.Equal(email, user.Email);
	}

	[Fact]
	public void User_ShouldSupportPropertyUpdates()
	{
		// Arrange
		User user = new()
		{
			Username = "old_username",
			Email = "old@example.com",
			IsActive = true,
		};

		// Act
		user.Username = "new_username";
		user.Email = "new@example.com";
		user.IsActive = false;

		// Assert
		Assert.Equal("new_username", user.Username);
		Assert.Equal("new@example.com", user.Email);
		Assert.False(user.IsActive);
	}
}