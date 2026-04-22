// <copyright file="UsersQueryControllerTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Time.Testing;
using NSubstitute;
using SeventySix.Api.Controllers;
using SeventySix.Identity;
using SeventySix.Shared.POCOs;
using SeventySix.TestUtilities.Builders;
using Shouldly;
using Wolverine;

namespace SeventySix.Api.Tests.Controllers;

/// <summary>
/// Unit tests for UsersQueryController.
/// Tests HTTP GET endpoint behavior and response handling.
/// </summary>
public sealed class UsersQueryControllerTests
{
	private readonly IMessageBus MessageBus;
	private readonly UsersQueryController Controller;

	public UsersQueryControllerTests()
	{
		MessageBus = Substitute.For<IMessageBus>();
		Controller =
			new UsersQueryController(MessageBus);
	}

	#region GetByIdAsync Tests

	[Fact]
	public async Task GetByIdAsync_ShouldReturnOkWithUser_WhenUserExistsAsync()
	{
		// Arrange
		FakeTimeProvider timeProvider = new();
		UserDto userDto =
			new UserDtoBuilder(timeProvider)
			.WithId(123)
			.WithUsername("john_doe")
			.WithEmail("john@example.com")
			.WithFullName("John Doe")
			.WithIsActive(true)
			.WithCreatedBy("System")
			.WithModifiedBy("System")
			.Build();

		MessageBus
			.InvokeAsync<UserDto?>(
				Arg.Any<GetUserByIdQuery>(),
				Arg.Any<CancellationToken>())
			.Returns(userDto);

		// Act
		ActionResult<UserDto> result =
			await Controller.GetByIdAsync(
			123,
			CancellationToken.None);

		// Assert
		OkObjectResult okResult =
			result.Result.ShouldBeOfType<OkObjectResult>();
		UserDto returnedUser =
			okResult.Value.ShouldBeOfType<UserDto>();
		returnedUser.Id.ShouldBe(123);
		returnedUser.Username.ShouldBe("john_doe");
	}

	[Fact]
	public async Task GetByIdAsync_ShouldReturnNotFound_WhenUserDoesNotExistAsync()
	{
		// Arrange
		MessageBus
			.InvokeAsync<UserDto?>(
				Arg.Any<GetUserByIdQuery>(),
				Arg.Any<CancellationToken>())
			.Returns(default(UserDto?));

		// Act
		ActionResult<UserDto> result =
			await Controller.GetByIdAsync(
			999,
			CancellationToken.None);

		// Assert
		result.Result.ShouldBeOfType<NotFoundResult>();
	}

	#endregion

	#region GetPagedAsync Tests

	[Fact]
	public async Task GetPagedAsync_ValidRequest_ReturnsOkWithPagedResultAsync()
	{
		// Arrange
		FakeTimeProvider timeProvider = new();
		UserQueryRequest request =
			new UserQueryRequest
			{
				Page = 1,
				PageSize = 10,
				SearchTerm = "test",
			};

		List<UserDto> users =
			[
			new UserDtoBuilder(timeProvider)
				.WithId(1)
				.WithUsername("testuser1")
				.WithEmail("test1@example.com")
				.WithIsActive(true)
				.WithCreatedBy("System")
				.WithModifiedBy("System")
				.Build(),
			new UserDtoBuilder(timeProvider)
				.WithId(2)
				.WithUsername("testuser2")
				.WithEmail("test2@example.com")
				.WithIsActive(true)
				.WithCreatedBy("System")
				.WithModifiedBy("System")
				.Build(),
		];

		PagedResult<UserDto> pagedResult =
			new PagedResult<UserDto>
			{
				Items = users,
				Page = 1,
				PageSize = 10,
				TotalCount = 2,
			};

		MessageBus
			.InvokeAsync<PagedResult<UserDto>>(
				Arg.Any<GetPagedUsersQuery>(),
				Arg.Any<CancellationToken>())
			.Returns(pagedResult);

		// Act
		ActionResult<PagedResult<UserDto>> result =
			await Controller.GetPagedAsync(request, CancellationToken.None);

		// Assert
		OkObjectResult okResult =
			result.Result.ShouldBeOfType<OkObjectResult>();
		PagedResult<UserDto> returnedResult =
			okResult.Value.ShouldBeOfType<
			PagedResult<UserDto>
		>();
		returnedResult.Items.Count().ShouldBe(2);
		returnedResult.Page.ShouldBe(1);
		returnedResult.PageSize.ShouldBe(10);
		returnedResult.TotalCount.ShouldBe(2);
	}

	#endregion

	#region GetByUsernameAsync Tests

	[Fact]
	public async Task GetByUsernameAsync_UserExists_ReturnsOkWithUserAsync()
	{
		// Arrange
		FakeTimeProvider timeProvider = new();
		UserDto user =
			new UserDtoBuilder(timeProvider)
			.WithId(1)
			.WithUsername("testuser")
			.WithEmail("test@example.com")
			.WithIsActive(true)
			.WithCreatedBy("System")
			.WithModifiedBy("System")
			.Build();

		MessageBus
			.InvokeAsync<UserDto?>(
				Arg.Any<GetUserByUsernameQuery>(),
				Arg.Any<CancellationToken>())
			.Returns(user);

		// Act
		ActionResult<UserDto> result =
			await Controller.GetByUsernameAsync(
			"testuser",
			CancellationToken.None);

		// Assert
		OkObjectResult okResult =
			result.Result.ShouldBeOfType<OkObjectResult>();
		UserDto returnedUser =
			okResult.Value.ShouldBeOfType<UserDto>();
		returnedUser.Username.ShouldBe("testuser");
	}

	[Fact]
	public async Task GetByUsernameAsync_UserNotFound_ReturnsNotFoundAsync()
	{
		// Arrange
		MessageBus
			.InvokeAsync<UserDto?>(
				Arg.Any<GetUserByUsernameQuery>(),
				Arg.Any<CancellationToken>())
			.Returns(default(UserDto?));

		// Act
		ActionResult<UserDto> result =
			await Controller.GetByUsernameAsync(
			"nonexistent",
			CancellationToken.None);

		// Assert
		result.Result.ShouldBeOfType<NotFoundResult>();
	}

	#endregion

	#region CheckUsernameAsync Tests

	[Fact]
	public async Task CheckUsernameAsync_UsernameExists_ReturnsTrueAsync()
	{
		// Arrange
		MessageBus
			.InvokeAsync<bool>(
				Arg.Is<CheckUsernameExistsQuery>(
					query =>
						query.Username == "existinguser"
							&& query.ExcludeUserId == null),
				Arg.Any<CancellationToken>())
			.Returns(true);

		// Act
		ActionResult<bool> result =
			await Controller.CheckUsernameAsync(
			"existinguser",
			null,
			CancellationToken.None);

		// Assert
		OkObjectResult okResult =
			result.Result.ShouldBeOfType<OkObjectResult>();
		okResult.Value.ShouldNotBeNull();
		bool exists =
			(bool)okResult.Value;
		exists.ShouldBeTrue();
	}

	[Fact]
	public async Task CheckUsernameAsync_UsernameNotFound_ReturnsFalseAsync()
	{
		// Arrange
		MessageBus
			.InvokeAsync<bool>(
				Arg.Is<CheckUsernameExistsQuery>(
					query =>
						query.Username == "newuser"
							&& query.ExcludeUserId == null),
				Arg.Any<CancellationToken>())
			.Returns(false);

		// Act
		ActionResult<bool> result =
			await Controller.CheckUsernameAsync(
			"newuser",
			null,
			CancellationToken.None);

		// Assert
		OkObjectResult okResult =
			result.Result.ShouldBeOfType<OkObjectResult>();
		okResult.Value.ShouldNotBeNull();
		bool exists =
			(bool)okResult.Value;
		exists.ShouldBeFalse();
	}

	#endregion
}