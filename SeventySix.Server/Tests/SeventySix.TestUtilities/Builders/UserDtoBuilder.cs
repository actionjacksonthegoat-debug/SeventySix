// <copyright file="UserDtoBuilder.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using SeventySix.Identity;
using SeventySix.Shared.Constants;

namespace SeventySix.TestUtilities.Builders;

/// <summary>
/// Builder for creating UserDto instances in tests.
/// Provides sensible defaults and fluent API for customization.
/// </summary>
public class UserDtoBuilder
{
	private readonly TimeProvider TimeProvider;
	private long Id = 1L;
	private string Username = "testuser";
	private string Email = "test@example.com";
	private string? FullName = null;
	private DateTimeOffset CreateDate;
	private bool IsActive = true;
	private string CreatedBy =
		AuditConstants.SystemUser;
	private DateTimeOffset? ModifyDate = null;
	private string ModifiedBy =
		AuditConstants.SystemUser;
	private DateTimeOffset? LastLoginAt = null;
	private bool IsDeleted = false;
	private DateTimeOffset? DeletedAt = null;
	private string? DeletedBy = null;

	/// <summary>
	/// Initializes a new instance of the <see cref="UserDtoBuilder"/> class.
	/// </summary>
	/// <param name="timeProvider">
	/// The time provider for default timestamps.
	/// </param>
	public UserDtoBuilder(TimeProvider timeProvider)
	{
		TimeProvider = timeProvider;
		CreateDate =
			timeProvider.GetUtcNow();
	}

	/// <summary>
	/// Sets the user ID.
	/// </summary>
	public UserDtoBuilder WithId(long value)
	{
		Id = value;
		return this;
	}

	/// <summary>
	/// Sets the username.
	/// </summary>
	public UserDtoBuilder WithUsername(string value)
	{
		Username = value;
		return this;
	}

	/// <summary>
	/// Sets the email.
	/// </summary>
	public UserDtoBuilder WithEmail(string value)
	{
		Email = value;
		return this;
	}

	/// <summary>
	/// Sets the full name.
	/// </summary>
	public UserDtoBuilder WithFullName(string? value)
	{
		FullName = value;
		return this;
	}

	/// <summary>
	/// Sets the create date.
	/// </summary>
	public UserDtoBuilder WithCreateDate(DateTimeOffset value)
	{
		CreateDate = value;
		return this;
	}

	/// <summary>
	/// Sets the active status.
	/// </summary>
	public UserDtoBuilder WithIsActive(bool value)
	{
		IsActive = value;
		return this;
	}

	/// <summary>
	/// Sets the created by value.
	/// </summary>
	public UserDtoBuilder WithCreatedBy(string value)
	{
		CreatedBy = value;
		return this;
	}

	/// <summary>
	/// Sets the modify date.
	/// </summary>
	public UserDtoBuilder WithModifyDate(DateTimeOffset? value)
	{
		ModifyDate = value;
		return this;
	}

	/// <summary>
	/// Sets the modified by value.
	/// </summary>
	public UserDtoBuilder WithModifiedBy(string value)
	{
		ModifiedBy = value;
		return this;
	}

	/// <summary>
	/// Sets the last login timestamp.
	/// </summary>
	public UserDtoBuilder WithLastLoginAt(DateTimeOffset? value)
	{
		LastLoginAt = value;
		return this;
	}

	/// <summary>
	/// Sets the deleted status.
	/// </summary>
	public UserDtoBuilder WithIsDeleted(bool value)
	{
		IsDeleted = value;
		return this;
	}

	/// <summary>
	/// Sets the deleted at timestamp.
	/// </summary>
	public UserDtoBuilder WithDeletedAt(DateTimeOffset? value)
	{
		DeletedAt = value;
		return this;
	}

	/// <summary>
	/// Sets the deleted by value.
	/// </summary>
	public UserDtoBuilder WithDeletedBy(string? value)
	{
		DeletedBy = value;
		return this;
	}

	/// <summary>
	/// Builds the UserDto instance.
	/// </summary>
	public UserDto Build() =>
		new UserDto(
			Id,
			Username,
			Email,
			FullName,
			CreateDate,
			IsActive,
			CreatedBy,
			ModifyDate,
			ModifiedBy,
			LastLoginAt,
			IsDeleted,
			DeletedAt,
			DeletedBy);
}