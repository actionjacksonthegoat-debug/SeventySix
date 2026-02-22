// <copyright file="BackupCodeBuilder.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.AspNetCore.Identity;
using SeventySix.Identity;

namespace SeventySix.TestUtilities.Builders;

/// <summary>
/// Fluent builder for creating BackupCode test instances.
/// </summary>
public sealed class BackupCodeBuilder
{
	private readonly TimeProvider TimeProviderField;
	private readonly IPasswordHasher<BackupCode> PasswordHasher;
	private long UserId = 1;
	private string Code = "ABCD1234";
	private bool IsUsed = false;
	private DateTimeOffset? UsedAt = null;

	/// <summary>
	/// Initializes a new instance of the <see cref="BackupCodeBuilder"/> class.
	/// </summary>
	/// <param name="timeProvider">
	/// Time provider for timestamps.
	/// </param>
	public BackupCodeBuilder(TimeProvider timeProvider)
	{
		TimeProviderField = timeProvider;
		PasswordHasher =
			new PasswordHasher<BackupCode>();
	}

	/// <summary>
	/// Sets the user ID for the backup code.
	/// </summary>
	/// <param name="userId">
	/// The user ID.
	/// </param>
	/// <returns>
	/// The builder instance.
	/// </returns>
	public BackupCodeBuilder WithUserId(long userId)
	{
		UserId = userId;
		return this;
	}

	/// <summary>
	/// Sets the plain text code (will be hashed).
	/// </summary>
	/// <param name="code">
	/// The plain text code.
	/// </param>
	/// <returns>
	/// The builder instance.
	/// </returns>
	public BackupCodeBuilder WithCode(string code)
	{
		Code = code;
		return this;
	}

	/// <summary>
	/// Marks the backup code as used.
	/// </summary>
	/// <returns>
	/// The builder instance.
	/// </returns>
	public BackupCodeBuilder AsUsed()
	{
		IsUsed = true;
		UsedAt =
			TimeProviderField.GetUtcNow();
		return this;
	}

	/// <summary>
	/// Builds the BackupCode instance.
	/// </summary>
	/// <returns>
	/// A configured BackupCode.
	/// </returns>
	public BackupCode Build()
	{
		DateTimeOffset now =
			TimeProviderField.GetUtcNow();

		BackupCode backupCode =
			new()
			{
				UserId = UserId,
				IsUsed = IsUsed,
				UsedAt = UsedAt,
				CreateDate = now
			};

		backupCode.CodeHash =
			PasswordHasher.HashPassword(backupCode, Code);

		return backupCode;
	}

	/// <summary>
	/// Gets the plain text code for test verification.
	/// </summary>
	/// <returns>
	/// The plain text code.
	/// </returns>
	public string GetPlainCode()
	{
		return Code;
	}
}