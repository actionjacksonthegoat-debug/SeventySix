// <copyright file="UserRepositoryTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;
using SeventySix.Identity;
using SeventySix.TestUtilities.Builders;
using SeventySix.TestUtilities.TestBases;

namespace SeventySix.Tests.Identity;

/// <summary>
/// Integration tests for <see cref="UserRepository"/>.
/// </summary>
/// <remarks>
/// Uses Testcontainers with PostgreSQL for realistic integration testing.
/// Follows TDD principles and ensures repository implements contract correctly.
///
/// Test Coverage:
/// - CRUD operations
/// - Advanced queries (username, email lookups)
/// - Pagination with search and filtering
/// - Soft delete and restore
/// - Bulk operations
/// </remarks>
[Collection("DatabaseTests")]
public class UserRepositoryTests : DataPostgreSqlTestBase, IClassFixture<TestcontainersPostgreSqlFixture>
{
	private readonly UserRepository Repository;

	public UserRepositoryTests(TestcontainersPostgreSqlFixture fixture)
		: base(fixture)
	{
		IdentityDbContext context = CreateIdentityDbContext();
		Repository = new UserRepository(
			context,
			Mock.Of<ILogger<UserRepository>>());
	}

	[Fact]
	public async Task GetAllAsync_ShouldReturnEmptyList_WhenNoUsersExistAsync()
	{
		// Act
		IEnumerable<User> result = await Repository.GetAllAsync(CancellationToken.None);

		// Assert
		result.Should().NotBeNull();
		result.Should().BeEmpty();
	}

	[Fact]
	public async Task CreateAsync_ShouldCreateUser_WithValidDataAsync()
	{
		// Arrange
		User user = new UserBuilder()
			.WithUsername("testuser")
			.WithEmail("test@example.com")
			.WithFullName("Test User")
			.WithIsActive(true)
			.Build();

		// Act
		User result = await Repository.CreateAsync(user, CancellationToken.None);

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
		User user = new UserBuilder()
			.WithUsername("testuser")
			.WithEmail("test@example.com")
			.Build();
		User created = await Repository.CreateAsync(user, CancellationToken.None);

		// Act
		User? result = await Repository.GetByIdAsync(created.Id, CancellationToken.None);

		// Assert
		result.Should().NotBeNull();
		result!.Id.Should().Be(created.Id);
		result.Username.Should().Be("testuser");
	}

	[Fact]
	public async Task GetByIdAsync_ShouldReturnNull_WhenUserDoesNotExistAsync()
	{
		// Act
		User? result = await Repository.GetByIdAsync(999, CancellationToken.None);

		// Assert
		result.Should().BeNull();
	}

	[Fact]
	public async Task UpdateAsync_ShouldUpdateUser_WhenUserExistsAsync()
	{
		// Arrange
		User user = new UserBuilder()
			.WithUsername("testuser")
			.WithEmail("test@example.com")
			.Build();
		User created = await Repository.CreateAsync(user, CancellationToken.None);

		created.Username = "updateduser";
		created.Email = "updated@example.com";

		// Act
		User result = await Repository.UpdateAsync(created, CancellationToken.None);

		// Assert
		result.Should().NotBeNull();
		result.Username.Should().Be("updateduser");
		result.Email.Should().Be("updated@example.com");
	}

	[Fact]
	public async Task DeleteAsync_ShouldReturnTrue_WhenUserExistsAsync()
	{
		// Arrange
		User user = new UserBuilder()
			.WithUsername("testuser")
			.WithEmail("test@example.com")
			.Build();
		User created = await Repository.CreateAsync(user, CancellationToken.None);

		// Act
		bool result = await Repository.DeleteAsync(created.Id, CancellationToken.None);

		// Assert
		result.Should().BeTrue();

		// Verify user is deleted
		User? deletedUser = await Repository.GetByIdAsync(created.Id, CancellationToken.None);
		deletedUser.Should().BeNull();
	}

	[Fact]
	public async Task DeleteAsync_ShouldReturnFalse_WhenUserDoesNotExistAsync()
	{
		// Act
		bool result = await Repository.DeleteAsync(999, CancellationToken.None);

		// Assert
		result.Should().BeFalse();
	}

	[Fact]
	public async Task GetAllAsync_ShouldReturnMultipleUsers_WhenUsersExistAsync()
	{
		// Arrange
		User user1 = new UserBuilder().WithUsername("user1").WithEmail("user1@example.com").Build();
		User user2 = new UserBuilder().WithUsername("user2").WithEmail("user2@example.com").Build();
		User user3 = new UserBuilder().WithUsername("user3").WithEmail("user3@example.com").Build();

		await Repository.CreateAsync(user1, CancellationToken.None);
		await Repository.CreateAsync(user2, CancellationToken.None);
		await Repository.CreateAsync(user3, CancellationToken.None);

		// Act
		IEnumerable<User> result = await Repository.GetAllAsync(CancellationToken.None);

		// Assert
		result.Should().HaveCount(3);
		result.Select(u => u.Username).Should().Contain(new[] { "user1", "user2", "user3" });
	}

	[Fact]
	public async Task GetByUsernameAsync_ShouldReturnUser_WhenUsernameExistsAsync()
	{
		// Arrange
		User user = new UserBuilder().WithUsername("uniqueuser").WithEmail("unique@example.com").Build();
		await Repository.CreateAsync(user, CancellationToken.None);

		// Act
		User? result = await Repository.GetByUsernameAsync("uniqueuser", CancellationToken.None);

		// Assert
		result.Should().NotBeNull();
		result!.Username.Should().Be("uniqueuser");
	}

	[Fact]
	public async Task GetByUsernameAsync_ShouldReturnNull_WhenUsernameDoesNotExistAsync()
	{
		// Act
		User? result = await Repository.GetByUsernameAsync("nonexistent", CancellationToken.None);

		// Assert
		result.Should().BeNull();
	}

	[Fact]
	public async Task GetByEmailAsync_ShouldReturnUser_WhenEmailExistsAsync()
	{
		// Arrange
		User user = new UserBuilder().WithUsername("emailtest").WithEmail("test@example.com").Build();
		await Repository.CreateAsync(user, CancellationToken.None);

		// Act
		User? result = await Repository.GetByEmailAsync("test@example.com", CancellationToken.None);

		// Assert
		result.Should().NotBeNull();
		result!.Email.Should().Be("test@example.com");
	}

	[Fact]
	public async Task GetByEmailAsync_ShouldBeCaseInsensitive_WhenSearchingAsync()
	{
		// Arrange
		User user = new UserBuilder().WithUsername("casetest").WithEmail("Test@Example.Com").Build();
		await Repository.CreateAsync(user, CancellationToken.None);

		// Act
		User? result = await Repository.GetByEmailAsync("test@example.com", CancellationToken.None);

		// Assert
		result.Should().NotBeNull();
	}

	[Fact]
	public async Task UsernameExistsAsync_ShouldReturnTrue_WhenUsernameExistsAsync()
	{
		// Arrange
		User user = new UserBuilder().WithUsername("existinguser").WithEmail("existing@example.com").Build();
		await Repository.CreateAsync(user, CancellationToken.None);

		// Act
		bool result = await Repository.UsernameExistsAsync("existinguser", null, CancellationToken.None);

		// Assert
		result.Should().BeTrue();
	}

	[Fact]
	public async Task UsernameExistsAsync_ShouldReturnFalse_WhenUsernameDoesNotExistAsync()
	{
		// Act
		bool result = await Repository.UsernameExistsAsync("nonexistent", null, CancellationToken.None);

		// Assert
		result.Should().BeFalse();
	}

	[Fact]
	public async Task UsernameExistsAsync_ShouldExcludeSpecifiedUser_WhenExcludeIdProvidedAsync()
	{
		// Arrange
		User user = new UserBuilder().WithUsername("updatetest").WithEmail("update@example.com").Build();
		User created = await Repository.CreateAsync(user, CancellationToken.None);

		// Act - Check if username exists, excluding the user itself (for update scenario)
		bool result = await Repository.UsernameExistsAsync("updatetest", created.Id, CancellationToken.None);

		// Assert
		result.Should().BeFalse();
	}

	[Fact]
	public async Task EmailExistsAsync_ShouldReturnTrue_WhenEmailExistsAsync()
	{
		// Arrange
		User user = new UserBuilder().WithUsername("emailcheck").WithEmail("check@example.com").Build();
		await Repository.CreateAsync(user, CancellationToken.None);

		// Act
		bool result = await Repository.EmailExistsAsync("check@example.com", null, CancellationToken.None);

		// Assert
		result.Should().BeTrue();
	}

	[Fact]
	public async Task GetPagedAsync_ShouldReturnPagedResults_WithCorrectCountAsync()
	{
		// Arrange
		for (int i = 1; i <= 25; i++)
		{
			await Repository.CreateAsync(new UserBuilder().WithUsername($"user{i}").WithEmail($"user{i}@example.com").Build(), CancellationToken.None);
		}

		// Act
		UserQueryRequest request = new() { Page = 1, PageSize = 10, StartDate = null };
		(IEnumerable<User> users, int totalCount) = await Repository.GetPagedAsync(request, CancellationToken.None);

		// Assert
		users.Should().HaveCount(10);
		totalCount.Should().Be(25);
	}

	[Fact]
	public async Task GetPagedAsync_ShouldFilterBySearchTerm_WhenProvidedAsync()
	{
		// Arrange
		await Repository.CreateAsync(new UserBuilder().WithUsername("alice").WithEmail("alice@example.com").Build(), CancellationToken.None);
		await Repository.CreateAsync(new UserBuilder().WithUsername("bob").WithEmail("bob@example.com").Build(), CancellationToken.None);
		await Repository.CreateAsync(new UserBuilder().WithUsername("charlie").WithEmail("alice@other.com").Build(), CancellationToken.None);

		// Act
		UserQueryRequest request = new() { Page = 1, PageSize = 10, SearchTerm = "alice", StartDate = null };
		(IEnumerable<User> users, int totalCount) = await Repository.GetPagedAsync(request, CancellationToken.None);

		// Assert
		users.Should().HaveCount(2);
		totalCount.Should().Be(2);
	}

	[Fact]
	public async Task GetPagedAsync_ShouldFilterByIsActive_WhenProvidedAsync()
	{
		// Arrange
		await Repository.CreateAsync(UserBuilder.CreateActive().WithUsername("active1").WithEmail("active1@example.com").Build(), CancellationToken.None);
		await Repository.CreateAsync(UserBuilder.CreateInactive().WithUsername("inactive1").WithEmail("inactive1@example.com").Build(), CancellationToken.None);

		// Act
		UserQueryRequest request = new() { Page = 1, PageSize = 10, IsActive = true, StartDate = null };
		(IEnumerable<User> users, int totalCount) = await Repository.GetPagedAsync(request, CancellationToken.None);

		// Assert
		users.Should().HaveCount(1);
		users.First().IsActive.Should().BeTrue();
	}

	[Fact]
	public async Task GetPagedAsync_ShouldExcludeDeletedUsers_ByDefaultAsync()
	{
		// Arrange
		User user1 = new UserBuilder().WithUsername("visible").WithEmail("visible@example.com").Build();
		User user2 = new UserBuilder().WithUsername("deleted").WithEmail("deleted@example.com").Build();
		User created1 = await Repository.CreateAsync(user1, CancellationToken.None);
		User created2 = await Repository.CreateAsync(user2, CancellationToken.None);

		await Repository.SoftDeleteAsync(created2.Id, "test", CancellationToken.None);

		// Act
		UserQueryRequest request = new() { Page = 1, PageSize = 10, IncludeDeleted = false, StartDate = null };
		(IEnumerable<User> users, int totalCount) = await Repository.GetPagedAsync(request, CancellationToken.None);

		// Assert
		users.Should().Contain(u => u.Username == "visible");
		users.Should().NotContain(u => u.Username == "deleted");
	}

	[Fact]
	public async Task GetByIdsAsync_ShouldReturnMatchingUsers_WhenIdsExistAsync()
	{
		// Arrange
		User user1 = new UserBuilder().WithUsername("bulk1").WithEmail("bulk1@example.com").Build();
		User user2 = new UserBuilder().WithUsername("bulk2").WithEmail("bulk2@example.com").Build();
		User created1 = await Repository.CreateAsync(user1, CancellationToken.None);
		User created2 = await Repository.CreateAsync(user2, CancellationToken.None);

		// Act
		IEnumerable<User> result = await Repository.GetByIdsAsync([created1.Id, created2.Id], CancellationToken.None);

		// Assert
		result.Should().HaveCount(2);
	}

	[Fact]
	public async Task BulkUpdateActiveStatusAsync_ShouldUpdateMultipleUsers_WhenIdsExistAsync()
	{
		// Arrange
		User user1 = UserBuilder.CreateActive().WithUsername("bulkupdate1").WithEmail("bulk1@example.com").Build();
		User user2 = UserBuilder.CreateActive().WithUsername("bulkupdate2").WithEmail("bulk2@example.com").Build();
		User created1 = await Repository.CreateAsync(user1, CancellationToken.None);
		User created2 = await Repository.CreateAsync(user2, CancellationToken.None);

		// Act
		int count = await Repository.BulkUpdateActiveStatusAsync([created1.Id, created2.Id], false, CancellationToken.None);

		// Assert
		count.Should().Be(2);
		User? updated1 = await Repository.GetByIdAsync(created1.Id, CancellationToken.None);
		updated1!.IsActive.Should().BeFalse();
	}

	[Fact]
	public async Task SoftDeleteAsync_ShouldSetIsDeletedFlag_WhenUserExistsAsync()
	{
		// Arrange
		User user = new UserBuilder().WithUsername("softdelete").WithEmail("softdelete@example.com").Build();
		User created = await Repository.CreateAsync(user, CancellationToken.None);

		// Act
		bool result = await Repository.SoftDeleteAsync(created.Id, "admin", CancellationToken.None);

		// Assert
		result.Should().BeTrue();
		User? deleted = await Repository.GetByIdAsync(created.Id, CancellationToken.None);
		deleted.Should().BeNull(); // Excluded by query filter
	}

	[Fact]
	public async Task SoftDeleteAsync_ShouldSetAuditFields_WhenDeletingAsync()
	{
		// Arrange
		User user = new UserBuilder().WithUsername("auditdelete").WithEmail("audit@example.com").Build();
		User created = await Repository.CreateAsync(user, CancellationToken.None);

		// Act
		await Repository.SoftDeleteAsync(created.Id, "testuser", CancellationToken.None);

		// Assert - Need to query with IgnoreQueryFilters to verify soft-deleted user
		await using IdentityDbContext context = CreateIdentityDbContext();
		User? softDeleted = await context.Users
			.IgnoreQueryFilters()
			.FirstOrDefaultAsync(u => u.Id == created.Id);

		softDeleted.Should().NotBeNull();
		softDeleted!.IsDeleted.Should().BeTrue();
		softDeleted.DeletedBy.Should().Be("testuser");
		softDeleted.DeletedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(5));
	}

	[Fact]
	public async Task RestoreAsync_ShouldUnsetIsDeletedFlag_WhenUserWasDeletedAsync()
	{
		// Arrange
		User user = new UserBuilder().WithUsername("restore").WithEmail("restore@example.com").Build();
		User created = await Repository.CreateAsync(user, CancellationToken.None);
		await Repository.SoftDeleteAsync(created.Id, "admin", CancellationToken.None);

		// Act
		bool result = await Repository.RestoreAsync(created.Id, CancellationToken.None);

		// Assert
		result.Should().BeTrue();
		User? restored = await Repository.GetByIdAsync(created.Id, CancellationToken.None);
		restored.Should().NotBeNull();
		restored!.IsDeleted.Should().BeFalse();
	}

	[Fact]
	public async Task CountAsync_ShouldReturnCorrectCount_WithNoFiltersAsync()
	{
		// Arrange
		await Repository.CreateAsync(new UserBuilder().WithUsername("count1").WithEmail("count1@example.com").Build(), CancellationToken.None);
		await Repository.CreateAsync(new UserBuilder().WithUsername("count2").WithEmail("count2@example.com").Build(), CancellationToken.None);

		// Act
		int result = await Repository.CountAsync(null, false, CancellationToken.None);

		// Assert
		result.Should().Be(2);
	}

	[Fact]
	public async Task CountAsync_ShouldFilterByIsActive_WhenProvidedAsync()
	{
		// Arrange
		await Repository.CreateAsync(UserBuilder.CreateActive().WithUsername("activecount").WithEmail("active@example.com").Build(), CancellationToken.None);
		await Repository.CreateAsync(UserBuilder.CreateInactive().WithUsername("inactivecount").WithEmail("inactive@example.com").Build(), CancellationToken.None);

		// Act
		int result = await Repository.CountAsync(true, false, CancellationToken.None);

		// Assert
		result.Should().Be(1);
	}
}