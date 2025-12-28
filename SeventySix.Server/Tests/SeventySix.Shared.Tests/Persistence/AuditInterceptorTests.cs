// <copyright file="AuditInterceptorTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using NSubstitute;
using SeventySix.Shared.Entities;
using SeventySix.Shared.Interfaces;
using SeventySix.Shared.Persistence;
using Shouldly;

namespace SeventySix.Shared.Tests.Persistence;

/// <summary>
/// Unit tests for <see cref="AuditInterceptor"/>.
/// Tests automatic audit property setting for IAuditableEntity, IModifiableEntity, and ICreatableEntity.
/// </summary>
public class AuditInterceptorTests : IDisposable
{
	private const string TestUser = "TestUser";
	private const string SystemUser = "System";
	private const string ModifyingUser = "ModifyingUser";

	private readonly IUserContextAccessor MockUserContextAccessor;
	private readonly TestTimeProvider TimeProvider;
	private readonly AuditInterceptor Interceptor;
	private readonly TestDbContext Context;

	public AuditInterceptorTests()
	{
		MockUserContextAccessor =
			Substitute.For<IUserContextAccessor>();
		MockUserContextAccessor.GetCurrentUser().Returns(TestUser);

		TimeProvider = new TestTimeProvider();
		TimeProvider.SetUtcNow(
			new DateTimeOffset(2024, 1, 15, 10, 30, 0, TimeSpan.Zero));

		Interceptor =
			new AuditInterceptor(
			MockUserContextAccessor,
			TimeProvider);

		DbContextOptions<TestDbContext> options =
			new DbContextOptionsBuilder<TestDbContext>()
				.UseSqlite("DataSource=:memory:")
				.AddInterceptors(Interceptor)
				.Options;

		Context =
			new TestDbContext(options);
		Context.Database.OpenConnection();
		Context.Database.EnsureCreated();
	}

	public void Dispose()
	{
		Context.Database.CloseConnection();
		Context.Dispose();
	}

	#region IAuditableEntity Tests

	[Fact]
	public async Task SavingChangesAsync_NewAuditableEntity_SetsCreateDateAsync()
	{
		// Arrange
		TestAuditableEntity entity =
			new() { Name = "Test" };

		// Act
		Context.AuditableEntities.Add(entity);
		await Context.SaveChangesAsync();

		// Assert
		entity.CreateDate.ShouldBe(TimeProvider.GetUtcNow().UtcDateTime);
	}

	[Fact]
	public async Task SavingChangesAsync_NewAuditableEntity_SetsCreatedByAsync()
	{
		// Arrange
		TestAuditableEntity entity =
			new() { Name = "Test" };

		// Act
		Context.AuditableEntities.Add(entity);
		await Context.SaveChangesAsync();

		// Assert
		entity.CreatedBy.ShouldBe(TestUser);
		MockUserContextAccessor.Received().GetCurrentUser();
	}

	[Fact]
	public async Task SavingChangesAsync_NewAuditableEntity_SetsModifiedByAsync()
	{
		// Arrange
		TestAuditableEntity entity =
			new() { Name = "Test" };

		// Act
		Context.AuditableEntities.Add(entity);
		await Context.SaveChangesAsync();

		// Assert - On creation, ModifiedBy is also set to current user
		entity.ModifiedBy.ShouldBe(TestUser);
	}

	[Fact]
	public async Task SavingChangesAsync_NewAuditableEntity_DoesNotSetModifyDateAsync()
	{
		// Arrange
		TestAuditableEntity entity =
			new() { Name = "Test" };

		// Act
		Context.AuditableEntities.Add(entity);
		await Context.SaveChangesAsync();

		// Assert - ModifyDate should not be set on creation
		entity.ModifyDate.ShouldBeNull();
	}

	[Fact]
	public async Task SavingChangesAsync_ModifiedAuditableEntity_SetsModifyDateAsync()
	{
		// Arrange
		TestAuditableEntity entity =
			new() { Name = "Test" };
		Context.AuditableEntities.Add(entity);
		await Context.SaveChangesAsync();

		// Advance time for modification
		TimeProvider.SetUtcNow(
			new DateTimeOffset(2024, 1, 16, 12, 0, 0, TimeSpan.Zero));

		// Act
		entity.Name = "Updated";
		await Context.SaveChangesAsync();

		// Assert
		entity.ModifyDate.ShouldNotBeNull();
		entity.ModifyDate!.Value.ShouldBe(TimeProvider.GetUtcNow().UtcDateTime);
	}

	[Fact]
	public async Task SavingChangesAsync_ModifiedAuditableEntity_SetsModifiedByAsync()
	{
		// Arrange
		TestAuditableEntity entity =
			new() { Name = "Test" };
		Context.AuditableEntities.Add(entity);
		await Context.SaveChangesAsync();

		// Change the user for modification
		MockUserContextAccessor.GetCurrentUser().Returns(ModifyingUser);

		// Act
		entity.Name = "Updated";
		await Context.SaveChangesAsync();

		// Assert
		entity.ModifiedBy.ShouldBe(ModifyingUser);
	}

	[Fact]
	public async Task SavingChangesAsync_ModifiedAuditableEntity_DoesNotChangeCreateDateAsync()
	{
		// Arrange
		TestAuditableEntity entity =
			new() { Name = "Test" };
		Context.AuditableEntities.Add(entity);
		await Context.SaveChangesAsync();
		DateTime originalCreateDate = entity.CreateDate;

		// Advance time for modification
		TimeProvider.SetUtcNow(
			new DateTimeOffset(2024, 1, 16, 12, 0, 0, TimeSpan.Zero));

		// Act
		entity.Name = "Updated";
		await Context.SaveChangesAsync();

		// Assert - CreateDate should remain unchanged
		entity.CreateDate.ShouldBe(originalCreateDate);
	}

	[Fact]
	public async Task SavingChangesAsync_ModifiedAuditableEntity_DoesNotChangeCreatedByAsync()
	{
		// Arrange
		TestAuditableEntity entity =
			new() { Name = "Test" };
		Context.AuditableEntities.Add(entity);
		await Context.SaveChangesAsync();
		string originalCreatedBy = entity.CreatedBy;

		// Change the user for modification
		MockUserContextAccessor.GetCurrentUser().Returns(ModifyingUser);

		// Act
		entity.Name = "Updated";
		await Context.SaveChangesAsync();

		// Assert - CreatedBy should remain unchanged
		entity.CreatedBy.ShouldBe(originalCreatedBy);
	}

	[Fact]
	public async Task SavingChangesAsync_NewAuditableEntityWithPresetCreateDate_PreservesCreateDateAsync()
	{
		// Arrange
		DateTime presetDate =
			new DateTimeOffset(
				2020,
				1,
				1,
				12,
				0,
				0,
				TimeSpan.Zero).UtcDateTime;
		TestAuditableEntity entity =
			new()
			{
				Name = "Test",
				CreateDate = presetDate,
			};

		// Act
		Context.AuditableEntities.Add(entity);
		await Context.SaveChangesAsync();

		// Assert - CreateDate should be preserved if not default
		entity.CreateDate.ShouldBe(presetDate);
	}

	[Fact]
	public async Task SavingChangesAsync_NewAuditableEntityWithPresetCreatedBy_PreservesCreatedByAsync()
	{
		// Arrange
		TestAuditableEntity entity =
			new()
			{
				Name = "Test",
				CreatedBy = "OriginalCreator",
			};

		// Act
		Context.AuditableEntities.Add(entity);
		await Context.SaveChangesAsync();

		// Assert - CreatedBy should be preserved if already set
		entity.CreatedBy.ShouldBe("OriginalCreator");
	}

	#endregion

	#region IModifiableEntity Tests

	[Fact]
	public async Task SavingChangesAsync_NewModifiableEntity_SetsCreateDateAsync()
	{
		// Arrange
		TestModifiableEntity entity =
			new() { Name = "Test" };

		// Act
		Context.ModifiableEntities.Add(entity);
		await Context.SaveChangesAsync();

		// Assert
		entity.CreateDate.ShouldBe(TimeProvider.GetUtcNow().UtcDateTime);
	}

	[Fact]
	public async Task SavingChangesAsync_NewModifiableEntity_DoesNotSetModifyDateAsync()
	{
		// Arrange
		TestModifiableEntity entity =
			new() { Name = "Test" };

		// Act
		Context.ModifiableEntities.Add(entity);
		await Context.SaveChangesAsync();

		// Assert
		entity.ModifyDate.ShouldBeNull();
	}

	[Fact]
	public async Task SavingChangesAsync_ModifiedModifiableEntity_SetsModifyDateAsync()
	{
		// Arrange
		TestModifiableEntity entity =
			new() { Name = "Test" };
		Context.ModifiableEntities.Add(entity);
		await Context.SaveChangesAsync();

		// Advance time for modification
		TimeProvider.SetUtcNow(
			new DateTimeOffset(2024, 1, 16, 12, 0, 0, TimeSpan.Zero));

		// Act
		entity.Name = "Updated";
		await Context.SaveChangesAsync();

		// Assert
		entity.ModifyDate.ShouldNotBeNull();
		entity.ModifyDate!.Value.ShouldBe(TimeProvider.GetUtcNow().UtcDateTime);
	}

	[Fact]
	public async Task SavingChangesAsync_ModifiedModifiableEntity_DoesNotChangeCreateDateAsync()
	{
		// Arrange
		TestModifiableEntity entity =
			new() { Name = "Test" };
		Context.ModifiableEntities.Add(entity);
		await Context.SaveChangesAsync();
		DateTime originalCreateDate = entity.CreateDate;

		// Advance time for modification
		TimeProvider.SetUtcNow(
			new DateTimeOffset(2024, 1, 16, 12, 0, 0, TimeSpan.Zero));

		// Act
		entity.Name = "Updated";
		await Context.SaveChangesAsync();

		// Assert
		entity.CreateDate.ShouldBe(originalCreateDate);
	}

	[Fact]
	public async Task SavingChangesAsync_NewModifiableEntityWithPresetCreateDate_PreservesCreateDateAsync()
	{
		// Arrange
		DateTime presetDate =
			new DateTimeOffset(
				2020,
				6,
				15,
				10,
				30,
				0,
				TimeSpan.Zero).UtcDateTime;
		TestModifiableEntity entity =
			new()
			{
				Name = "Test",
				CreateDate = presetDate,
			};

		// Act
		Context.ModifiableEntities.Add(entity);
		await Context.SaveChangesAsync();

		// Assert
		entity.CreateDate.ShouldBe(presetDate);
	}

	#endregion

	#region ICreatableEntity Tests

	[Fact]
	public async Task SavingChangesAsync_NewCreatableEntity_SetsCreateDateAsync()
	{
		// Arrange
		TestCreatableEntity entity =
			new() { Name = "Test" };

		// Act
		Context.CreatableEntities.Add(entity);
		await Context.SaveChangesAsync();

		// Assert
		entity.CreateDate.ShouldBe(TimeProvider.GetUtcNow().UtcDateTime);
	}

	[Fact]
	public async Task SavingChangesAsync_NewCreatableEntityWithPresetCreateDate_PreservesCreateDateAsync()
	{
		// Arrange
		DateTime presetDate =
			new DateTimeOffset(
				2021,
				3,
				10,
				14,
				0,
				0,
				TimeSpan.Zero).UtcDateTime;
		TestCreatableEntity entity =
			new()
			{
				Name = "Test",
				CreateDate = presetDate,
			};

		// Act
		Context.CreatableEntities.Add(entity);
		await Context.SaveChangesAsync();

		// Assert
		entity.CreateDate.ShouldBe(presetDate);
	}

	#endregion

	#region Edge Cases

	[Fact]
	public async Task SavingChangesAsync_MultipleEntities_SetsAuditPropertiesForAllAsync()
	{
		// Arrange
		TestAuditableEntity entity1 =
			new() { Name = "Entity1" };
		TestAuditableEntity entity2 =
			new() { Name = "Entity2" };

		// Act
		Context.AuditableEntities.AddRange(entity1, entity2);
		await Context.SaveChangesAsync();

		// Assert
		entity1.CreateDate.ShouldBe(TimeProvider.GetUtcNow().UtcDateTime);
		entity1.CreatedBy.ShouldBe(TestUser);

		entity2.CreateDate.ShouldBe(TimeProvider.GetUtcNow().UtcDateTime);
		entity2.CreatedBy.ShouldBe(TestUser);
	}

	[Fact]
	public async Task SavingChangesAsync_UserContextReturnsSystem_SetsSystemAsCreatedByAsync()
	{
		// Arrange
		MockUserContextAccessor.GetCurrentUser().Returns(SystemUser);
		TestAuditableEntity entity =
			new() { Name = "Test" };

		// Act
		Context.AuditableEntities.Add(entity);
		await Context.SaveChangesAsync();

		// Assert
		entity.CreatedBy.ShouldBe(SystemUser);
		entity.ModifiedBy.ShouldBe(SystemUser);
	}

	#endregion

	#region Test Entities and DbContext

	private class TestAuditableEntity : IAuditableEntity
	{
		public long Id { get; set; }
		public string Name { get; set; } = string.Empty;
		public DateTime CreateDate { get; set; }
		public DateTime? ModifyDate { get; set; }
		public string CreatedBy { get; set; } = string.Empty;
		public string ModifiedBy { get; set; } = string.Empty;
	}

	private class TestModifiableEntity : IModifiableEntity
	{
		public long Id { get; set; }
		public string Name { get; set; } = string.Empty;
		public DateTime CreateDate { get; set; }
		public DateTime? ModifyDate { get; set; }
	}

	private class TestCreatableEntity : ICreatableEntity
	{
		public long Id { get; set; }
		public string Name { get; set; } = string.Empty;
		public DateTime CreateDate { get; set; }
	}

	private class TestDbContext(DbContextOptions<TestDbContext> options)
		: DbContext(options)
	{
		public DbSet<TestAuditableEntity> AuditableEntities { get; set; } =
			null!;
		public DbSet<TestModifiableEntity> ModifiableEntities { get; set; } =
			null!;
		public DbSet<TestCreatableEntity> CreatableEntities { get; set; } =
			null!;
	}

	#endregion

	#region TestTimeProvider

	private sealed class TestTimeProvider : TimeProvider
	{
		private DateTimeOffset CurrentTime = DateTimeOffset.UtcNow;

		public void SetUtcNow(DateTimeOffset time)
		{
			CurrentTime = time;
		}

		public override DateTimeOffset GetUtcNow()
		{
			return CurrentTime;
		}
	}

	#endregion
}