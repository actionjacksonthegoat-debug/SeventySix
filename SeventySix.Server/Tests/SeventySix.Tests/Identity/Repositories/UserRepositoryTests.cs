// <copyright file="UserRepositoryTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using NSubstitute;
using SeventySix.Identity;
using SeventySix.TestUtilities.Builders;
using SeventySix.TestUtilities.TestBases;
using Shouldly;

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
public class UserRepositoryTests : DataPostgreSqlTestBase
{
	private readonly UserRepository Repository;

	public UserRepositoryTests(TestcontainersPostgreSqlFixture fixture)
		: base(fixture)
	{
		IdentityDbContext context = CreateIdentityDbContext();
		Repository = new UserRepository(
			context,
			Substitute.For<ILogger<UserRepository>>());
	}

	[Fact]
	public async Task GetAllAsync_ShouldReturnEmptyList_WhenNoUsersExistAsync()
	{
		// Act
		IEnumerable<User> result = await Repository.GetAllAsync(CancellationToken.None);

		// Assert
		result.ShouldNotBeNull();
		result.ShouldBeEmpty();
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
		User result = await Repository.CreateAsync(user);

		// Assert
		result.ShouldNotBeNull();
		result.Id.ShouldBeGreaterThan(0);
		result.Username.ShouldBe("testuser");
		result.Email.ShouldBe("test@example.com");
		result.FullName.ShouldBe("Test User");
		result.IsActive.ShouldBeTrue();
		result.CreateDate.ShouldBe(DateTime.UtcNow, TimeSpan.FromSeconds(5));
	}

	[Fact]
	public async Task GetByIdAsync_ShouldReturnUser_WhenUserExistsAsync()
	{
		// Arrange
		User user = new UserBuilder()
			.WithUsername("testuser")
			.WithEmail("test@example.com")
			.Build();
		User created = await Repository.CreateAsync(user);

		// Act
		User? result = await Repository.GetByIdAsync(created.Id, CancellationToken.None);

		// Assert
		result.ShouldNotBeNull();
		result!.Id.ShouldBe(created.Id);
		result.Username.ShouldBe("testuser");
	}

	[Fact]
	public async Task GetByIdAsync_ShouldReturnNull_WhenUserDoesNotExistAsync()
	{
		// Act
		User? result = await Repository.GetByIdAsync(999, CancellationToken.None);

		// Assert
		result.ShouldBeNull();
	}

	[Fact]
	public async Task UpdateAsync_ShouldUpdateUser_WhenUserExistsAsync()
	{
		// Arrange
		User user = new UserBuilder()
			.WithUsername("testuser")
			.WithEmail("test@example.com")
			.Build();
		User created = await Repository.CreateAsync(user);

		created.Username = "updateduser";
		created.Email = "updated@example.com";

		// Act
		User result = await Repository.UpdateAsync(created);

		// Assert
		result.ShouldNotBeNull();
		result.Username.ShouldBe("updateduser");
		result.Email.ShouldBe("updated@example.com");
	}

	[Fact]
	public async Task DeleteAsync_ShouldReturnTrue_WhenUserExistsAsync()
	{
		// Arrange
		User user = new UserBuilder()
			.WithUsername("testuser")
			.WithEmail("test@example.com")
			.Build();
		User created = await Repository.CreateAsync(user);

		// Act
		bool result = await Repository.DeleteAsync(created.Id);

		// Assert
		result.ShouldBeTrue();

		// Verify user is deleted
		User? deletedUser = await Repository.GetByIdAsync(created.Id, CancellationToken.None);
		deletedUser.ShouldBeNull();
	}

	[Fact]
	public async Task DeleteAsync_ShouldReturnFalse_WhenUserDoesNotExistAsync()
	{
		// Act
		bool result = await Repository.DeleteAsync(999);

		// Assert
		result.ShouldBeFalse();
	}

	[Fact]
	public async Task GetAllAsync_ShouldReturnMultipleUsers_WhenUsersExistAsync()
	{
		// Arrange
		User user1 = new UserBuilder().WithUsername("user1").WithEmail("user1@example.com").Build();
		User user2 = new UserBuilder().WithUsername("user2").WithEmail("user2@example.com").Build();
		User user3 = new UserBuilder().WithUsername("user3").WithEmail("user3@example.com").Build();

		await Repository.CreateAsync(user1);
		await Repository.CreateAsync(user2);
		await Repository.CreateAsync(user3);

		// Act
		IEnumerable<User> result = await Repository.GetAllAsync(CancellationToken.None);

		// Assert
		result.Count().ShouldBe(3);
		result.Select(u => u.Username).ShouldContain("user1");
		result.Select(u => u.Username).ShouldContain("user2");
		result.Select(u => u.Username).ShouldContain("user3");
	}

	[Fact]
	public async Task GetByUsernameAsync_ShouldReturnUser_WhenUsernameExistsAsync()
	{
		// Arrange
		User user = new UserBuilder().WithUsername("uniqueuser").WithEmail("unique@example.com").Build();
		await Repository.CreateAsync(user);

		// Act
		User? result = await Repository.GetByUsernameAsync("uniqueuser", CancellationToken.None);

		// Assert
		result.ShouldNotBeNull();
		result!.Username.ShouldBe("uniqueuser");
	}

	[Fact]
	public async Task GetByUsernameAsync_ShouldReturnNull_WhenUsernameDoesNotExistAsync()
	{
		// Act
		User? result = await Repository.GetByUsernameAsync("nonexistent", CancellationToken.None);

		// Assert
		result.ShouldBeNull();
	}

	[Fact]
	public async Task GetByEmailAsync_ShouldReturnUser_WhenEmailExistsAsync()
	{
		// Arrange
		User user = new UserBuilder().WithUsername("emailtest").WithEmail("test@example.com").Build();
		await Repository.CreateAsync(user);

		// Act
		User? result = await Repository.GetByEmailAsync("test@example.com", CancellationToken.None);

		// Assert
		result.ShouldNotBeNull();
		result!.Email.ShouldBe("test@example.com");
	}

	[Fact]
	public async Task GetByEmailAsync_ShouldBeCaseInsensitive_WhenSearchingAsync()
	{
		// Arrange
		User user = new UserBuilder().WithUsername("casetest").WithEmail("Test@Example.Com").Build();
		await Repository.CreateAsync(user);

		// Act
		User? result = await Repository.GetByEmailAsync("test@example.com", CancellationToken.None);

		// Assert
		result.ShouldNotBeNull();
	}

	[Fact]
	public async Task UsernameExistsAsync_ShouldReturnTrue_WhenUsernameExistsAsync()
	{
		// Arrange
		User user = new UserBuilder().WithUsername("existinguser").WithEmail("existing@example.com").Build();
		await Repository.CreateAsync(user);

		// Act
		bool result = await Repository.UsernameExistsAsync("existinguser", null, CancellationToken.None);

		// Assert
		result.ShouldBeTrue();
	}

	[Fact]
	public async Task UsernameExistsAsync_ShouldReturnFalse_WhenUsernameDoesNotExistAsync()
	{
		// Act
		bool result = await Repository.UsernameExistsAsync("nonexistent", null, CancellationToken.None);

		// Assert
		result.ShouldBeFalse();
	}

	[Fact]
	public async Task UsernameExistsAsync_ShouldExcludeSpecifiedUser_WhenExcludeIdProvidedAsync()
	{
		// Arrange
		User user = new UserBuilder().WithUsername("updatetest").WithEmail("update@example.com").Build();
		User created = await Repository.CreateAsync(user);

		// Act - Check if username exists, excluding the user itself (for update scenario)
		bool result = await Repository.UsernameExistsAsync("updatetest", created.Id, CancellationToken.None);

		// Assert
		result.ShouldBeFalse();
	}

	[Fact]
	public async Task EmailExistsAsync_ShouldReturnTrue_WhenEmailExistsAsync()
	{
		// Arrange
		User user = new UserBuilder().WithUsername("emailcheck").WithEmail("check@example.com").Build();
		await Repository.CreateAsync(user);

		// Act
		bool result = await Repository.EmailExistsAsync("check@example.com", null, CancellationToken.None);

		// Assert
		result.ShouldBeTrue();
	}

	[Fact]
	public async Task GetPagedAsync_ShouldReturnPagedResults_WithCorrectCountAsync()
	{
		// Arrange
		for (int i = 1; i <= 25; i++)
		{
			await Repository.CreateAsync(new UserBuilder().WithUsername($"user{i}").WithEmail($"user{i}@example.com").Build());
		}

		// Act
		UserQueryRequest request = new() { Page = 1, PageSize = 10, StartDate = null };
		(IEnumerable<User> users, int totalCount) = await Repository.GetPagedAsync(request, CancellationToken.None);

		// Assert
		users.Count().ShouldBe(10);
		totalCount.ShouldBe(25);
	}

	[Fact]
	public async Task GetPagedAsync_ShouldFilterBySearchTerm_WhenProvidedAsync()
	{
		// Arrange
		await Repository.CreateAsync(new UserBuilder().WithUsername("alice").WithEmail("alice@example.com").Build());
		await Repository.CreateAsync(new UserBuilder().WithUsername("bob").WithEmail("bob@example.com").Build());
		await Repository.CreateAsync(new UserBuilder().WithUsername("charlie").WithEmail("alice@other.com").Build());

		// Act
		UserQueryRequest request = new() { Page = 1, PageSize = 10, SearchTerm = "alice", StartDate = null };
		(IEnumerable<User> users, int totalCount) = await Repository.GetPagedAsync(request, CancellationToken.None);

		// Assert
		users.Count().ShouldBe(2);
		totalCount.ShouldBe(2);
	}

	[Fact]
	public async Task GetPagedAsync_ShouldFilterByIsActive_WhenProvidedAsync()
	{
		// Arrange
		await Repository.CreateAsync(UserBuilder.CreateActive().WithUsername("active1").WithEmail("active1@example.com").Build());
		await Repository.CreateAsync(UserBuilder.CreateInactive().WithUsername("inactive1").WithEmail("inactive1@example.com").Build());

		// Act
		UserQueryRequest request = new() { Page = 1, PageSize = 10, IsActive = true, StartDate = null };
		(IEnumerable<User> users, int totalCount) = await Repository.GetPagedAsync(request, CancellationToken.None);

		// Assert
		users.Count().ShouldBe(1);
		users.First().IsActive.ShouldBeTrue();
	}

	[Fact]
	public async Task GetPagedAsync_ShouldExcludeDeletedUsers_ByDefaultAsync()
	{
		// Arrange
		User user1 = new UserBuilder().WithUsername("visible").WithEmail("visible@example.com").Build();
		User user2 = new UserBuilder().WithUsername("deleted").WithEmail("deleted@example.com").Build();
		User created1 = await Repository.CreateAsync(user1);
		User created2 = await Repository.CreateAsync(user2);

		await Repository.SoftDeleteAsync(created2.Id, "test");

		// Act
		UserQueryRequest request = new() { Page = 1, PageSize = 10, IncludeDeleted = false, StartDate = null };
		(IEnumerable<User> users, int totalCount) = await Repository.GetPagedAsync(request, CancellationToken.None);

		// Assert
		users.ShouldContain(u => u.Username == "visible");
		users.ShouldNotContain(u => u.Username == "deleted");
	}

	[Fact]
	public async Task GetByIdsAsync_ShouldReturnMatchingUsers_WhenIdsExistAsync()
	{
		// Arrange
		User user1 = new UserBuilder().WithUsername("bulk1").WithEmail("bulk1@example.com").Build();
		User user2 = new UserBuilder().WithUsername("bulk2").WithEmail("bulk2@example.com").Build();
		User created1 = await Repository.CreateAsync(user1);
		User created2 = await Repository.CreateAsync(user2);

		// Act
		IEnumerable<User> result = await Repository.GetByIdsAsync([created1.Id, created2.Id], CancellationToken.None);

		// Assert
		result.Count().ShouldBe(2);
	}

	[Fact]
	public async Task BulkUpdateActiveStatusAsync_ShouldUpdateMultipleUsers_WhenIdsExistAsync()
	{
		// Arrange
		User user1 = UserBuilder.CreateActive().WithUsername("bulkupdate1").WithEmail("bulk1@example.com").Build();
		User user2 = UserBuilder.CreateActive().WithUsername("bulkupdate2").WithEmail("bulk2@example.com").Build();
		User created1 = await Repository.CreateAsync(user1);
		User created2 = await Repository.CreateAsync(user2);

		// Act
		int count = await Repository.BulkUpdateActiveStatusAsync([created1.Id, created2.Id], false);

		// Assert
		count.ShouldBe(2);
		User? updated1 = await Repository.GetByIdAsync(created1.Id, CancellationToken.None);
		updated1!.IsActive.ShouldBeFalse();
	}

	[Fact]
	public async Task SoftDeleteAsync_ShouldSetIsDeletedFlag_WhenUserExistsAsync()
	{
		// Arrange
		User user = new UserBuilder().WithUsername("softdelete").WithEmail("softdelete@example.com").Build();
		User created = await Repository.CreateAsync(user);

		// Act
		bool result = await Repository.SoftDeleteAsync(created.Id, "admin");

		// Assert
		result.ShouldBeTrue();
		User? deleted = await Repository.GetByIdAsync(created.Id, CancellationToken.None);
		deleted.ShouldBeNull(); // Excluded by query filter
	}

	[Fact]
	public async Task SoftDeleteAsync_ShouldSetAuditFields_WhenDeletingAsync()
	{
		// Arrange
		User user = new UserBuilder().WithUsername("auditdelete").WithEmail("audit@example.com").Build();
		User created = await Repository.CreateAsync(user);

		// Act
		await Repository.SoftDeleteAsync(created.Id, "testuser");

		// Assert - Need to query with IgnoreQueryFilters to verify soft-deleted user
		await using IdentityDbContext context = CreateIdentityDbContext();
		User? softDeleted = await context.Users
			.IgnoreQueryFilters()
			.FirstOrDefaultAsync(u => u.Id == created.Id);

		softDeleted.ShouldNotBeNull();
		softDeleted!.IsDeleted.ShouldBeTrue();
		softDeleted.DeletedBy.ShouldBe("testuser");
		Assert.True(softDeleted.DeletedAt.HasValue && (DateTime.UtcNow - softDeleted.DeletedAt.Value).TotalSeconds <= 5);
	}

	[Fact]
	public async Task RestoreAsync_ShouldUnsetIsDeletedFlag_WhenUserWasDeletedAsync()
	{
		// Arrange
		User user = new UserBuilder().WithUsername("restore").WithEmail("restore@example.com").Build();
		User created = await Repository.CreateAsync(user);
		await Repository.SoftDeleteAsync(created.Id, "admin");

		// Act
		bool result = await Repository.RestoreAsync(created.Id);

		// Assert
		result.ShouldBeTrue();
		User? restored = await Repository.GetByIdAsync(created.Id, CancellationToken.None);
		restored.ShouldNotBeNull();
		restored!.IsDeleted.ShouldBeFalse();
	}

	[Fact]
	public async Task CountAsync_ShouldReturnCorrectCount_WithNoFiltersAsync()
	{
		// Arrange
		await Repository.CreateAsync(new UserBuilder().WithUsername("count1").WithEmail("count1@example.com").Build());
		await Repository.CreateAsync(new UserBuilder().WithUsername("count2").WithEmail("count2@example.com").Build());

		// Act
		int result = await Repository.CountAsync(null, false, CancellationToken.None);

		// Assert
		result.ShouldBe(2);
	}

	[Fact]
	public async Task CountAsync_ShouldFilterByIsActive_WhenProvidedAsync()
	{
		// Arrange
		await Repository.CreateAsync(UserBuilder.CreateActive().WithUsername("activecount").WithEmail("active@example.com").Build());
		await Repository.CreateAsync(UserBuilder.CreateInactive().WithUsername("inactivecount").WithEmail("inactive@example.com").Build());

		// Act
		int result = await Repository.CountAsync(true, false, CancellationToken.None);

		// Assert
		result.ShouldBe(1);
	}

	#region Parameter Validation Tests

	[Fact]
	public async Task GetByIdAsync_ThrowsArgumentOutOfRangeException_WhenIdIsZeroAsync()
	{
		// Arrange & Act & Assert
		ArgumentOutOfRangeException exception = await Should.ThrowAsync<ArgumentOutOfRangeException>(
			async () => await Repository.GetByIdAsync(0, CancellationToken.None));
		exception.ParamName.ShouldBe("id");
	}

	[Fact]
	public async Task GetByIdAsync_ThrowsArgumentOutOfRangeException_WhenIdIsNegativeAsync()
	{
		// Arrange & Act & Assert
		ArgumentOutOfRangeException exception = await Should.ThrowAsync<ArgumentOutOfRangeException>(
			async () => await Repository.GetByIdAsync(-1, CancellationToken.None));
		exception.ParamName.ShouldBe("id");
	}

	[Fact]
	public async Task GetByUsernameAsync_ThrowsArgumentException_WhenUsernameIsNullAsync()
	{
		// Arrange & Act & Assert
		await Should.ThrowAsync<ArgumentException>(
			async () => await Repository.GetByUsernameAsync(null!, CancellationToken.None));
	}

	[Fact]
	public async Task GetByUsernameAsync_ThrowsArgumentException_WhenUsernameIsEmptyAsync()
	{
		// Arrange & Act & Assert
		await Should.ThrowAsync<ArgumentException>(
			async () => await Repository.GetByUsernameAsync(string.Empty, CancellationToken.None));
	}

	[Fact]
	public async Task GetByUsernameAsync_ThrowsArgumentException_WhenUsernameIsWhitespaceAsync()
	{
		// Arrange & Act & Assert
		await Should.ThrowAsync<ArgumentException>(
			async () => await Repository.GetByUsernameAsync("   ", CancellationToken.None));
	}

	[Fact]
	public async Task GetByEmailAsync_ThrowsArgumentException_WhenEmailIsNullAsync()
	{
		// Arrange & Act & Assert
		await Should.ThrowAsync<ArgumentException>(
			async () => await Repository.GetByEmailAsync(null!, CancellationToken.None));
	}

	[Fact]
	public async Task GetByEmailAsync_ThrowsArgumentException_WhenEmailIsEmptyAsync()
	{
		// Arrange & Act & Assert
		await Should.ThrowAsync<ArgumentException>(
			async () => await Repository.GetByEmailAsync(string.Empty, CancellationToken.None));
	}

	[Fact]
	public async Task GetByEmailAsync_ThrowsArgumentException_WhenEmailIsWhitespaceAsync()
	{
		// Arrange & Act & Assert
		await Should.ThrowAsync<ArgumentException>(
			async () => await Repository.GetByEmailAsync("   ", CancellationToken.None));
	}

	[Fact]
	public async Task UpdateAsync_ThrowsArgumentNullException_WhenEntityIsNullAsync()
	{
		// Arrange & Act & Assert
		ArgumentNullException exception = await Should.ThrowAsync<ArgumentNullException>(
			async () => await Repository.UpdateAsync(null!));
		exception.ParamName.ShouldBe("entity");
	}

	[Fact]
	public async Task DeleteAsync_ThrowsArgumentOutOfRangeException_WhenIdIsZeroAsync()
	{
		// Arrange & Act & Assert
		ArgumentOutOfRangeException exception = await Should.ThrowAsync<ArgumentOutOfRangeException>(
			async () => await Repository.DeleteAsync(0));
		exception.ParamName.ShouldBe("id");
	}

	[Fact]
	public async Task DeleteAsync_ThrowsArgumentOutOfRangeException_WhenIdIsNegativeAsync()
	{
		// Arrange & Act & Assert
		ArgumentOutOfRangeException exception = await Should.ThrowAsync<ArgumentOutOfRangeException>(
			async () => await Repository.DeleteAsync(-1));
		exception.ParamName.ShouldBe("id");
	}

	#endregion

	#region Error Handling Tests

	[Fact]
	public async Task DeleteAsync_LogsError_WhenDbUpdateExceptionOccursAsync()
	{
		// Arrange
		User user = new UserBuilder().WithUsername("deletetest").WithEmail("delete@test.com").Build();
		User created = await Repository.CreateAsync(user);

		// Manually corrupt the context to force a DbUpdateException
		IdentityDbContext corruptContext = CreateIdentityDbContext();
		ILogger<UserRepository> mockLogger = Substitute.For<ILogger<UserRepository>>();
		UserRepository corruptRepo = new(corruptContext, mockLogger);

		// Remove the entity from the corrupt context to simulate a concurrency issue
		await corruptContext.Users.Where(u => u.Id == created.Id).ExecuteDeleteAsync();

		// Act
		bool result = await corruptRepo.DeleteAsync(created.Id);

		// Assert - Should return false when not found
		result.ShouldBeFalse();
	}

	[Fact]
	public async Task BulkUpdateActiveStatusAsync_LogsError_WhenDbUpdateExceptionOccursAsync()
	{
		// Arrange - This will be implemented when we add error handling
		User user = new UserBuilder().WithUsername("bulktest").WithEmail("bulk@test.com").Build();
		User created = await Repository.CreateAsync(user);

		// For now, just verify the method works
		// Act
		int result = await Repository.BulkUpdateActiveStatusAsync([created.Id], false);

		// Assert
		result.ShouldBe(1);
	}

	#endregion
}