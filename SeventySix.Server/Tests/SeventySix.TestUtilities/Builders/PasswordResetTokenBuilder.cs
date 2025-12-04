// <copyright file="PasswordResetTokenBuilder.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using SeventySix.Identity;

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
	private int UserId;
	private string Token = Convert.ToBase64String(Guid.NewGuid().ToByteArray());
	private DateTime ExpiresAt = DateTime.UtcNow.AddHours(24);
	private DateTime CreateDate = DateTime.UtcNow;
	private bool IsUsed;

	/// <summary>
	/// Sets the user ID this token belongs to.
	/// </summary>
	/// <param name="userId">The user ID.</param>
	/// <returns>The builder instance for method chaining.</returns>
	public PasswordResetTokenBuilder WithUserId(int userId)
	{
		UserId = userId;
		return this;
	}

	/// <summary>
	/// Sets the token value.
	/// </summary>
	/// <param name="token">The token value.</param>
	/// <returns>The builder instance for method chaining.</returns>
	public PasswordResetTokenBuilder WithToken(string token)
	{
		Token = token;
		return this;
	}

	/// <summary>
	/// Sets the expiration date.
	/// </summary>
	/// <param name="expiresAt">The expiration date.</param>
	/// <returns>The builder instance for method chaining.</returns>
	public PasswordResetTokenBuilder WithExpiresAt(DateTime expiresAt)
	{
		ExpiresAt = expiresAt;
		return this;
	}

	/// <summary>
	/// Sets the token as expired.
	/// </summary>
	/// <returns>The builder instance for method chaining.</returns>
	public PasswordResetTokenBuilder AsExpired()
	{
		ExpiresAt = DateTime.UtcNow.AddHours(-1);
		return this;
	}

	/// <summary>
	/// Sets the creation date.
	/// </summary>
	/// <param name="createDate">The creation date.</param>
	/// <returns>The builder instance for method chaining.</returns>
	public PasswordResetTokenBuilder WithCreateDate(DateTime createDate)
	{
		CreateDate = createDate;
		return this;
	}

	/// <summary>
	/// Sets whether the token has been used.
	/// </summary>
	/// <param name="isUsed">Whether the token has been used.</param>
	/// <returns>The builder instance for method chaining.</returns>
	public PasswordResetTokenBuilder WithIsUsed(bool isUsed)
	{
		IsUsed = isUsed;
		return this;
	}

	/// <summary>
	/// Marks the token as already used.
	/// </summary>
	/// <returns>The builder instance for method chaining.</returns>
	public PasswordResetTokenBuilder AsUsed()
	{
		IsUsed = true;
		return this;
	}

	/// <summary>
	/// Builds the PasswordResetToken entity.
	/// </summary>
	/// <returns>A new PasswordResetToken instance.</returns>
	public PasswordResetToken Build() =>
		new()
		{
			UserId = UserId,
			Token = Token,
			ExpiresAt = ExpiresAt,
			CreateDate = CreateDate,
			IsUsed = IsUsed,
		};
}