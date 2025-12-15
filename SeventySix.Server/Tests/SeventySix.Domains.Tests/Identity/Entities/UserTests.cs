// <copyright file="UserTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

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

	[Fact]
	public void User_ShouldSetAndGetProperties()
	{
		// Arrange
		DateTime createDate = DateTime.UtcNow.AddDays(-10);
		User user = new()
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
	public void User_CreateDate_ShouldDefaultToMinValue_UntilInterceptorSetsIt()
	{
		// Arrange & Act - CreateDate is set by AuditInterceptor on SaveChanges, not during construction
		User user = new();

		// Assert - Default value before interceptor runs
		Assert.Equal(default(DateTime), user.CreateDate);
	}

	[Fact]
	public void User_ShouldAllowOverridingCreatedAt()
	{
		// Arrange
		DateTime specificDate = new(2024, 1, 1, 12, 0, 0, DateTimeKind.Utc);

		// Act
		User user = new() { CreateDate = specificDate };

		// Assert
		Assert.Equal(specificDate, user.CreateDate);
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

	[Fact]
	public void User_ShouldInitializeAuditFields_WithDefaults()
	{
		// Arrange & Act
		User user = new();

		// Assert - CreateDate/CreateBy/ModifiedBy default to empty/default, interceptor sets them on SaveChanges
		Assert.Equal(default(DateTime), user.CreateDate);
		Assert.Equal(string.Empty, user.CreatedBy);  // Non-nullable, defaults to empty string
		Assert.Null(user.ModifyDate);
		Assert.Equal(string.Empty, user.ModifiedBy);  // Non-nullable, defaults to empty string
	}

	[Fact]
	public void User_ShouldSetAndGetAuditFields()
	{
		// Arrange
		DateTime modifyDate = DateTime.UtcNow.AddMinutes(-5);
		User user = new()
		{
			CreatedBy = "admin",
			ModifyDate = modifyDate,
			ModifiedBy = TestAuditConstants.SystemUser,
		};

		// Assert
		Assert.Equal("admin", user.CreatedBy);
		Assert.Equal(modifyDate, user.ModifyDate);
		Assert.Equal(TestAuditConstants.SystemUser, user.ModifiedBy);
	}

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

	[Fact]
	public void User_ShouldSetAndGetSoftDeleteFields()
	{
		// Arrange
		DateTime deletedAt = DateTime.UtcNow;
		User user = new()
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

	[Fact]
	public void User_ShouldInitializeRowVersion_WithNull()
	{
		// Arrange & Act
		User user = new();

		// Assert
		Assert.Null(user.RowVersion);
	}

	[Fact]
	public void User_ShouldSetAndGetRowVersion()
	{
		// Arrange
		uint rowVersion = 12345;
		User user = new() { RowVersion = rowVersion };

		// Assert
		Assert.Equal(rowVersion, user.RowVersion);
	}

	[Fact]
	public void User_ShouldInitializePreferences_WithNull()
	{
		// Arrange & Act
		User user = new();

		// Assert
		Assert.Null(user.Preferences);
	}

	[Fact]
	public void User_ShouldSetAndGetPreferences()
	{
		// Arrange
		string preferences = "{\"theme\":\"dark\",\"notifications\":true}";
		User user = new() { Preferences = preferences };

		// Assert
		Assert.Equal(preferences, user.Preferences);
	}

	[Fact]
	public void User_ShouldInitializeLastLoginFields_WithNull()
	{
		// Arrange & Act
		User user = new();

		// Assert
		Assert.Null(user.LastLoginAt);
		Assert.Null(user.LastLoginIp);
	}

	[Fact]
	public void User_ShouldSetAndGetLastLoginFields()
	{
		// Arrange
		DateTime lastLoginAt = DateTime.UtcNow.AddHours(-2);
		string lastLoginIp = "192.168.1.1";
		User user = new()
		{
			LastLoginAt = lastLoginAt,
			LastLoginIp = lastLoginIp,
		};

		// Assert
		Assert.Equal(lastLoginAt, user.LastLoginAt);
		Assert.Equal(lastLoginIp, user.LastLoginIp);
	}

	[Fact]
	public void User_ShouldSupportIpv6Address()
	{
		// Arrange
		string ipv6Address = "2001:0db8:85a3:0000:0000:8a2e:0370:7334";
		User user = new() { LastLoginIp = ipv6Address };

		// Assert
		Assert.Equal(ipv6Address, user.LastLoginIp);
	}

	[Fact]
	public void User_ShouldAllowUpdatingAllEnhancedFields()
	{
		// Arrange
		User user = new()
		{
			Username = "test",
			Email = TestUserConstants.DefaultEmail,
		};

		DateTime now = DateTime.UtcNow;

		// Act
		user.CreatedBy = "admin";
		user.ModifyDate = now;
		user.ModifiedBy = TestAuditConstants.SystemUser;
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