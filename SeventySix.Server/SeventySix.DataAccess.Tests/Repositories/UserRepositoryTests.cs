using FluentAssertions;
using SeventySix.Core.Entities;
using SeventySix.DataAccess.Repositories;

namespace SeventySix.DataAccess.Tests.Repositories;

/// <summary>
/// Unit tests for UserRepository
/// </summary>
public class UserRepositoryTests
{
	// Note: Each test creates its own repository instance to ensure test isolation
	// xUnit reuses test class instances, so a shared repository would have persistent data across tests

	[Fact]
	public async Task GetAllAsync_ShouldReturnEmptyList_WhenNoUsersExistAsync()
	{
		// Arrange - Create repository without seed data for clean test
		UserRepository repository = new();

		// Clear seed data
		IEnumerable<User> seededUsers = await repository.GetAllAsync(CancellationToken.None);
		foreach (User user in seededUsers)
		{
			await repository.DeleteAsync(user.Id, CancellationToken.None);
		}

		// Act
		IEnumerable<User> result = await repository.GetAllAsync(CancellationToken.None);

		// Assert
		result.Should().NotBeNull();
		result.Should().BeEmpty();
	}

	[Fact]
	public async Task CreateAsync_ShouldCreateUser_WithValidDataAsync()
	{
		// Arrange
		UserRepository repository = new();
		User user = new()
		{
			Username = "testuser",
			Email = "test@example.com",
			FullName = "Test User",
			IsActive = true
		};

		// Act
		User result = await repository.CreateAsync(user, CancellationToken.None);

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
		UserRepository repository = new();
		User user = new()
		{
			Username = "testuser",
			Email = "test@example.com"
		};
		User created = await repository.CreateAsync(user, CancellationToken.None);

		// Act
		User? result = await repository.GetByIdAsync(created.Id, CancellationToken.None);

		// Assert
		result.Should().NotBeNull();
		result.Id.Should().Be(created.Id);
		result.Username.Should().Be("testuser");
	}

	[Fact]
	public async Task GetByIdAsync_ShouldReturnNull_WhenUserDoesNotExistAsync()
	{
		// Arrange
		UserRepository repository = new();

		// Act
		User? result = await repository.GetByIdAsync(999, CancellationToken.None);

		// Assert
		result.Should().BeNull();
	}

	[Fact]
	public async Task UpdateAsync_ShouldUpdateUser_WhenUserExistsAsync()
	{
		// Arrange
		UserRepository repository = new();
		User user = new()
		{
			Username = "testuser",
			Email = "test@example.com"
		};
		User created = await repository.CreateAsync(user, CancellationToken.None);

		created.Username = "updateduser";
		created.Email = "updated@example.com";

		// Act
		User result = await repository.UpdateAsync(created, CancellationToken.None);

		// Assert
		result.Should().NotBeNull();
		result.Username.Should().Be("updateduser");
		result.Email.Should().Be("updated@example.com");
	}

	[Fact]
	public async Task DeleteAsync_ShouldReturnTrue_WhenUserExistsAsync()
	{
		// Arrange
		UserRepository repository = new();
		User user = new()
		{
			Username = "testuser",
			Email = "test@example.com"
		};
		User created = await repository.CreateAsync(user, CancellationToken.None);

		// Act
		bool result = await repository.DeleteAsync(created.Id, CancellationToken.None);

		// Assert
		result.Should().BeTrue();

		// Verify user is deleted
		User? deletedUser = await repository.GetByIdAsync(created.Id, CancellationToken.None);
		deletedUser.Should().BeNull();
	}

	[Fact]
	public async Task DeleteAsync_ShouldReturnFalse_WhenUserDoesNotExistAsync()
	{
		// Arrange
		UserRepository repository = new();

		// Act
		bool result = await repository.DeleteAsync(999, CancellationToken.None);

		// Assert
		result.Should().BeFalse();
	}

	[Fact]
	public async Task GetAllAsync_ShouldReturnMultipleUsers_WhenUsersExistAsync()
	{
		// Arrange
		UserRepository repository = new();

		// Clear seed data for clean test
		IEnumerable<User> seededUsers = await repository.GetAllAsync(CancellationToken.None);
		foreach (User seeded in seededUsers)
		{
			await repository.DeleteAsync(seeded.Id, CancellationToken.None);
		}

		User user1 = new() { Username = "user1", Email = "user1@example.com" };
		User user2 = new() { Username = "user2", Email = "user2@example.com" };
		User user3 = new() { Username = "user3", Email = "user3@example.com" };

		await repository.CreateAsync(user1, CancellationToken.None);
		await repository.CreateAsync(user2, CancellationToken.None);
		await repository.CreateAsync(user3, CancellationToken.None);

		// Act
		IEnumerable<User> result = await repository.GetAllAsync(CancellationToken.None);

		// Assert
		result.Should().HaveCount(3);
		result.Select(u => u.Username).Should().Contain(new[] { "user1", "user2", "user3" });
	}
}