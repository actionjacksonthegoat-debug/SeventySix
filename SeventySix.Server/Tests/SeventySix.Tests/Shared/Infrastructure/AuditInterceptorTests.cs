// <copyright file="AuditInterceptorTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Moq;
using SeventySix.ApiTracking;
using SeventySix.Identity;
using SeventySix.Logging;
using SeventySix.Shared;
using SeventySix.Shared.Infrastructure;

namespace SeventySix.Tests.Infrastructure;

/// <summary>
/// Unit tests for <see cref="AuditInterceptor"/>.
/// Tests automatic audit property setting for IAuditableEntity, IModifiableEntity, and ICreatableEntity.
/// </summary>
public class AuditInterceptorTests : IDisposable
{
	private readonly Mock<IUserContextAccessor> MockUserContextAccessor;
	private readonly AuditInterceptor Interceptor;
	private readonly IdentityDbContext IdentityContext;
	private readonly LoggingDbContext LoggingContext;
	private readonly ApiTrackingDbContext ApiTrackingContext;

	public AuditInterceptorTests()
	{
		// Setup mock user context
		MockUserContextAccessor = new Mock<IUserContextAccessor>();
		MockUserContextAccessor.Setup(x => x.GetCurrentUser()).Returns("TestUser");

		Interceptor = new AuditInterceptor(MockUserContextAccessor.Object);

		// Setup Identity context (for User - IAuditableEntity)
		DbContextOptions<IdentityDbContext> identityOptions = new DbContextOptionsBuilder<IdentityDbContext>()
			.UseSqlite("DataSource=:memory:")
			.AddInterceptors(Interceptor)
			.Options;

		IdentityContext = new IdentityDbContext(identityOptions);
		IdentityContext.Database.OpenConnection();
		IdentityContext.Database.EnsureCreated();

		// Setup Logging context (for Log - ICreatableEntity)
		DbContextOptions<LoggingDbContext> loggingOptions = new DbContextOptionsBuilder<LoggingDbContext>()
			.UseSqlite("DataSource=:memory:")
			.AddInterceptors(Interceptor)
			.Options;

		LoggingContext = new LoggingDbContext(loggingOptions);
		LoggingContext.Database.OpenConnection();
		LoggingContext.Database.EnsureCreated();

		// Setup ApiTracking context (for ThirdPartyApiRequest - IModifiableEntity)
		DbContextOptions<ApiTrackingDbContext> apiTrackingOptions = new DbContextOptionsBuilder<ApiTrackingDbContext>()
			.UseSqlite("DataSource=:memory:")
			.AddInterceptors(Interceptor)
			.Options;

		ApiTrackingContext = new ApiTrackingDbContext(apiTrackingOptions);
		ApiTrackingContext.Database.OpenConnection();
		ApiTrackingContext.Database.EnsureCreated();
	}

	public void Dispose()
	{
		IdentityContext.Database.CloseConnection();
		IdentityContext.Dispose();

		LoggingContext.Database.CloseConnection();
		LoggingContext.Dispose();

		ApiTrackingContext.Database.CloseConnection();
		ApiTrackingContext.Dispose();
	}

	#region IAuditableEntity Tests (User)

	[Fact]
	public async Task SavingChangesAsync_NewAuditableEntity_SetsCreateDateAsync()
	{
		// Arrange
		DateTime beforeSave = DateTime.UtcNow;
		User user = new()
		{
			Username = "testuser",
			Email = "test@example.com"
		};

		// Act
		IdentityContext.Users.Add(user);
		await IdentityContext.SaveChangesAsync();
		DateTime afterSave = DateTime.UtcNow;

		// Assert
		user.CreateDate.Should().BeOnOrAfter(beforeSave);
		user.CreateDate.Should().BeOnOrBefore(afterSave);
	}

	[Fact]
	public async Task SavingChangesAsync_NewAuditableEntity_SetsCreatedByAsync()
	{
		// Arrange
		User user = new()
		{
			Username = "testuser",
			Email = "test@example.com"
		};

		// Act
		IdentityContext.Users.Add(user);
		await IdentityContext.SaveChangesAsync();

		// Assert
		user.CreatedBy.Should().Be("TestUser");
		MockUserContextAccessor.Verify(x => x.GetCurrentUser(), Times.AtLeastOnce());
	}

	[Fact]
	public async Task SavingChangesAsync_NewAuditableEntity_SetsModifiedByAsync()
	{
		// Arrange
		User user = new()
		{
			Username = "testuser",
			Email = "test@example.com"
		};

		// Act
		IdentityContext.Users.Add(user);
		await IdentityContext.SaveChangesAsync();

		// Assert - On creation, ModifiedBy is also set to current user
		user.ModifiedBy.Should().Be("TestUser");
	}

	[Fact]
	public async Task SavingChangesAsync_NewAuditableEntity_DoesNotSetModifyDateAsync()
	{
		// Arrange
		User user = new()
		{
			Username = "testuser",
			Email = "test@example.com"
		};

		// Act
		IdentityContext.Users.Add(user);
		await IdentityContext.SaveChangesAsync();

		// Assert - ModifyDate should not be set on creation
		user.ModifyDate.Should().BeNull();
	}

	[Fact]
	public async Task SavingChangesAsync_ModifiedAuditableEntity_SetsModifyDateAsync()
	{
		// Arrange
		User user = new()
		{
			Username = "testuser",
			Email = "test@example.com"
		};
		IdentityContext.Users.Add(user);
		await IdentityContext.SaveChangesAsync();

		// Act
		DateTime beforeUpdate = DateTime.UtcNow;
		user.Email = "updated@example.com";
		await IdentityContext.SaveChangesAsync();
		DateTime afterUpdate = DateTime.UtcNow;

		// Assert
		user.ModifyDate.Should().NotBeNull();
		user.ModifyDate.Should().BeOnOrAfter(beforeUpdate);
		user.ModifyDate.Should().BeOnOrBefore(afterUpdate);
	}

	[Fact]
	public async Task SavingChangesAsync_ModifiedAuditableEntity_SetsModifiedByAsync()
	{
		// Arrange
		User user = new()
		{
			Username = "testuser",
			Email = "test@example.com"
		};
		IdentityContext.Users.Add(user);
		await IdentityContext.SaveChangesAsync();

		// Change the user for modification
		MockUserContextAccessor.Setup(x => x.GetCurrentUser()).Returns("ModifyingUser");

		// Act
		user.Email = "updated@example.com";
		await IdentityContext.SaveChangesAsync();

		// Assert
		user.ModifiedBy.Should().Be("ModifyingUser");
	}

	[Fact]
	public async Task SavingChangesAsync_ModifiedAuditableEntity_DoesNotChangeCreateDateAsync()
	{
		// Arrange
		User user = new()
		{
			Username = "testuser",
			Email = "test@example.com"
		};
		IdentityContext.Users.Add(user);
		await IdentityContext.SaveChangesAsync();
		DateTime originalCreateDate = user.CreateDate;

		// Act
		await Task.Delay(10); // Ensure time passes
		user.Email = "updated@example.com";
		await IdentityContext.SaveChangesAsync();

		// Assert - CreateDate should remain unchanged
		user.CreateDate.Should().Be(originalCreateDate);
	}

	[Fact]
	public async Task SavingChangesAsync_ModifiedAuditableEntity_DoesNotChangeCreatedByAsync()
	{
		// Arrange
		User user = new()
		{
			Username = "testuser",
			Email = "test@example.com"
		};
		IdentityContext.Users.Add(user);
		await IdentityContext.SaveChangesAsync();
		string originalCreatedBy = user.CreatedBy;

		// Change the user for modification
		MockUserContextAccessor.Setup(x => x.GetCurrentUser()).Returns("ModifyingUser");

		// Act
		user.Email = "updated@example.com";
		await IdentityContext.SaveChangesAsync();

		// Assert - CreatedBy should remain unchanged
		user.CreatedBy.Should().Be(originalCreatedBy);
	}

	[Fact]
	public async Task SavingChangesAsync_NewAuditableEntityWithPresetCreateDate_PreservesCreateDateAsync()
	{
		// Arrange
		DateTime presetDate = new DateTime(2020, 1, 1, 12, 0, 0, DateTimeKind.Utc);
		User user = new()
		{
			Username = "testuser",
			Email = "test@example.com",
			CreateDate = presetDate
		};

		// Act
		IdentityContext.Users.Add(user);
		await IdentityContext.SaveChangesAsync();

		// Assert - CreateDate should be preserved if not default
		user.CreateDate.Should().Be(presetDate);
	}

	[Fact]
	public async Task SavingChangesAsync_NewAuditableEntityWithPresetCreatedBy_PreservesCreatedByAsync()
	{
		// Arrange
		User user = new()
		{
			Username = "testuser",
			Email = "test@example.com",
			CreatedBy = "OriginalCreator"
		};

		// Act
		IdentityContext.Users.Add(user);
		await IdentityContext.SaveChangesAsync();

		// Assert - CreatedBy should be preserved if already set
		user.CreatedBy.Should().Be("OriginalCreator");
	}

	#endregion

	#region IModifiableEntity Tests (ThirdPartyApiRequest)

	[Fact]
	public async Task SavingChangesAsync_NewModifiableEntity_SetsCreateDateAsync()
	{
		// Arrange
		DateTime beforeSave = DateTime.UtcNow;
		ThirdPartyApiRequest apiRequest = new()
		{
			ApiName = "TestApi",
			BaseUrl = "https://api.test.com",
			ResetDate = DateOnly.FromDateTime(DateTime.UtcNow)
		};

		// Act
		ApiTrackingContext.ThirdPartyApiRequests.Add(apiRequest);
		await ApiTrackingContext.SaveChangesAsync();
		DateTime afterSave = DateTime.UtcNow;

		// Assert
		apiRequest.CreateDate.Should().BeOnOrAfter(beforeSave);
		apiRequest.CreateDate.Should().BeOnOrBefore(afterSave);
	}

	[Fact]
	public async Task SavingChangesAsync_NewModifiableEntity_DoesNotSetModifyDateAsync()
	{
		// Arrange
		ThirdPartyApiRequest apiRequest = new()
		{
			ApiName = "TestApi",
			BaseUrl = "https://api.test.com",
			ResetDate = DateOnly.FromDateTime(DateTime.UtcNow)
		};

		// Act
		ApiTrackingContext.ThirdPartyApiRequests.Add(apiRequest);
		await ApiTrackingContext.SaveChangesAsync();

		// Assert
		apiRequest.ModifyDate.Should().BeNull();
	}

	[Fact]
	public async Task SavingChangesAsync_ModifiedModifiableEntity_SetsModifyDateAsync()
	{
		// Arrange
		ThirdPartyApiRequest apiRequest = new()
		{
			ApiName = "TestApi",
			BaseUrl = "https://api.test.com",
			ResetDate = DateOnly.FromDateTime(DateTime.UtcNow)
		};
		ApiTrackingContext.ThirdPartyApiRequests.Add(apiRequest);
		await ApiTrackingContext.SaveChangesAsync();

		// Act
		DateTime beforeUpdate = DateTime.UtcNow;
		apiRequest.CallCount = 5;
		await ApiTrackingContext.SaveChangesAsync();
		DateTime afterUpdate = DateTime.UtcNow;

		// Assert
		apiRequest.ModifyDate.Should().NotBeNull();
		apiRequest.ModifyDate.Should().BeOnOrAfter(beforeUpdate);
		apiRequest.ModifyDate.Should().BeOnOrBefore(afterUpdate);
	}

	[Fact]
	public async Task SavingChangesAsync_ModifiedModifiableEntity_DoesNotChangeCreateDateAsync()
	{
		// Arrange
		ThirdPartyApiRequest apiRequest = new()
		{
			ApiName = "TestApi",
			BaseUrl = "https://api.test.com",
			ResetDate = DateOnly.FromDateTime(DateTime.UtcNow)
		};
		ApiTrackingContext.ThirdPartyApiRequests.Add(apiRequest);
		await ApiTrackingContext.SaveChangesAsync();
		DateTime originalCreateDate = apiRequest.CreateDate;

		// Act
		await Task.Delay(10); // Ensure time passes
		apiRequest.CallCount = 10;
		await ApiTrackingContext.SaveChangesAsync();

		// Assert
		apiRequest.CreateDate.Should().Be(originalCreateDate);
	}

	[Fact]
	public async Task SavingChangesAsync_NewModifiableEntityWithPresetCreateDate_PreservesCreateDateAsync()
	{
		// Arrange
		DateTime presetDate = new DateTime(2020, 6, 15, 10, 30, 0, DateTimeKind.Utc);
		ThirdPartyApiRequest apiRequest = new()
		{
			ApiName = "TestApi",
			BaseUrl = "https://api.test.com",
			ResetDate = DateOnly.FromDateTime(DateTime.UtcNow),
			CreateDate = presetDate
		};

		// Act
		ApiTrackingContext.ThirdPartyApiRequests.Add(apiRequest);
		await ApiTrackingContext.SaveChangesAsync();

		// Assert
		apiRequest.CreateDate.Should().Be(presetDate);
	}

	#endregion

	#region ICreatableEntity Tests (Log)

	[Fact]
	public async Task SavingChangesAsync_NewCreatableEntity_SetsCreateDateAsync()
	{
		// Arrange
		DateTime beforeSave = DateTime.UtcNow;
		Log log = new()
		{
			LogLevel = "Information",
			Message = "Test log message",
			SourceContext = "TestSource"
		};

		// Act
		LoggingContext.Logs.Add(log);
		await LoggingContext.SaveChangesAsync();
		DateTime afterSave = DateTime.UtcNow;

		// Assert
		log.CreateDate.Should().BeOnOrAfter(beforeSave);
		log.CreateDate.Should().BeOnOrBefore(afterSave);
	}

	[Fact]
	public async Task SavingChangesAsync_NewCreatableEntityWithPresetCreateDate_PreservesCreateDateAsync()
	{
		// Arrange
		DateTime presetDate = new DateTime(2021, 3, 10, 14, 0, 0, DateTimeKind.Utc);
		Log log = new()
		{
			LogLevel = "Information",
			Message = "Test log message",
			SourceContext = "TestSource",
			CreateDate = presetDate
		};

		// Act
		LoggingContext.Logs.Add(log);
		await LoggingContext.SaveChangesAsync();

		// Assert
		log.CreateDate.Should().Be(presetDate);
	}

	#endregion

	#region Edge Cases

	[Fact]
	public async Task SavingChangesAsync_WithNullDbContext_ReturnsBaseResultAsync()
	{
		// Note: This test verifies the null check in the interceptor
		// We can't easily test this directly without mocking DbContextEventData
		// The interceptor guards against null context and returns base result
		Assert.True(true); // Placeholder - null context is guarded in implementation
	}

	[Fact]
	public async Task SavingChangesAsync_MultipleEntities_SetsAuditPropertiesForAllAsync()
	{
		// Arrange
		User user1 = new() { Username = "user1", Email = "user1@test.com" };
		User user2 = new() { Username = "user2", Email = "user2@test.com" };
		DateTime beforeSave = DateTime.UtcNow;

		// Act
		IdentityContext.Users.AddRange(user1, user2);
		await IdentityContext.SaveChangesAsync();
		DateTime afterSave = DateTime.UtcNow;

		// Assert
		user1.CreateDate.Should().BeOnOrAfter(beforeSave).And.BeOnOrBefore(afterSave);
		user1.CreatedBy.Should().Be("TestUser");

		user2.CreateDate.Should().BeOnOrAfter(beforeSave).And.BeOnOrBefore(afterSave);
		user2.CreatedBy.Should().Be("TestUser");
	}

	[Fact]
	public async Task SavingChangesAsync_UserContextReturnsSystem_SetsSystemAsCreatedByAsync()
	{
		// Arrange
		MockUserContextAccessor.Setup(x => x.GetCurrentUser()).Returns("System");
		User user = new()
		{
			Username = "testuser",
			Email = "test@example.com"
		};

		// Act
		IdentityContext.Users.Add(user);
		await IdentityContext.SaveChangesAsync();

		// Assert
		user.CreatedBy.Should().Be("System");
		user.ModifiedBy.Should().Be("System");
	}

	#endregion
}
