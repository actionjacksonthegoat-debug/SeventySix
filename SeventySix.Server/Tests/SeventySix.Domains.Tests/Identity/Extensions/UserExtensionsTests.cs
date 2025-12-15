// <copyright file="UserExtensionsTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.Extensions.Time.Testing;
using SeventySix.Identity;
using SeventySix.TestUtilities.Builders;

namespace SeventySix.Domains.Tests.Identity.Extensions;

/// <summary>
/// Unit tests for UserExtensions mapping methods.
/// Tests entity-to-DTO and request-to-entity transformations.
/// </summary>
/// <remarks>
/// Following TDD principles:
/// - Test all mapping scenarios
/// - Test null handling
/// - Test optional fields
/// - Verify correct property mapping
///
/// Coverage Focus:
/// - ToDto() for single entity
/// - ToDto() for collections
/// - ToEntity() for CreateUserRequest
/// - Null argument validation
/// - Optional field handling
/// </remarks>
public class UserExtensionsTests
{
	[Fact]
	public void ToDto_ShouldMapUserEntityToDto()
	{
		// Arrange
		FakeTimeProvider timeProvider = new();
		DateTime createDate =
			timeProvider.GetUtcNow().UtcDateTime.AddDays(-5);
		User user =
			new UserBuilder(timeProvider)
			.WithUsername("john_doe")
			.WithEmail("john@example.com")
			.WithFullName("John Doe")
			.WithCreatedInfo(createDate)
			.WithIsActive(true)
			.Build();
		user.Id = 123;

		// Act
		UserDto dto = user.ToDto();

		// Assert
		Assert.NotNull(dto);
		Assert.Equal(123, dto.Id);
		Assert.Equal("john_doe", dto.Username);
		Assert.Equal("john@example.com", dto.Email);
		Assert.Equal("John Doe", dto.FullName);
		Assert.Equal(createDate, dto.CreateDate);
		Assert.True(dto.IsActive);
	}

	[Fact]
	public void ToDto_ShouldHandleNullFullName()
	{
		// Arrange
		FakeTimeProvider timeProvider = new();
		User user =
			new UserBuilder(timeProvider)
			.WithUsername("test_user")
			.WithEmail("test@example.com")
			.WithFullName(null)
			.WithIsActive(true)
			.Build();
		user.Id = 1;

		// Act
		UserDto dto = user.ToDto();

		// Assert
		Assert.NotNull(dto);
		Assert.Null(dto.FullName);
	}

	[Fact]
	public void ToDto_ShouldMapInactiveUser()
	{
		// Arrange
		FakeTimeProvider timeProvider = new();
		User user =
			UserBuilder
			.CreateInactive(timeProvider)
			.WithUsername("inactive_user")
			.WithEmail("inactive@example.com")
			.Build();
		user.Id = 1;

		// Act
		UserDto dto = user.ToDto();

		// Assert
		Assert.NotNull(dto);
		Assert.False(dto.IsActive);
	}

	[Fact]
	public void ToDto_SingleEntity_ShouldThrowArgumentNullException_WhenEntityIsNull()
	{
		// Arrange
		User? user = null;

		// Act & Assert
		Assert.Throws<ArgumentNullException>(() => user!.ToDto());
	}

	[Fact]
	public void ToDto_Collection_ShouldMapMultipleEntities()
	{
		// Arrange
		FakeTimeProvider timeProvider = new();
		User user1 =
			UserBuilder
			.CreateActive(timeProvider)
			.WithUsername("user1")
			.WithEmail("user1@example.com")
			.Build();
		user1.Id = 1;
		User user2 =
			UserBuilder
			.CreateInactive(timeProvider)
			.WithUsername("user2")
			.WithEmail("user2@example.com")
			.Build();
		user2.Id = 2;
		User user3 =
			UserBuilder
			.CreateActive(timeProvider)
			.WithUsername("user3")
			.WithEmail("user3@example.com")
			.Build();
		user3.Id = 3;
		List<User> users =
			[user1, user2, user3];

		// Act
		List<UserDto> dtos =
			[.. users.ToDto()];

		// Assert
		Assert.NotNull(dtos);
		Assert.Equal(3, dtos.Count);
		Assert.Equal("user1", dtos[0].Username);
		Assert.Equal("user2", dtos[1].Username);
		Assert.Equal("user3", dtos[2].Username);
	}

	[Fact]
	public void ToDto_Collection_ShouldReturnEmptyCollection_WhenInputIsEmpty()
	{
		// Arrange
		List<User> users = [];

		// Act
		List<UserDto> dtos =
			[.. users.ToDto()];

		// Assert
		Assert.NotNull(dtos);
		Assert.Empty(dtos);
	}

	[Fact]
	public void ToDto_Collection_ShouldThrowArgumentNullException_WhenCollectionIsNull()
	{
		// Arrange
		IEnumerable<User>? users = null;

		// Act & Assert
		Assert.Throws<ArgumentNullException>(() => users!.ToDto());
	}

	[Fact]
	public void ToEntity_ShouldMapCreateRequestToEntity()
	{
		// Arrange
		CreateUserRequest request =
			new()
		{
			Username = "new_user",
			Email = "new@example.com",
			FullName = "New User",
			IsActive = true,
		};

		// Act
		User entity = request.ToEntity();

		// Assert
		Assert.NotNull(entity);
		Assert.Equal(0, entity.Id); // Id should not be set (auto-generated)
		Assert.Equal("new_user", entity.Username);
		Assert.Equal("new@example.com", entity.Email);
		Assert.Equal("New User", entity.FullName);
		Assert.True(entity.IsActive);
		// Note: CreateDate is set by AuditInterceptor on SaveChanges, not during mapping
		Assert.Equal(default(DateTime), entity.CreateDate);
	}

	[Fact]
	public void ToEntity_ShouldHandleEmptyFullName()
	{
		// Arrange
		CreateUserRequest request =
			new()
		{
			Username = "test_user",
			Email = "test@example.com",
			FullName = string.Empty,
			IsActive = true,
		};

		// Act
		User entity = request.ToEntity();

		// Assert
		Assert.NotNull(entity);
		Assert.Equal(string.Empty, entity.FullName);
	}

	[Fact]
	public void ToEntity_ShouldSetIsActiveFalse_WhenRequested()
	{
		// Arrange
		CreateUserRequest request =
			new()
		{
			Username = "inactive_new",
			Email = "inactive@example.com",
			FullName = "Inactive User",
			IsActive = false,
		};

		// Act
		User entity = request.ToEntity();

		// Assert
		Assert.NotNull(entity);
		Assert.False(entity.IsActive);
	}

	[Fact]
	public void ToEntity_ShouldNotSetCreateDate_InterceptorHandlesIt()
	{
		// Arrange - CreateDate is set by AuditInterceptor, not during mapping
		CreateUserRequest request =
			new()
		{
			Username = "test",
			Email = "test@example.com",
			FullName = "Test User",
		};

		// Act
		User entity = request.ToEntity();

		// Assert - CreateDate defaults to MinValue, interceptor sets it on SaveChanges
		Assert.Equal(default(DateTime), entity.CreateDate);
	}

	[Fact]
	public void ToEntity_ShouldThrowArgumentNullException_WhenRequestIsNull()
	{
		// Arrange
		CreateUserRequest? request = null;

		// Act & Assert
		Assert.Throws<ArgumentNullException>(() => request!.ToEntity());
	}

	[Fact]
	public void ToEntity_ShouldNotSetId()
	{
		// Arrange
		CreateUserRequest request =
			new()
		{
			Username = "test",
			Email = "test@example.com",
			FullName = "Test User",
		};

		// Act
		User entity = request.ToEntity();

		// Assert
		// Id should remain 0 (default) as it will be set by the database
		Assert.Equal(0, entity.Id);
	}

	[Theory]
	[InlineData("", "")]
	[InlineData("a", "a@b.com")]
	[InlineData("very_long_username_here", "very.long.email@example.com")]
	public void ToEntity_ShouldHandleVariousInputFormats(
		string username,
		string email)
	{
		// Arrange
		CreateUserRequest request =
			new()
		{
			Username = username,
			Email = email,
			FullName = "Test User",
		};

		// Act
		User entity = request.ToEntity();

		// Assert
		Assert.Equal(username, entity.Username);
		Assert.Equal(email, entity.Email);
	}

	[Fact]
	public void ToDto_ShouldIncludeSoftDeleteFields_WhenUserIsDeleted()
	{
		// Arrange
		FakeTimeProvider timeProvider = new();
		DateTime deletedAt =
			timeProvider.GetUtcNow().UtcDateTime.AddHours(-2);
		User user =
			new UserBuilder(timeProvider)
			.WithUsername("deleted_user")
			.WithEmail("deleted@example.com")
			.WithFullName("Deleted User")
			.WithIsActive(false)
			.Build();
		user.Id = 999;
		user.IsDeleted = true;
		user.DeletedAt = deletedAt;
		user.DeletedBy = "admin";

		// Act
		UserDto dto = user.ToDto();

		// Assert
		Assert.NotNull(dto);
		Assert.True(dto.IsDeleted);
		Assert.Equal(deletedAt, dto.DeletedAt);
		Assert.Equal("admin", dto.DeletedBy);
	}

	[Fact]
	public void ToDto_ShouldHaveNullSoftDeleteFields_WhenUserIsNotDeleted()
	{
		// Arrange
		FakeTimeProvider timeProvider = new();
		User user =
			new UserBuilder(timeProvider)
			.WithUsername("active_user")
			.WithEmail("active@example.com")
			.WithIsActive(true)
			.Build();
		user.Id = 1;

		// Act
		UserDto dto = user.ToDto();

		// Assert
		Assert.NotNull(dto);
		Assert.False(dto.IsDeleted);
		Assert.Null(dto.DeletedAt);
		Assert.Null(dto.DeletedBy);
	}
}
