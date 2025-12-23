// <copyright file="PasswordResetTokenBuilder.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using SeventySix.Identity;
using SeventySix.Shared.Extensions;

namespace SeventySix.TestUtilities.Builders;

/// <summary>
/// Fluent builder for creating PasswordResetToken entities in tests.
/// </summary>
/// <remarks>
/// Provides a convenient way to create PasswordResetToken entities with default test values.
/// Reduces boilerplate code in test setup.
///
/// Usage:
/// <code>
/// PasswordResetToken token = new PasswordResetTokenBuilder()
///     .WithUserId(userId)
///     .WithToken("test-token")
///     .Build();
/// </code>
///
/// Design Patterns:
/// - Builder Pattern: Fluent API for constructing complex objects
/// - Test Data Builder: Specialized builder for test data
/// </remarks>
public class PasswordResetTokenBuilder
{
	private readonly TimeProvider TimeProvider;
	private int UserId;
	private string TokenHash =
		CryptoExtensions.ComputeSha256Hash(
		Convert.ToBase64String(Guid.NewGuid().ToByteArray()));
	private DateTime ExpiresAt;
	private DateTime CreateDate;
	private bool IsUsed;

	/// <summary>
	/// Initializes a new instance of the <see cref="PasswordResetTokenBuilder"/> class.
	/// </summary>
	/// <param name="timeProvider">
	/// The time provider for default timestamps.
	/// </param>
	public PasswordResetTokenBuilder(TimeProvider timeProvider)
	{
		TimeProvider = timeProvider;
		ExpiresAt =
			timeProvider.GetUtcNow().AddHours(24).UtcDateTime;
		CreateDate =
			timeProvider.GetUtcNow().UtcDateTime;
	}

	/// <summary>
	/// Sets the user ID this token belongs to.
	/// </summary>
	/// <param name="userId">
	/// The user ID.
	/// </param>
	/// <returns>
	/// The builder instance for method chaining.
	/// </returns>
	public PasswordResetTokenBuilder WithUserId(int userId)
	{
		UserId = userId;
		return this;
	}

	/// <summary>
	/// Sets the token hash value.
	/// </summary>
	/// <param name="tokenHash">
	/// The SHA256 hash of the raw token.
	/// </param>
	/// <returns>
	/// The builder instance for method chaining.
	/// </returns>
	public PasswordResetTokenBuilder WithTokenHash(string tokenHash)
	{
		TokenHash = tokenHash;
		return this;
	}

	/// <summary>
	/// Sets the expiration date.
	/// </summary>
	/// <param name="expiresAt">
	/// The expiration date.
	/// </param>
	/// <returns>
	/// The builder instance for method chaining.
	/// </returns>
	public PasswordResetTokenBuilder WithExpiresAt(DateTime expiresAt)
	{
		ExpiresAt = expiresAt;
		return this;
	}

	/// <summary>
	/// Sets the token as expired.
	/// </summary>
	/// <returns>
	/// The builder instance for method chaining.
	/// </returns>
	public PasswordResetTokenBuilder AsExpired()
	{
		ExpiresAt =
			TimeProvider.GetUtcNow().AddHours(-1).UtcDateTime;
		return this;
	}

	/// <summary>
	/// Sets the creation date.
	/// </summary>
	/// <param name="createDate">
	/// The creation date.
	/// </param>
	/// <returns>
	/// The builder instance for method chaining.
	/// </returns>
	public PasswordResetTokenBuilder WithCreateDate(DateTime createDate)
	{
		CreateDate = createDate;
		return this;
	}

	/// <summary>
	/// Sets whether the token has been used.
	/// </summary>
	/// <param name="isUsed">
	/// Whether the token has been used.
	/// </param>
	/// <returns>
	/// The builder instance for method chaining.
	/// </returns>
	public PasswordResetTokenBuilder WithIsUsed(bool isUsed)
	{
		IsUsed = isUsed;
		return this;
	}

	/// <summary>
	/// Marks the token as already used.
	/// </summary>
	/// <returns>
	/// The builder instance for method chaining.
	/// </returns>
	public PasswordResetTokenBuilder AsUsed()
	{
		IsUsed = true;
		return this;
	}

	/// <summary>
	/// Builds the PasswordResetToken entity.
	/// </summary>
	/// <returns>
	/// A new PasswordResetToken instance.
	/// </returns>
	public PasswordResetToken Build() =>
		new()
		{
			UserId = UserId,
			TokenHash = TokenHash,
			ExpiresAt = ExpiresAt,
			CreateDate = CreateDate,
			IsUsed = IsUsed,
		};
}