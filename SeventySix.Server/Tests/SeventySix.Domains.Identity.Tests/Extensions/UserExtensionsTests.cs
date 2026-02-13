// <copyright file="UserExtensionsTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.Extensions.Time.Testing;
using SeventySix.TestUtilities.Builders;
using Shouldly;

namespace SeventySix.Identity.Tests.Extensions;

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
		ApplicationUser user =
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
		dto.ShouldNotBeNull();
		dto.Id.ShouldBe(123);
		dto.Username.ShouldBe("john_doe");
		dto.Email.ShouldBe("john@example.com");
		dto.FullName.ShouldBe("John Doe");
		dto.CreateDate.ShouldBe(createDate);
		dto.IsActive.ShouldBeTrue();
	}

	[Fact]
	public void ToDto_ShouldHandleNullFullName()
	{
		// Arrange
		FakeTimeProvider timeProvider = new();
		ApplicationUser user =
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
		dto.ShouldNotBeNull();
		dto.FullName.ShouldBeNull();
	}

	[Fact]
	public void ToDto_ShouldMapInactiveUser()
	{
		// Arrange
		FakeTimeProvider timeProvider = new();
		ApplicationUser user =
			UserBuilder
			.CreateInactive(timeProvider)
			.WithUsername("inactive_user")
			.WithEmail("inactive@example.com")
			.Build();
		user.Id = 1;

		// Act
		UserDto dto = user.ToDto();

		// Assert
		dto.ShouldNotBeNull();
		dto.IsActive.ShouldBeFalse();
	}

	[Fact]
	public void ToDto_SingleEntity_ShouldThrowArgumentNullException_WhenEntityIsNull()
	{
		// Arrange
		ApplicationUser? user = null;

		// Act & Assert
		Should.Throw<ArgumentNullException>(() => user!.ToDto());
	}

	[Fact]
	public void ToDto_Collection_ShouldMapMultipleEntities()
	{
		// Arrange
		FakeTimeProvider timeProvider = new();
		ApplicationUser user1 =
			UserBuilder
			.CreateActive(timeProvider)
			.WithUsername("user1")
			.WithEmail("user1@example.com")
			.Build();
		user1.Id = 1;
		ApplicationUser user2 =
			UserBuilder
			.CreateInactive(timeProvider)
			.WithUsername("user2")
			.WithEmail("user2@example.com")
			.Build();
		user2.Id = 2;
		ApplicationUser user3 =
			UserBuilder
			.CreateActive(timeProvider)
			.WithUsername("user3")
			.WithEmail("user3@example.com")
			.Build();
		user3.Id = 3;
		List<ApplicationUser> users =
			[user1, user2, user3];

		// Act
		List<UserDto> dtos =
			[.. users.ToDto()];

		// Assert
		dtos.ShouldNotBeNull();
		dtos.Count.ShouldBe(3);
		dtos[0].Username.ShouldBe("user1");
		dtos[1].Username.ShouldBe("user2");
		dtos[2].Username.ShouldBe("user3");
	}

	[Fact]
	public void ToDto_Collection_ShouldReturnEmptyCollection_WhenInputIsEmpty()
	{
		// Arrange
		List<ApplicationUser> users = [];

		// Act
		List<UserDto> dtos =
			[.. users.ToDto()];

		// Assert
		dtos.ShouldNotBeNull();
		dtos.ShouldBeEmpty();
	}

	[Fact]
	public void ToDto_Collection_ShouldThrowArgumentNullException_WhenCollectionIsNull()
	{
		// Arrange
		IEnumerable<ApplicationUser>? users = null;

		// Act & Assert
		Should.Throw<ArgumentNullException>(() => users!.ToDto());
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
		ApplicationUser entity = request.ToEntity();

		// Assert
		entity.ShouldNotBeNull();
		entity.Id.ShouldBe(0); // Id should not be set (auto-generated)
		entity.UserName.ShouldBe("new_user");
		entity.Email.ShouldBe("new@example.com");
		entity.FullName.ShouldBe("New User");
		entity.IsActive.ShouldBeTrue();
		// Note: CreateDate is set by AuditInterceptor on SaveChanges, not during mapping
		entity.CreateDate.ShouldBe(default(DateTime));
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
		ApplicationUser entity = request.ToEntity();

		// Assert
		entity.ShouldNotBeNull();
		entity.FullName.ShouldBe(string.Empty);
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
		ApplicationUser entity = request.ToEntity();

		// Assert
		entity.ShouldNotBeNull();
		entity.IsActive.ShouldBeFalse();
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
		ApplicationUser entity = request.ToEntity();

		// Assert - CreateDate defaults to MinValue, interceptor sets it on SaveChanges
		entity.CreateDate.ShouldBe(default(DateTime));
	}

	[Fact]
	public void ToEntity_ShouldThrowArgumentNullException_WhenRequestIsNull()
	{
		// Arrange
		CreateUserRequest? request = null;

		// Act & Assert
		Should.Throw<ArgumentNullException>(() => request!.ToEntity());
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
		ApplicationUser entity = request.ToEntity();

		// Assert
		// Id should remain 0 (default) as it will be set by the database
		entity.Id.ShouldBe(0);
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
		ApplicationUser entity = request.ToEntity();

		// Assert
		entity.UserName.ShouldBe(username);
		entity.Email.ShouldBe(email);
	}

	[Fact]
	public void ToDto_ShouldIncludeSoftDeleteFields_WhenUserIsDeleted()
	{
		// Arrange
		FakeTimeProvider timeProvider = new();
		DateTime deletedAt =
			timeProvider.GetUtcNow().UtcDateTime.AddHours(-2);
		ApplicationUser user =
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
		dto.ShouldNotBeNull();
		dto.IsDeleted.ShouldBeTrue();
		dto.DeletedAt.ShouldBe(deletedAt);
		dto.DeletedBy.ShouldBe("admin");
	}

	[Fact]
	public void ToDto_ShouldHaveNullSoftDeleteFields_WhenUserIsNotDeleted()
	{
		// Arrange
		FakeTimeProvider timeProvider = new();
		ApplicationUser user =
			new UserBuilder(timeProvider)
			.WithUsername("active_user")
			.WithEmail("active@example.com")
			.WithIsActive(true)
			.Build();
		user.Id = 1;

		// Act
		UserDto dto = user.ToDto();

		// Assert
		dto.ShouldNotBeNull();
		dto.IsDeleted.ShouldBeFalse();
		dto.DeletedAt.ShouldBeNull();
		dto.DeletedBy.ShouldBeNull();
	}
}