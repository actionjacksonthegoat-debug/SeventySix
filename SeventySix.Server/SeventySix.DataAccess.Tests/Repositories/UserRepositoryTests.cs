using FluentAssertions;
using SeventySix.Core.Entities;
using SeventySix.DataAccess.Repositories;

namespace SeventySix.DataAccess.Tests.Repositories;

/// <summary>
/// Unit tests for UserRepository
/// </summary>
public class UserRepositoryTests
{
	private readonly UserRepository Repository;

	public UserRepositoryTests()
	{
		Repository = new UserRepository();
	}

	[Fact]
	public async Task GetAllAsync_ShouldReturnEmptyList_WhenNoUsersExistAsync()
	{
		// Act
		var result = await Repository.GetAllAsync(CancellationToken.None);

		// Assert
		result.Should().NotBeNull();
		result.Should().BeEmpty();
	}

	[Fact]
	public async Task CreateAsync_ShouldCreateUser_WithValidDataAsync()
	{
		// Arrange
		var user = new User
		{
			Username = "testuser",
			Email = "test@example.com",
			FullName = "Test User",
			IsActive = true
		};

		// Act
		var result = await Repository.CreateAsync(user, CancellationToken.None);

		// Assert
		result.Should().NotBeNull();
		result.Id.Should().BeGreaterThan(0);
		result.Username.Should().Be("testuser");
		result.Email.Should().Be("test@example.com");
		result.FullName.Should().Be("Test User");
		result.IsActive.Should().BeTrue();
		result.CreatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(5));
	}

	[Fact]
	public async Task GetByIdAsync_ShouldReturnUser_WhenUserExistsAsync()
	{
		// Arrange
		var user = new User
		{
			Username = "testuser",
			Email = "test@example.com"
		};
		var created = await Repository.CreateAsync(user, CancellationToken.None);

		// Act
		var result = await Repository.GetByIdAsync(created.Id, CancellationToken.None);

		// Assert
		result.Should().NotBeNull();
		result.Id.Should().Be(created.Id);
		result.Username.Should().Be("testuser");
	}

	[Fact]
	public async Task GetByIdAsync_ShouldReturnNull_WhenUserDoesNotExistAsync()
	{
		// Act
		var result = await Repository.GetByIdAsync(999, CancellationToken.None);

		// Assert
		result.Should().BeNull();
	}

	[Fact]
	public async Task UpdateAsync_ShouldUpdateUser_WhenUserExistsAsync()
	{
		// Arrange
		var user = new User
		{
			Username = "testuser",
			Email = "test@example.com"
		};
		var created = await Repository.CreateAsync(user, CancellationToken.None);

		created.Username = "updateduser";
		created.Email = "updated@example.com";

		// Act
		var result = await Repository.UpdateAsync(created, CancellationToken.None);

		// Assert
		result.Should().NotBeNull();
		result.Username.Should().Be("updateduser");
		result.Email.Should().Be("updated@example.com");
	}

	[Fact]
	public async Task DeleteAsync_ShouldReturnTrue_WhenUserExistsAsync()
	{
		// Arrange
		var user = new User
		{
			Username = "testuser",
			Email = "test@example.com"
		};
		var created = await Repository.CreateAsync(user, CancellationToken.None);

		// Act
		var result = await Repository.DeleteAsync(created.Id, CancellationToken.None);

		// Assert
		result.Should().BeTrue();

		// Verify user is deleted
		var deletedUser = await Repository.GetByIdAsync(created.Id, CancellationToken.None);
		deletedUser.Should().BeNull();
	}

	[Fact]
	public async Task DeleteAsync_ShouldReturnFalse_WhenUserDoesNotExistAsync()
	{
		// Act
		var result = await Repository.DeleteAsync(999, CancellationToken.None);

		// Assert
		result.Should().BeFalse();
	}

	[Fact]
	public async Task GetAllAsync_ShouldReturnMultipleUsers_WhenUsersExistAsync()
	{
		// Arrange
		var user1 = new User { Username = "user1", Email = "user1@example.com" };
		var user2 = new User { Username = "user2", Email = "user2@example.com" };
		var user3 = new User { Username = "user3", Email = "user3@example.com" };

		await Repository.CreateAsync(user1, CancellationToken.None);
		await Repository.CreateAsync(user2, CancellationToken.None);
		await Repository.CreateAsync(user3, CancellationToken.None);

		// Act
		var result = await Repository.GetAllAsync(CancellationToken.None);

		// Assert
		result.Should().HaveCount(3);
		result.Select(u => u.Username).Should().Contain(new[] { "user1", "user2", "user3" });
	}
}
