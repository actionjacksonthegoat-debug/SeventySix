// <copyright file="UserExtensionsTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using SeventySix.BusinessLogic.DTOs;
using SeventySix.BusinessLogic.DTOs.Requests;
using SeventySix.BusinessLogic.Extensions;
using SeventySix.BusinessLogic.Entities;

namespace SeventySix.BusinessLogic.Tests.Extensions;

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
		DateTime createdAt = DateTime.UtcNow.AddDays(-5);
		User user = new()
		{
			Id = 123,
			Username = "john_doe",
			Email = "john@example.com",
			FullName = "John Doe",
			CreatedAt = createdAt,
			IsActive = true,
		};

		// Act
		UserDto dto = user.ToDto();

		// Assert
		Assert.NotNull(dto);
		Assert.Equal(123, dto.Id);
		Assert.Equal("john_doe", dto.Username);
		Assert.Equal("john@example.com", dto.Email);
		Assert.Equal("John Doe", dto.FullName);
		Assert.Equal(createdAt, dto.CreatedAt);
		Assert.True(dto.IsActive);
	}

	[Fact]
	public void ToDto_ShouldHandleNullFullName()
	{
		// Arrange
		User user = new()
		{
			Id = 1,
			Username = "test_user",
			Email = "test@example.com",
			FullName = null,
			IsActive = true,
		};

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
		User user = new()
		{
			Id = 1,
			Username = "inactive_user",
			Email = "inactive@example.com",
			IsActive = false,
		};

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
		List<User> users =
		[
			new User { Id = 1, Username = "user1", Email = "user1@example.com", IsActive = true },
			new User { Id = 2, Username = "user2", Email = "user2@example.com", IsActive = false },
			new User { Id = 3, Username = "user3", Email = "user3@example.com", IsActive = true },
		];

		// Act
		List<UserDto> dtos = [.. users.ToDto()];

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
		List<UserDto> dtos = [.. users.ToDto()];

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
		DateTime beforeCreation = DateTime.UtcNow;
		CreateUserRequest request = new()
		{
			Username = "new_user",
			Email = "new@example.com",
			FullName = "New User",
			IsActive = true,
		};

		// Act
		User entity = request.ToEntity();
		DateTime afterCreation = DateTime.UtcNow;

		// Assert
		Assert.NotNull(entity);
		Assert.Equal(0, entity.Id); // Id should not be set (auto-generated)
		Assert.Equal("new_user", entity.Username);
		Assert.Equal("new@example.com", entity.Email);
		Assert.Equal("New User", entity.FullName);
		Assert.True(entity.IsActive);
		Assert.InRange(entity.CreatedAt, beforeCreation, afterCreation);
	}

	[Fact]
	public void ToEntity_ShouldHandleNullFullName()
	{
		// Arrange
		CreateUserRequest request = new()
		{
			Username = "test_user",
			Email = "test@example.com",
			FullName = null,
			IsActive = true,
		};

		// Act
		User entity = request.ToEntity();

		// Assert
		Assert.NotNull(entity);
		Assert.Null(entity.FullName);
	}

	[Fact]
	public void ToEntity_ShouldSetIsActiveFalse_WhenRequested()
	{
		// Arrange
		CreateUserRequest request = new()
		{
			Username = "inactive_new",
			Email = "inactive@example.com",
			IsActive = false,
		};

		// Act
		User entity = request.ToEntity();

		// Assert
		Assert.NotNull(entity);
		Assert.False(entity.IsActive);
	}

	[Fact]
	public void ToEntity_ShouldSetCreatedAtToUtcNow()
	{
		// Arrange
		DateTime beforeCreation = DateTime.UtcNow;
		CreateUserRequest request = new()
		{
			Username = "test",
			Email = "test@example.com",
		};

		// Act
		User entity = request.ToEntity();
		DateTime afterCreation = DateTime.UtcNow;

		// Assert
		Assert.InRange(entity.CreatedAt, beforeCreation, afterCreation);
		Assert.Equal(DateTimeKind.Utc, entity.CreatedAt.Kind);
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
		CreateUserRequest request = new()
		{
			Username = "test",
			Email = "test@example.com",
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
	public void ToEntity_ShouldHandleVariousInputFormats(string username, string email)
	{
		// Arrange
		CreateUserRequest request = new()
		{
			Username = username,
			Email = email,
		};

		// Act
		User entity = request.ToEntity();

		// Assert
		Assert.Equal(username, entity.Username);
		Assert.Equal(email, entity.Email);
	}
}