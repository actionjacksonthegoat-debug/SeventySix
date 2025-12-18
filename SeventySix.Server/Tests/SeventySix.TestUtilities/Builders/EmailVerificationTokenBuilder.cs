// <copyright file="EmailVerificationTokenBuilder.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using SeventySix.Identity;
using SeventySix.Shared.Extensions;

namespace SeventySix.TestUtilities.Builders;

/// <summary>
/// Fluent builder for creating EmailVerificationToken entities in tests.
/// </summary>
/// <remarks>
/// Provides a convenient way to create EmailVerificationToken entities with default test values.
/// Reduces boilerplate code in test setup.
///
/// Usage:
/// <code>
/// EmailVerificationToken token = new EmailVerificationTokenBuilder(timeProvider)
///     .WithEmail("test@example.com")
///     .AsUsed()
///     .Build();
/// </code>
/// </remarks>
public class EmailVerificationTokenBuilder
{
	private readonly TimeProvider TimeProvider;
	private string Email = "test@example.com";
	private string TokenHash =
		CryptoExtensions.ComputeSha256Hash(
		Convert.ToBase64String(Guid.NewGuid().ToByteArray()));
	private DateTime ExpiresAt;
	private DateTime CreateDate;
	private bool IsUsed;

	/// <summary>
	/// Initializes a new instance of the <see cref="EmailVerificationTokenBuilder"/> class.
	/// </summary>
	/// <param name="timeProvider">The time provider for default timestamps.</param>
	public EmailVerificationTokenBuilder(TimeProvider timeProvider)
	{
		TimeProvider = timeProvider;
		ExpiresAt =
			timeProvider.GetUtcNow().AddHours(24).UtcDateTime;
		CreateDate =
			timeProvider.GetUtcNow().UtcDateTime;
	}

	/// <summary>
	/// Sets the email address being verified.
	/// </summary>
	/// <param name="email">The email address.</param>
	/// <returns>The builder instance for method chaining.</returns>
	public EmailVerificationTokenBuilder WithEmail(string email)
	{
		Email = email;
		return this;
	}

	/// <summary>
	/// Sets the token hash value.
	/// </summary>
	/// <param name="tokenHash">The SHA256 hash of the raw token.</param>
	/// <returns>The builder instance for method chaining.</returns>
	public EmailVerificationTokenBuilder WithTokenHash(string tokenHash)
	{
		TokenHash = tokenHash;
		return this;
	}

	/// <summary>
	/// Sets the expiration date.
	/// </summary>
	/// <param name="expiresAt">The expiration date.</param>
	/// <returns>The builder instance for method chaining.</returns>
	public EmailVerificationTokenBuilder WithExpiresAt(DateTime expiresAt)
	{
		ExpiresAt = expiresAt;
		return this;
	}

	/// <summary>
	/// Sets the token as expired.
	/// </summary>
	/// <returns>The builder instance for method chaining.</returns>
	public EmailVerificationTokenBuilder AsExpired()
	{
		ExpiresAt =
			TimeProvider.GetUtcNow().AddHours(-1).UtcDateTime;
		return this;
	}

	/// <summary>
	/// Sets the creation date.
	/// </summary>
	/// <param name="createDate">The creation date.</param>
	/// <returns>The builder instance for method chaining.</returns>
	public EmailVerificationTokenBuilder WithCreateDate(DateTime createDate)
	{
		CreateDate = createDate;
		return this;
	}

	/// <summary>
	/// Sets whether the token has been used.
	/// </summary>
	/// <param name="isUsed">Whether the token has been used.</param>
	/// <returns>The builder instance for method chaining.</returns>
	public EmailVerificationTokenBuilder WithIsUsed(bool isUsed)
	{
		IsUsed = isUsed;
		return this;
	}

	/// <summary>
	/// Marks the token as already used.
	/// </summary>
	/// <returns>The builder instance for method chaining.</returns>
	public EmailVerificationTokenBuilder AsUsed()
	{
		IsUsed = true;
		return this;
	}

	/// <summary>
	/// Builds the EmailVerificationToken entity.
	/// </summary>
	/// <returns>A new EmailVerificationToken instance.</returns>
	public EmailVerificationToken Build() =>
		new()
		{
			Email = Email,
			TokenHash = TokenHash,
			ExpiresAt = ExpiresAt,
			CreateDate = CreateDate,
			IsUsed = IsUsed,
		};
}
