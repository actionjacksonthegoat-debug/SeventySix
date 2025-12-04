// <copyright file="TimestampStandardizationTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using SeventySix.Shared;
using Xunit;

namespace SeventySix.ArchitectureTests;

/// <summary>
/// Architectural tests to enforce timestamp standardization.
/// Ensures entities with timestamps use consistent naming (CreateDate, not CreatedAt).
/// </summary>
/// <remarks>
/// DRY: Timestamp naming should be consistent across all entities.
/// Entities with Id property should implement ICreatableEntity for AuditInterceptor auto-population.
/// </remarks>
public class TimestampStandardizationTests
{
	/// <summary>
	/// Entities with Id property that should implement ICreatableEntity.
	/// This allows AuditInterceptor to auto-populate CreateDate.
	/// </summary>
	private static readonly Type[] EntitiesThatShouldImplementICreatable =
	[
		typeof(SeventySix.Identity.RefreshToken),
		typeof(SeventySix.Identity.ExternalLogin),
		typeof(SeventySix.Identity.EmailVerificationToken),
		typeof(SeventySix.Identity.PasswordResetToken),
	];

	[Theory]
	[MemberData(nameof(GetEntitiesThatShouldImplementICreatable))]
	public void Entity_With_Id_Should_Implement_ICreatableEntity(Type entityType)
	{
		// Assert
		Assert.True(
			typeof(ICreatableEntity).IsAssignableFrom(entityType),
			$"{entityType.Name} should implement ICreatableEntity for AuditInterceptor auto-population");
	}

	[Theory]
	[MemberData(nameof(GetEntitiesThatShouldImplementICreatable))]
	public void Entity_Implementing_ICreatableEntity_Should_Have_CreateDate_Property(Type entityType)
	{
		// Arrange
		PropertyInfo? createDateProperty =
			entityType.GetProperty(
				"CreateDate",
				BindingFlags.Public | BindingFlags.Instance);

		// Assert
		Assert.NotNull(createDateProperty);
		Assert.Equal(typeof(DateTime), createDateProperty.PropertyType);
	}

	[Theory]
	[MemberData(nameof(GetEntitiesThatShouldImplementICreatable))]
	public void Entity_Should_Not_Have_CreatedAt_Property(Type entityType)
	{
		// Arrange - CreatedAt is deprecated, should use CreateDate
		PropertyInfo? createdAtProperty =
			entityType.GetProperty(
				"CreatedAt",
				BindingFlags.Public | BindingFlags.Instance);

		// Assert
		Assert.Null(createdAtProperty);
	}

	[Fact]
	public void UserCredential_Should_Have_CreateDate_Property()
	{
		// Arrange - UserCredential uses UserId as PK, so can't implement IEntity
		// But it should still use CreateDate for consistency
		Type userCredentialType = typeof(SeventySix.Identity.UserCredential);

		PropertyInfo? createDateProperty =
			userCredentialType.GetProperty(
				"CreateDate",
				BindingFlags.Public | BindingFlags.Instance);

		// Assert
		Assert.NotNull(createDateProperty);
		Assert.Equal(typeof(DateTime), createDateProperty.PropertyType);
	}

	[Fact]
	public void UserCredential_Should_Not_Have_CreatedAt_Property()
	{
		// Arrange
		Type userCredentialType = typeof(SeventySix.Identity.UserCredential);

		PropertyInfo? createdAtProperty =
			userCredentialType.GetProperty(
				"CreatedAt",
				BindingFlags.Public | BindingFlags.Instance);

		// Assert - CreatedAt is deprecated
		Assert.Null(createdAtProperty);
	}

	public static IEnumerable<object[]> GetEntitiesThatShouldImplementICreatable()
	{
		return EntitiesThatShouldImplementICreatable.Select(type => new object[] { type });
	}
}