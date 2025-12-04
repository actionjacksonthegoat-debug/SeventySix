// <copyright file="UserBuilder.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using SeventySix.Identity;
using SeventySix.TestUtilities.Constants;

namespace SeventySix.TestUtilities.Builders;

/// <summary>
/// Fluent builder for creating User entities in tests.
/// </summary>
/// <remarks>
/// Provides a convenient way to create User entities with default test values.
/// Reduces boilerplate code in test setup.
///
/// Usage:
/// <code>
/// User user = new UserBuilder()
///     .WithUsername("testuser")
///     .WithEmail("test@example.com")
///     .Build();
/// </code>
///
/// Design Patterns:
/// - Builder Pattern: Fluent API for constructing complex objects
/// - Test Data Builder: Specialized builder for test data
/// </remarks>
public class UserBuilder
{
	private string Username = TestUserConstants.DefaultUsername;
	private string Email = TestUserConstants.DefaultEmail;
	private string? FullName = TestUserConstants.DefaultFullName;
	private DateTime CreateDate = DateTime.UtcNow;
	private string? CreatedBy = TestAuditConstants.SystemUser;
	private DateTime? ModifyDate = null;
	private string? ModifiedBy = null;
	private bool IsActive = true;
	private bool IsDeleted = false;
	private DateTime? DeletedAt = null;
	private string? DeletedBy = null;
	private uint? RowVersion = null;
	private string? Preferences = null;
	private DateTime? LastLoginAt = null;
	private string? LastLoginIp = null;

	/// <summary>
	/// Sets the username.
	/// </summary>
	/// <param name="username">The username.</param>
	/// <returns>The builder instance for method chaining.</returns>
	public UserBuilder WithUsername(string username)
	{
		Username = username;
		return this;
	}

	/// <summary>
	/// Sets the email address.
	/// </summary>
	/// <param name="email">The email address.</param>
	/// <returns>The builder instance for method chaining.</returns>
	public UserBuilder WithEmail(string email)
	{
		Email = email;
		return this;
	}

	/// <summary>
	/// Sets the full name.
	/// </summary>
	/// <param name="fullName">The full name.</param>
	/// <returns>The builder instance for method chaining.</returns>
	public UserBuilder WithFullName(string? fullName)
	{
		FullName = fullName;
		return this;
	}

	/// <summary>
	/// Sets the created audit fields.
	/// </summary>
	/// <param name="createDate">The creation CreateDate.</param>
	/// <param name="createdBy">The creator identifier.</param>
	/// <returns>The builder instance for method chaining.</returns>
	public UserBuilder WithCreatedInfo(DateTime createDate, string? createdBy = TestAuditConstants.SystemUser)
	{
		CreateDate = createDate;
		CreatedBy = createdBy;
		return this;
	}

	/// <summary>
	/// Sets the modified audit fields.
	/// </summary>
	/// <param name="modifyDate">The modification CreateDate.</param>
	/// <param name="modifiedBy">The modifier identifier.</param>
	/// <returns>The builder instance for method chaining.</returns>
	public UserBuilder WithModifiedInfo(DateTime modifyDate, string? modifiedBy = TestAuditConstants.SystemUser)
	{
		ModifyDate = modifyDate;
		ModifiedBy = modifiedBy;
		return this;
	}

	/// <summary>
	/// Sets the active status.
	/// </summary>
	/// <param name="isActive">Whether the user is active.</param>
	/// <returns>The builder instance for method chaining.</returns>
	public UserBuilder WithIsActive(bool isActive)
	{
		IsActive = isActive;
		return this;
	}

	/// <summary>
	/// Sets the deleted status and audit fields.
	/// </summary>
	/// <param name="isDeleted">Whether the user is deleted.</param>
	/// <param name="deletedAt">The deletion CreateDate.</param>
	/// <param name="deletedBy">The deleter identifier.</param>
	/// <returns>The builder instance for method chaining.</returns>
	public UserBuilder WithDeletedInfo(bool isDeleted, DateTime? deletedAt = null, string? deletedBy = null)
	{
		IsDeleted = isDeleted;
		DeletedAt = deletedAt;
		DeletedBy = deletedBy;
		return this;
	}

	/// <summary>
	/// Sets the row version for concurrency control.
	/// </summary>
	/// <param name="rowVersion">The row version.</param>
	/// <returns>The builder instance for method chaining.</returns>
	public UserBuilder WithRowVersion(uint? rowVersion)
	{
		RowVersion = rowVersion;
		return this;
	}

	/// <summary>
	/// Sets the user preferences as JSON.
	/// </summary>
	/// <param name="preferences">The preferences JSON.</param>
	/// <returns>The builder instance for method chaining.</returns>
	public UserBuilder WithPreferences(string? preferences)
	{
		Preferences = preferences;
		return this;
	}

	/// <summary>
	/// Sets the last login information.
	/// </summary>
	/// <param name="lastLoginAt">The last login CreateDate.</param>
	/// <param name="lastLoginIp">The last login IP address.</param>
	/// <returns>The builder instance for method chaining.</returns>
	public UserBuilder WithLastLogin(DateTime lastLoginAt, string? lastLoginIp = null)
	{
		LastLoginAt = lastLoginAt;
		LastLoginIp = lastLoginIp;
		return this;
	}

	/// <summary>
	/// Builds the User entity with the configured values.
	/// </summary>
	/// <returns>A new User instance.</returns>
	public User Build()
	{
		return new User
		{
			Username = Username,
			Email = Email,
			FullName = FullName,
			CreateDate = CreateDate,
			CreatedBy = CreatedBy ?? string.Empty,
			ModifyDate = ModifyDate,
			ModifiedBy = ModifiedBy ?? string.Empty,
			IsActive = IsActive,
			IsDeleted = IsDeleted,
			DeletedAt = DeletedAt,
			DeletedBy = DeletedBy,
			RowVersion = RowVersion,
			Preferences = Preferences,
			LastLoginAt = LastLoginAt,
			LastLoginIp = LastLoginIp,
		};
	}

	/// <summary>
	/// Creates a default active user.
	/// </summary>
	/// <returns>A new UserBuilder configured for an active user.</returns>
	public static UserBuilder CreateActive()
	{
		return new UserBuilder().WithIsActive(true);
	}

	/// <summary>
	/// Creates a default inactive user.
	/// </summary>
	/// <returns>A new UserBuilder configured for an inactive user.</returns>
	public static UserBuilder CreateInactive()
	{
		return new UserBuilder().WithIsActive(false);
	}

	/// <summary>
	/// Creates a default deleted user.
	/// </summary>
	/// <returns>A new UserBuilder configured for a deleted user.</returns>
	public static UserBuilder CreateDeleted()
	{
		return new UserBuilder()
			.WithDeletedInfo(true, DateTime.UtcNow, TestAuditConstants.SystemUser);
	}
}