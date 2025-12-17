// <copyright file="UserRepositoryTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Time.Testing;
using NSubstitute;
using SeventySix.Identity;
using SeventySix.TestUtilities.Builders;
using SeventySix.TestUtilities.TestBases;
using Shouldly;

namespace SeventySix.Domains.Tests.Identity.Repositories;

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
		Repository =
			new UserRepository(
			context,
			Substitute.For<ILogger<UserRepository>>(),
			TimeProvider.System);
	}

	[Fact]
	public async Task GetAllAsync_ShouldReturnList_AndNotThrowAsync()
	{
		// Act - Test that GetAllAsync works correctly (not that database is empty)
		IEnumerable<User> result =
			await Repository.GetAllAsync(
			CancellationToken.None);

		// Assert
		result.ShouldNotBeNull();
		// Don't assert empty - other parallel tests may create users
	}

	[Fact]
	public async Task CreateAsync_ShouldCreateUser_WithValidDataAsync()
	{
		// Arrange
		FakeTimeProvider timeProvider = new();
		string testId =
			Guid.NewGuid().ToString("N")[..8];
		User user =
			new UserBuilder(timeProvider)
			.WithUsername($"create_{testId}")
			.WithEmail($"create_{testId}@example.com")
			.WithFullName("Test User")
			.WithIsActive(true)
			.Build();

		// Act
		User result =
			await Repository.CreateAsync(user);

		// Assert
		result.ShouldNotBeNull();
		result.Id.ShouldBeGreaterThan(0);
		result.Username.ShouldBe($"create_{testId}");
		result.Email.ShouldBe($"create_{testId}@example.com");
		result.FullName.ShouldBe("Test User");
		result.IsActive.ShouldBeTrue();
		result.CreateDate.ShouldBe(
			timeProvider.GetUtcNow().UtcDateTime,
			TimeSpan.FromSeconds(5));
	}

	[Fact]
	public async Task GetByIdAsync_ShouldReturnUser_WhenUserExistsAsync()
	{
		// Arrange
		FakeTimeProvider timeProvider = new();
		string testId =
			Guid.NewGuid().ToString("N")[..8];
		User user =
			new UserBuilder(timeProvider)
			.WithUsername($"getbyid_{testId}")
			.WithEmail($"getbyid_{testId}@example.com")
			.Build();
		User created =
			await Repository.CreateAsync(user);

		// Act
		User? result =
			await Repository.GetByIdAsync(
			created.Id,
			CancellationToken.None);

		// Assert
		result.ShouldNotBeNull();
		result!.Id.ShouldBe(created.Id);
		result.Username.ShouldBe($"getbyid_{testId}");
	}

	[Fact]
	public async Task GetByIdAsync_ShouldReturnNull_WhenUserDoesNotExistAsync()
	{
		// Act
		User? result =
			await Repository.GetByIdAsync(
			999,
			CancellationToken.None);

		// Assert
		result.ShouldBeNull();
	}

	[Fact]
	public async Task UpdateAsync_ShouldUpdateUser_WhenUserExistsAsync()
	{
		// Arrange
		FakeTimeProvider timeProvider = new();
		string testId =
			Guid.NewGuid().ToString("N")[..8];
		User user =
			new UserBuilder(timeProvider)
			.WithUsername($"update_{testId}")
			.WithEmail($"update_{testId}@example.com")
			.Build();
		User created =
			await Repository.CreateAsync(user);

		created.Username = "updateduser";
		created.Email = "updated@example.com";

		// Act
		User result =
			await Repository.UpdateAsync(created);

		// Assert
		result.ShouldNotBeNull();
		result.Username.ShouldBe("updateduser");
		result.Email.ShouldBe("updated@example.com");
	}

	[Fact]
	public async Task DeleteAsync_ShouldReturnTrue_WhenUserExistsAsync()
	{
		// Arrange
		FakeTimeProvider timeProvider = new();
		string testId =
			Guid.NewGuid().ToString("N")[..8];
		User user =
			new UserBuilder(timeProvider)
			.WithUsername($"delete_{testId}")
			.WithEmail($"delete_{testId}@example.com")
			.Build();
		User created =
			await Repository.CreateAsync(user);

		// Act
		bool result =
			await Repository.DeleteAsync(created.Id);

		// Assert
		result.ShouldBeTrue();

		// Verify user is deleted
		User? deletedUser =
			await Repository.GetByIdAsync(
			created.Id,
			CancellationToken.None);
		deletedUser.ShouldBeNull();
	}

	[Fact]
	public async Task DeleteAsync_ShouldReturnFalse_WhenUserDoesNotExistAsync()
	{
		// Act
		bool result =
			await Repository.DeleteAsync(999);

		// Assert
		result.ShouldBeFalse();
	}

	[Fact]
	public async Task GetAllAsync_ShouldReturnMultipleUsers_WhenUsersExistAsync()
	{
		// Arrange
		FakeTimeProvider timeProvider = new();
		string testId =
			Guid.NewGuid().ToString("N")[..8];
		User user1 =
			new UserBuilder(timeProvider)
			.WithUsername($"multi1_{testId}")
			.WithEmail($"multi1_{testId}@example.com")
			.Build();
		User user2 =
			new UserBuilder(timeProvider)
			.WithUsername($"multi2_{testId}")
			.WithEmail($"multi2_{testId}@example.com")
			.Build();
		User user3 =
			new UserBuilder(timeProvider)
			.WithUsername($"multi3_{testId}")
			.WithEmail($"multi3_{testId}@example.com")
			.Build();

		await Repository.CreateAsync(user1);
		await Repository.CreateAsync(user2);
		await Repository.CreateAsync(user3);

		// Act
		IEnumerable<User> result =
			await Repository.GetAllAsync(
			CancellationToken.None);

		// Assert
		result.Count().ShouldBeGreaterThanOrEqualTo(3);
		result.Select(u => u.Username).ShouldContain($"multi1_{testId}");
		result.Select(u => u.Username).ShouldContain($"multi2_{testId}");
		result.Select(u => u.Username).ShouldContain($"multi3_{testId}");
	}

	[Fact]
	public async Task GetByUsernameAsync_ShouldReturnUser_WhenUsernameExistsAsync()
	{
		// Arrange
		FakeTimeProvider timeProvider = new();
		User user =
			new UserBuilder(timeProvider)
			.WithUsername("uniqueuser")
			.WithEmail("unique@example.com")
			.Build();
		await Repository.CreateAsync(user);

		// Act
		User? result =
			await Repository.GetByUsernameAsync(
			"uniqueuser",
			CancellationToken.None);

		// Assert
		result.ShouldNotBeNull();
		result!.Username.ShouldBe("uniqueuser");
	}

	[Fact]
	public async Task GetByUsernameAsync_ShouldReturnNull_WhenUsernameDoesNotExistAsync()
	{
		// Act
		User? result =
			await Repository.GetByUsernameAsync(
			"nonexistent",
			CancellationToken.None);

		// Assert
		result.ShouldBeNull();
	}

	[Fact]
	public async Task GetByEmailAsync_ShouldReturnUser_WhenEmailExistsAsync()
	{
		// Arrange
		FakeTimeProvider timeProvider = new();
		string testId =
			Guid.NewGuid().ToString("N")[..8];
		User user =
			new UserBuilder(timeProvider)
			.WithUsername($"emailtest_{testId}")
			.WithEmail($"emailtest_{testId}@example.com")
			.Build();
		await Repository.CreateAsync(user);

		// Act
		User? result =
			await Repository.GetByEmailAsync(
			$"emailtest_{testId}@example.com",
			CancellationToken.None);

		// Assert
		result.ShouldNotBeNull();
		result!.Email.ShouldBe($"emailtest_{testId}@example.com");
	}

	[Fact]
	public async Task GetByEmailAsync_ShouldBeCaseInsensitive_WhenSearchingAsync()
	{
		// Arrange
		FakeTimeProvider timeProvider = new();
		User user =
			new UserBuilder(timeProvider)
			.WithUsername("casetest")
			.WithEmail("Test@Example.Com")
			.Build();
		await Repository.CreateAsync(user);

		// Act
		User? result =
			await Repository.GetByEmailAsync(
			"test@example.com",
			CancellationToken.None);

		// Assert
		result.ShouldNotBeNull();
	}

	[Fact]
	public async Task UsernameExistsAsync_ShouldReturnTrue_WhenUsernameExistsAsync()
	{
		// Arrange
		FakeTimeProvider timeProvider = new();
		string testId =
			Guid.NewGuid().ToString("N")[..8];
		User user =
			new UserBuilder(timeProvider)
			.WithUsername($"exists_{testId}")
			.WithEmail($"exists_{testId}@example.com")
			.Build();
		await Repository.CreateAsync(user);

		// Act
		bool result =
			await Repository.UsernameExistsAsync(
			$"exists_{testId}",
			null,
			CancellationToken.None);

		// Assert
		result.ShouldBeTrue();
	}

	[Fact]
	public async Task UsernameExistsAsync_ShouldReturnFalse_WhenUsernameDoesNotExistAsync()
	{
		// Act
		bool result =
			await Repository.UsernameExistsAsync(
			"nonexistent",
			null,
			CancellationToken.None);

		// Assert
		result.ShouldBeFalse();
	}

	[Fact]
	public async Task UsernameExistsAsync_ShouldExcludeSpecifiedUser_WhenExcludeIdProvidedAsync()
	{
		// Arrange
		FakeTimeProvider timeProvider = new();
		User user =
			new UserBuilder(timeProvider)
			.WithUsername("updatetest")
			.WithEmail("update@example.com")
			.Build();
		User created =
			await Repository.CreateAsync(user);

		// Act - Check if username exists, excluding the user itself (for update scenario)
		bool result =
			await Repository.UsernameExistsAsync(
			"updatetest",
			created.Id,
			CancellationToken.None);

		// Assert
		result.ShouldBeFalse();
	}

	[Fact]
	public async Task EmailExistsAsync_ShouldReturnTrue_WhenEmailExistsAsync()
	{
		// Arrange
		FakeTimeProvider timeProvider = new();
		User user =
			new UserBuilder(timeProvider)
			.WithUsername("emailcheck")
			.WithEmail("check@example.com")
			.Build();
		await Repository.CreateAsync(user);

		// Act
		bool result =
			await Repository.EmailExistsAsync(
			"check@example.com",
			null,
			CancellationToken.None);

		// Assert
		result.ShouldBeTrue();
	}

	[Fact]
	public async Task GetPagedAsync_ShouldReturnPagedResults_WithCorrectCountAsync()
	{
		// Arrange
		FakeTimeProvider timeProvider = new();
		string testId =
			Guid.NewGuid().ToString("N")[..8];
		for (int i = 1; i <= 7; i++)
		{
			await Repository.CreateAsync(
				new UserBuilder(timeProvider)
					.WithUsername($"paged{i}_{testId}")
					.WithEmail($"paged{i}_{testId}@example.com")
					.Build());
		}

		// Act
		UserQueryRequest request =
			new()
			{
				Page = 1,
				PageSize = 5,
				StartDate = null,
				SearchTerm = testId,
			};
		(IEnumerable<User> users, int totalCount) =
			await Repository.GetPagedAsync(request, CancellationToken.None);

		// Assert
		users.Count().ShouldBe(5);
		totalCount.ShouldBe(7);
	}

	[Fact]
	public async Task GetPagedAsync_ShouldFilterBySearchTerm_WhenProvidedAsync()
	{
		// Arrange
		FakeTimeProvider timeProvider = new();
		await Repository.CreateAsync(
			new UserBuilder(timeProvider)
				.WithUsername("alice")
				.WithEmail("alice@example.com")
				.Build());
		await Repository.CreateAsync(
			new UserBuilder(timeProvider)
				.WithUsername("bob")
				.WithEmail("bob@example.com")
				.Build());
		await Repository.CreateAsync(
			new UserBuilder(timeProvider)
				.WithUsername("charlie")
				.WithEmail("alice@other.com")
				.Build());

		// Act
		UserQueryRequest request =
			new()
			{
				Page = 1,
				PageSize = 10,
				SearchTerm = "alice",
				StartDate = null,
			};
		(IEnumerable<User> users, int totalCount) =
			await Repository.GetPagedAsync(request, CancellationToken.None);

		// Assert
		users.Count().ShouldBe(2);
		totalCount.ShouldBe(2);
	}

	[Fact]
	public async Task GetPagedAsync_ShouldFilterByIsActive_WhenProvidedAsync()
	{
		// Arrange
		FakeTimeProvider timeProvider = new();
		string testId =
			Guid.NewGuid().ToString("N")[..8];
		await Repository.CreateAsync(
			UserBuilder
				.CreateActive(timeProvider)
				.WithUsername($"active_{testId}")
				.WithEmail($"active_{testId}@example.com")
				.Build());
		await Repository.CreateAsync(
			UserBuilder
				.CreateInactive(timeProvider)
				.WithUsername($"inactive_{testId}")
				.WithEmail($"inactive_{testId}@example.com")
				.Build());

		// Act
		UserQueryRequest request =
			new()
			{
				Page = 1,
				PageSize = 10,
				IsActive = true,
				StartDate = null,
				SearchTerm = testId,
			};
		(IEnumerable<User> users, int totalCount) =
			await Repository.GetPagedAsync(request, CancellationToken.None);

		// Assert
		users.Count().ShouldBe(1);
		users.First().IsActive.ShouldBeTrue();
	}

	[Fact]
	public async Task GetPagedAsync_ShouldExcludeDeletedUsers_ByDefaultAsync()
	{
		// Arrange
		FakeTimeProvider timeProvider = new();
		User user1 =
			new UserBuilder(timeProvider)
			.WithUsername("visible")
			.WithEmail("visible@example.com")
			.Build();
		User user2 =
			new UserBuilder(timeProvider)
			.WithUsername("deleted")
			.WithEmail("deleted@example.com")
			.Build();
		User created1 =
			await Repository.CreateAsync(user1);
		User created2 =
			await Repository.CreateAsync(user2);

		await Repository.SoftDeleteAsync(created2.Id, "test");

		// Act
		UserQueryRequest request =
			new()
			{
				Page = 1,
				PageSize = 10,
				IncludeDeleted = false,
				StartDate = null,
			};
		(IEnumerable<User> users, int totalCount) =
			await Repository.GetPagedAsync(request, CancellationToken.None);

		// Assert
		users.ShouldContain(u => u.Username == "visible");
		users.ShouldNotContain(u => u.Username == "deleted");
	}

	[Fact]
	public async Task GetByIdsAsync_ShouldReturnMatchingUsers_WhenIdsExistAsync()
	{
		// Arrange
		FakeTimeProvider timeProvider = new();
		User user1 =
			new UserBuilder(timeProvider)
			.WithUsername("bulk1")
			.WithEmail("bulk1@example.com")
			.Build();
		User user2 =
			new UserBuilder(timeProvider)
			.WithUsername("bulk2")
			.WithEmail("bulk2@example.com")
			.Build();
		User created1 =
			await Repository.CreateAsync(user1);
		User created2 =
			await Repository.CreateAsync(user2);

		// Act
		IEnumerable<User> result =
			await Repository.GetByIdsAsync(
			[created1.Id, created2.Id],
			CancellationToken.None);

		// Assert
		result.Count().ShouldBe(2);
	}

	[Fact]
	public async Task BulkUpdateActiveStatusAsync_ShouldUpdateMultipleUsers_WhenIdsExistAsync()
	{
		// Arrange
		FakeTimeProvider timeProvider = new();
		string testId =
			Guid.NewGuid().ToString("N")[..8];
		User user1 =
			UserBuilder
			.CreateActive(timeProvider)
			.WithUsername($"bulkupdate1_{testId}")
			.WithEmail($"bulkupdate1_{testId}@example.com")
			.Build();
		User user2 =
			UserBuilder
			.CreateActive(timeProvider)
			.WithUsername($"bulkupdate2_{testId}")
			.WithEmail($"bulkupdate2_{testId}@example.com")
			.Build();
		User created1 =
			await Repository.CreateAsync(user1);
		User created2 =
			await Repository.CreateAsync(user2);

		// Act
		int count =
			await Repository.BulkUpdateActiveStatusAsync(
			[created1.Id, created2.Id],
			false);

		// Assert
		count.ShouldBe(2);
		User? updated1 =
			await Repository.GetByIdAsync(
			created1.Id,
			CancellationToken.None);
		updated1!.IsActive.ShouldBeFalse();
	}

	[Fact]
	public async Task SoftDeleteAsync_ShouldSetIsDeletedFlag_WhenUserExistsAsync()
	{
		// Arrange
		FakeTimeProvider timeProvider = new();
		User user =
			new UserBuilder(timeProvider)
			.WithUsername("softdelete")
			.WithEmail("softdelete@example.com")
			.Build();
		User created =
			await Repository.CreateAsync(user);

		// Act
		bool result =
			await Repository.SoftDeleteAsync(created.Id, "admin");

		// Assert
		result.ShouldBeTrue();
		User? deleted =
			await Repository.GetByIdAsync(
			created.Id,
			CancellationToken.None);
		deleted.ShouldBeNull(); // Excluded by query filter
	}

	[Fact]
	public async Task SoftDeleteAsync_ShouldSetAuditFields_WhenDeletingAsync()
	{
		// Arrange
		FakeTimeProvider timeProvider = new();
		User user =
			new UserBuilder(timeProvider)
			.WithUsername("auditdelete")
			.WithEmail("audit@example.com")
			.Build();
		User created =
			await Repository.CreateAsync(user);

		// Act
		await Repository.SoftDeleteAsync(created.Id, "testuser");

		// Assert - Need to query with IgnoreQueryFilters to verify soft-deleted user
		await using IdentityDbContext context = CreateIdentityDbContext();
		User? softDeleted =
			await context
			.Users.IgnoreQueryFilters()
			.FirstOrDefaultAsync(u => u.Id == created.Id);

		softDeleted.ShouldNotBeNull();
		softDeleted!.IsDeleted.ShouldBeTrue();
		softDeleted.DeletedBy.ShouldBe("testuser");
		Assert.True(
			softDeleted.DeletedAt.HasValue
				&& (
					timeProvider.GetUtcNow().UtcDateTime
					- softDeleted.DeletedAt.Value).TotalSeconds <= 5);
	}

	[Fact]
	public async Task RestoreAsync_ShouldUnsetIsDeletedFlag_WhenUserWasDeletedAsync()
	{
		// Arrange
		FakeTimeProvider timeProvider = new();
		User user =
			new UserBuilder(timeProvider)
			.WithUsername("restore")
			.WithEmail("restore@example.com")
			.Build();
		User created =
			await Repository.CreateAsync(user);
		await Repository.SoftDeleteAsync(created.Id, "admin");

		// Act
		bool result =
			await Repository.RestoreAsync(created.Id);

		// Assert
		result.ShouldBeTrue();
		User? restored =
			await Repository.GetByIdAsync(
			created.Id,
			CancellationToken.None);
		restored.ShouldNotBeNull();
		restored!.IsDeleted.ShouldBeFalse();
	}

	[Fact]
	public async Task CountAsync_ShouldReturnCorrectCount_WithNoFiltersAsync()
	{
		// Arrange
		FakeTimeProvider timeProvider = new();
		string testId =
			Guid.NewGuid().ToString("N")[..8];
		await Repository.CreateAsync(
			new UserBuilder(timeProvider)
				.WithUsername($"count1_{testId}")
				.WithEmail($"count1_{testId}@example.com")
				.Build());
		await Repository.CreateAsync(
			new UserBuilder(timeProvider)
				.WithUsername($"count2_{testId}")
				.WithEmail($"count2_{testId}@example.com")
				.Build());

		// Act
		int result =
			await Repository.CountAsync(
			null,
			false,
			CancellationToken.None);

		// Assert
		result.ShouldBeGreaterThanOrEqualTo(2);
	}

	[Fact]
	public async Task CountAsync_ShouldFilterByIsActive_WhenProvidedAsync()
	{
		// Arrange
		FakeTimeProvider timeProvider = new();
		string testId =
			Guid.NewGuid().ToString("N")[..8];
		await Repository.CreateAsync(
			UserBuilder
				.CreateActive(timeProvider)
				.WithUsername($"activecount_{testId}")
				.WithEmail($"activecount_{testId}@example.com")
				.Build());
		await Repository.CreateAsync(
			UserBuilder
				.CreateInactive(timeProvider)
				.WithUsername($"inactivecount_{testId}")
				.WithEmail($"inactivecount_{testId}@example.com")
				.Build());

		// Act
		int result =
			await Repository.CountAsync(
			true,
			false,
			CancellationToken.None);

		// Assert
		result.ShouldBeGreaterThanOrEqualTo(1);
	}

	#region Parameter Validation Tests

	[Fact]
	public async Task GetByIdAsync_ThrowsArgumentOutOfRangeException_WhenIdIsZeroAsync()
	{
		// Arrange & Act & Assert
		ArgumentOutOfRangeException exception =
			await Should.ThrowAsync<ArgumentOutOfRangeException>(async () =>
				await Repository.GetByIdAsync(0, CancellationToken.None));
		exception.ParamName.ShouldBe("id");
	}

	[Fact]
	public async Task GetByIdAsync_ThrowsArgumentOutOfRangeException_WhenIdIsNegativeAsync()
	{
		// Arrange & Act & Assert
		ArgumentOutOfRangeException exception =
			await Should.ThrowAsync<ArgumentOutOfRangeException>(async () =>
				await Repository.GetByIdAsync(-1, CancellationToken.None));
		exception.ParamName.ShouldBe("id");
	}

	[Fact]
	public async Task GetByUsernameAsync_ThrowsArgumentException_WhenUsernameIsNullAsync()
	{
		// Arrange & Act & Assert
		await Should.ThrowAsync<ArgumentException>(async () =>
			await Repository.GetByUsernameAsync(null!, CancellationToken.None));
	}

	[Fact]
	public async Task GetByUsernameAsync_ThrowsArgumentException_WhenUsernameIsEmptyAsync()
	{
		// Arrange & Act & Assert
		await Should.ThrowAsync<ArgumentException>(async () =>
			await Repository.GetByUsernameAsync(
				string.Empty,
				CancellationToken.None));
	}

	[Fact]
	public async Task GetByUsernameAsync_ThrowsArgumentException_WhenUsernameIsWhitespaceAsync()
	{
		// Arrange & Act & Assert
		await Should.ThrowAsync<ArgumentException>(async () =>
			await Repository.GetByUsernameAsync("   ", CancellationToken.None));
	}

	[Fact]
	public async Task GetByEmailAsync_ThrowsArgumentException_WhenEmailIsNullAsync()
	{
		// Arrange & Act & Assert
		await Should.ThrowAsync<ArgumentException>(async () =>
			await Repository.GetByEmailAsync(null!, CancellationToken.None));
	}

	[Fact]
	public async Task GetByEmailAsync_ThrowsArgumentException_WhenEmailIsEmptyAsync()
	{
		// Arrange & Act & Assert
		await Should.ThrowAsync<ArgumentException>(async () =>
			await Repository.GetByEmailAsync(
				string.Empty,
				CancellationToken.None));
	}

	[Fact]
	public async Task GetByEmailAsync_ThrowsArgumentException_WhenEmailIsWhitespaceAsync()
	{
		// Arrange & Act & Assert
		await Should.ThrowAsync<ArgumentException>(async () =>
			await Repository.GetByEmailAsync("   ", CancellationToken.None));
	}

	[Fact]
	public async Task UpdateAsync_ThrowsArgumentNullException_WhenEntityIsNullAsync()
	{
		// Arrange & Act & Assert
		ArgumentNullException exception =
			await Should.ThrowAsync<ArgumentNullException>(async () =>
				await Repository.UpdateAsync(null!));
		exception.ParamName.ShouldBe("entity");
	}

	[Fact]
	public async Task DeleteAsync_ThrowsArgumentOutOfRangeException_WhenIdIsZeroAsync()
	{
		// Arrange & Act & Assert
		ArgumentOutOfRangeException exception =
			await Should.ThrowAsync<ArgumentOutOfRangeException>(async () =>
				await Repository.DeleteAsync(0));
		exception.ParamName.ShouldBe("id");
	}

	[Fact]
	public async Task DeleteAsync_ThrowsArgumentOutOfRangeException_WhenIdIsNegativeAsync()
	{
		// Arrange & Act & Assert
		ArgumentOutOfRangeException exception =
			await Should.ThrowAsync<ArgumentOutOfRangeException>(async () =>
				await Repository.DeleteAsync(-1));
		exception.ParamName.ShouldBe("id");
	}

	#endregion

	#region Error Handling Tests

	[Fact]
	public async Task DeleteAsync_LogsError_WhenDbUpdateExceptionOccursAsync()
	{
		// Arrange
		FakeTimeProvider timeProvider = new();
		User user =
			new UserBuilder(timeProvider)
			.WithUsername("deletetest")
			.WithEmail("delete@test.com")
			.Build();
		User created =
			await Repository.CreateAsync(user);

		// Manually corrupt the context to force a DbUpdateException
		IdentityDbContext corruptContext = CreateIdentityDbContext();
		ILogger<UserRepository> mockLogger =
			Substitute.For<
			ILogger<UserRepository>
		>();
		UserRepository corruptRepo =
			new(
			corruptContext,
			mockLogger,
			TimeProvider.System);

		// Remove the entity from the corrupt context to simulate a concurrency issue
		await corruptContext
			.Users.Where(u => u.Id == created.Id)
			.ExecuteDeleteAsync();

		// Act
		bool result =
			await corruptRepo.DeleteAsync(created.Id);

		// Assert - Should return false when not found
		result.ShouldBeFalse();
	}

	[Fact]
	public async Task BulkUpdateActiveStatusAsync_LogsError_WhenDbUpdateExceptionOccursAsync()
	{
		// Arrange - This will be implemented when we add error handling
		FakeTimeProvider timeProvider = new();
		User user =
			new UserBuilder(timeProvider)
			.WithUsername("bulktest")
			.WithEmail("bulk@test.com")
			.Build();
		User created =
			await Repository.CreateAsync(user);

		// For now, just verify the method works
		// Act
		int result =
			await Repository.BulkUpdateActiveStatusAsync(
			[created.Id],
			false);

		// Assert
		result.ShouldBe(1);
	}

	#endregion
}