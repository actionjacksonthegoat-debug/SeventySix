// <copyright file="UserTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.Extensions.Time.Testing;
using SeventySix.Identity;
using SeventySix.TestUtilities.Constants;

namespace SeventySix.Domains.Tests.Identity.Entities;

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
/// - Default values (createDate, IsActive)
/// </remarks>
public class UserTests
{
	/// <summary>
	/// Verifies default property values upon construction.
	/// </summary>
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
		// Note: CreateDate defaults to DateTime.MinValue - AuditInterceptor sets it on SaveChanges
		Assert.Equal(default(DateTime), user.CreateDate);
	}

	/// <summary>
	/// Verifies property getters and setters operate correctly.
	/// </summary>
	[Fact]
	public void User_ShouldSetAndGetProperties()
	{
		// Arrange
		FakeTimeProvider timeProvider = new();
		DateTime createDate =
			timeProvider.GetUtcNow().UtcDateTime.AddDays(-10);
		User user =
			new()
			{
				Id = 123,
				Username = "john_doe",
				Email = "john@example.com",
				FullName = "John Doe",
				CreateDate = createDate,
				IsActive = false,
			};

		// Assert
		Assert.Equal(123, user.Id);
		Assert.Equal("john_doe", user.Username);
		Assert.Equal("john@example.com", user.Email);
		Assert.Equal("John Doe", user.FullName);
		Assert.Equal(createDate, user.CreateDate);
		Assert.False(user.IsActive);
	}

	/// <summary>
	/// Verifies a null FullName is allowed.
	/// </summary>
	[Fact]
	public void User_ShouldAllowNullFullName()
	{
		// Arrange & Act
		User user =
			new()
			{
				Username = "test_user",
				Email = "test@example.com",
				FullName = null,
			};

		// Assert
		Assert.Null(user.FullName);
	}

	/// <summary>
	/// Verifies an empty FullName is allowed.
	/// </summary>
	[Fact]
	public void User_ShouldAllowEmptyFullName()
	{
		// Arrange & Act
		User user =
			new()
			{
				Username = "test_user",
				Email = "test@example.com",
				FullName = string.Empty,
			};

		// Assert
		Assert.Equal(string.Empty, user.FullName);
	}

	/// <summary>
	/// Verifies IsActive defaults to true when constructed.
	/// </summary>
	[Fact]
	public void User_ShouldSetIsActiveToTrue_ByDefault()
	{
		// Arrange & Act
		User user = new();

		// Assert
		Assert.True(user.IsActive);
	}

	/// <summary>
	/// Verifies IsActive can be set to false.
	/// </summary>
	[Fact]
	public void User_ShouldAllowSettingIsActiveToFalse()
	{
		// Arrange & Act
		User user =
			new() { IsActive = false };

		// Assert
		Assert.False(user.IsActive);
	}

	/// <summary>
	/// Verifies CreateDate defaults to min value until interceptor sets it.
	/// </summary>
	[Fact]
	public void User_CreateDate_ShouldDefaultToMinValue_UntilInterceptorSetsIt()
	{
		// Arrange & Act - CreateDate is set by AuditInterceptor on SaveChanges, not during construction
		User user = new();

		// Assert - Default value before interceptor runs
		Assert.Equal(default(DateTime), user.CreateDate);
	}

	/// <summary>
	/// Verifies CreateDate can be explicitly set when needed.
	/// </summary>
	[Fact]
	public void User_ShouldAllowOverridingCreatedAt()
	{
		// Arrange
		DateTime specificDate =
			new DateTimeOffset(2024, 1, 1, 12, 0, 0, TimeSpan.Zero).UtcDateTime;

		// Act
		User user =
			new() { CreateDate = specificDate };

		// Assert
		Assert.Equal(specificDate, user.CreateDate);
	}

	/// <summary>
	/// Verifies various username formats are accepted by the entity.
	/// </summary>
	[Theory]
	[InlineData("")]
	[InlineData("a")]
	[InlineData("user123")]
	[InlineData("john_doe_smith")]
	[InlineData("a_very_long_username_that_might_exceed_limits")]
	public void User_ShouldAcceptVariousUsernameFormats(string username)
	{
		// Arrange & Act
		User user =
			new() { Username = username };

		// Assert
		Assert.Equal(username, user.Username);
	}

	/// <summary>
	/// Verifies various email formats are accepted by the entity (format validation is external).
	/// </summary>
	[Theory]
	[InlineData("")]
	[InlineData("test@example.com")]
	[InlineData("user.name+tag@example.co.uk")]
	[InlineData("invalid-email")]
	public void User_ShouldAcceptVariousEmailFormats(string email)
	{
		// Arrange & Act
		// Note: Entity doesn't validate format; that's validation layer's job
		User user =
			new() { Email = email };

		// Assert
		Assert.Equal(email, user.Email);
	}

	/// <summary>
	/// Verifies properties can be updated after construction.
	/// </summary>
	[Fact]
	public void User_ShouldSupportPropertyUpdates()
	{
		// Arrange
		User user =
			new()
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

	/// <summary>
	/// Verifies audit fields initialize to defaults before interceptor runs.
	/// </summary>
	[Fact]
	public void User_ShouldInitializeAuditFields_WithDefaults()
	{
		// Arrange & Act
		User user = new();

		// Assert - CreateDate/CreateBy/ModifiedBy default to empty/default, interceptor sets them on SaveChanges
		Assert.Equal(default(DateTime), user.CreateDate);
		Assert.Equal(string.Empty, user.CreatedBy); // Non-nullable, defaults to empty string
		Assert.Null(user.ModifyDate);
		Assert.Equal(string.Empty, user.ModifiedBy); // Non-nullable, defaults to empty string
	}

	/// <summary>
	/// Verifies audit-related properties can be set and retrieved.
	/// </summary>
	[Fact]
	public void User_ShouldSetAndGetAuditFields()
	{
		// Arrange
		FakeTimeProvider timeProvider = new();
		DateTime modifyDate =
			timeProvider
			.GetUtcNow()
			.UtcDateTime.AddMinutes(-5);
		User user =
			new()
			{
				CreatedBy = "admin",
				ModifyDate = modifyDate,
				ModifiedBy =
					TestAuditConstants.SystemUser,
			};

		// Assert
		Assert.Equal("admin", user.CreatedBy);
		Assert.Equal(modifyDate, user.ModifyDate);
		Assert.Equal(TestAuditConstants.SystemUser, user.ModifiedBy);
	}

	/// <summary>
	/// Verifies soft-delete fields initialize to defaults before deletion.
	/// </summary>
	[Fact]
	public void User_ShouldInitializeSoftDeleteFields_WithDefaults()
	{
		// Arrange & Act
		User user = new();

		// Assert
		Assert.False(user.IsDeleted);
		Assert.Null(user.DeletedAt);
		Assert.Null(user.DeletedBy);
	}

	/// <summary>
	/// Verifies soft-delete fields can be set and retrieved.
	/// </summary>
	[Fact]
	public void User_ShouldSetAndGetSoftDeleteFields()
	{
		// Arrange
		FakeTimeProvider timeProvider = new();
		DateTime deletedAt =
			timeProvider.GetUtcNow().UtcDateTime;
		User user =
			new()
			{
				IsDeleted = true,
				DeletedAt = deletedAt,
				DeletedBy = "admin",
			};

		// Assert
		Assert.True(user.IsDeleted);
		Assert.Equal(deletedAt, user.DeletedAt);
		Assert.Equal("admin", user.DeletedBy);
	}

	/// <summary>
	/// Verifies RowVersion is null by default before persistence.
	/// </summary>
	[Fact]
	public void User_ShouldInitializeRowVersion_WithNull()
	{
		// Arrange & Act
		User user = new();

		// Assert
		Assert.Null(user.RowVersion);
	}

	/// <summary>
	/// Verifies RowVersion can be set and retrieved.
	/// </summary>
	[Fact]
	public void User_ShouldSetAndGetRowVersion()
	{
		// Arrange
		uint rowVersion = 12345;
		User user =
			new() { RowVersion = rowVersion };

		// Assert
		Assert.Equal(rowVersion, user.RowVersion);
	}

	/// <summary>
	/// Verifies Preferences defaults to null when not set.
	/// </summary>
	[Fact]
	public void User_ShouldInitializePreferences_WithNull()
	{
		// Arrange & Act
		User user = new();

		// Assert
		Assert.Null(user.Preferences);
	}

	/// <summary>
	/// Verifies Preferences JSON can be stored and retrieved as string.
	/// </summary>
	[Fact]
	public void User_ShouldSetAndGetPreferences()
	{
		// Arrange
		string preferences = "{\"theme\":\"dark\",\"notifications\":true}";
		User user =
			new() { Preferences = preferences };

		// Assert
		Assert.Equal(preferences, user.Preferences);
	}

	/// <summary>
	/// Verifies last login fields are null by default.
	/// </summary>
	[Fact]
	public void User_ShouldInitializeLastLoginFields_WithNull()
	{
		// Arrange & Act
		User user = new();

		// Assert
		Assert.Null(user.LastLoginAt);
		Assert.Null(user.LastLoginIp);
	}

	/// <summary>
	/// Verifies last login timestamp and IP can be set and retrieved.
	/// </summary>
	[Fact]
	public void User_ShouldSetAndGetLastLoginFields()
	{
		// Arrange
		FakeTimeProvider timeProvider = new();
		DateTime lastLoginAt =
			timeProvider
			.GetUtcNow()
			.UtcDateTime.AddHours(-2);
		string lastLoginIp = "192.168.1.1";
		User user =
			new()
			{
				LastLoginAt = lastLoginAt,
				LastLoginIp = lastLoginIp,
			};

		// Assert
		Assert.Equal(lastLoginAt, user.LastLoginAt);
		Assert.Equal(lastLoginIp, user.LastLoginIp);
	}

	/// <summary>
	/// Verifies IPv6 addresses can be stored in LastLoginIp.
	/// </summary>
	[Fact]
	public void User_ShouldSupportIpv6Address()
	{
		// Arrange
		string ipv6Address = "2001:0db8:85a3:0000:0000:8a2e:0370:7334";
		User user =
			new() { LastLoginIp = ipv6Address };

		// Assert
		Assert.Equal(ipv6Address, user.LastLoginIp);
	}

	/// <summary>
	/// Verifies all enhanced audit and soft-delete fields can be updated together.
	/// </summary>
	[Fact]
	public void User_ShouldAllowUpdatingAllEnhancedFields()
	{
		// Arrange
		FakeTimeProvider timeProvider = new();
		User user =
			new()
			{
				Username = "test",
				Email =
					TestUserConstants.DefaultEmail,
			};

		DateTime now =
			timeProvider.GetUtcNow().UtcDateTime;

		// Act
		user.CreatedBy = "admin";
		user.ModifyDate = now;
		user.ModifiedBy =
			TestAuditConstants.SystemUser;
		user.IsDeleted = true;
		user.DeletedAt = now;
		user.DeletedBy = "admin";
		user.RowVersion = 54321;
		user.Preferences = "{\"theme\":\"light\"}";
		user.LastLoginAt = now;
		user.LastLoginIp = "10.0.0.1";

		// Assert
		Assert.Equal("admin", user.CreatedBy);
		Assert.Equal(now, user.ModifyDate);
		Assert.Equal(TestAuditConstants.SystemUser, user.ModifiedBy);
		Assert.True(user.IsDeleted);
		Assert.Equal(now, user.DeletedAt);
		Assert.Equal("admin", user.DeletedBy);
		Assert.Equal(54321u, user.RowVersion);
		Assert.Equal("{\"theme\":\"light\"}", user.Preferences);
		Assert.Equal(now, user.LastLoginAt);
		Assert.Equal("10.0.0.1", user.LastLoginIp);
	}
}