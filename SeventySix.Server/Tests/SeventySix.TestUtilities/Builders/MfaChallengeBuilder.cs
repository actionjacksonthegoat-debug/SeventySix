// <copyright file="MfaChallengeBuilder.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Security.Cryptography;
using System.Text;
using SeventySix.Identity;

namespace SeventySix.TestUtilities.Builders;

/// <summary>
/// Fluent builder for creating MfaChallenge test instances.
/// </summary>
public sealed class MfaChallengeBuilder
{
	private readonly TimeProvider TimeProviderField;
	private string Token =
		Guid.NewGuid().ToString("N");
	private long UserId =
		1;
	private string Code =
		"123456";
	private int ExpirationMinutes =
		5;
	private int Attempts =
		0;
	private bool IsUsed =
		false;
	private string? ClientIp =
		"127.0.0.1";

	/// <summary>
	/// Initializes a new instance of the <see cref="MfaChallengeBuilder"/> class.
	/// </summary>
	/// <param name="timeProvider">
	/// Time provider for timestamps.
	/// </param>
	public MfaChallengeBuilder(TimeProvider timeProvider)
	{
		TimeProviderField = timeProvider;
	}

	/// <summary>
	/// Sets the challenge token.
	/// </summary>
	/// <param name="token">
	/// The token (GUID format).
	/// </param>
	/// <returns>
	/// The builder instance.
	/// </returns>
	public MfaChallengeBuilder WithToken(string token)
	{
		Token = token;
		return this;
	}

	/// <summary>
	/// Sets the user ID for the challenge.
	/// </summary>
	/// <param name="userId">
	/// The user ID.
	/// </param>
	/// <returns>
	/// The builder instance.
	/// </returns>
	public MfaChallengeBuilder WithUserId(long userId)
	{
		UserId = userId;
		return this;
	}

	/// <summary>
	/// Sets the verification code (will be hashed).
	/// </summary>
	/// <param name="code">
	/// The plain text code.
	/// </param>
	/// <returns>
	/// The builder instance.
	/// </returns>
	public MfaChallengeBuilder WithCode(string code)
	{
		Code = code;
		return this;
	}

	/// <summary>
	/// Sets the expiration time in minutes from now.
	/// </summary>
	/// <param name="minutes">
	/// Minutes until expiration.
	/// </param>
	/// <returns>
	/// The builder instance.
	/// </returns>
	public MfaChallengeBuilder WithExpirationMinutes(int minutes)
	{
		ExpirationMinutes = minutes;
		return this;
	}

	/// <summary>
	/// Sets the challenge as expired.
	/// </summary>
	/// <returns>
	/// The builder instance.
	/// </returns>
	public MfaChallengeBuilder AsExpired()
	{
		ExpirationMinutes = -1;
		return this;
	}

	/// <summary>
	/// Sets the number of verification attempts.
	/// </summary>
	/// <param name="attempts">
	/// The attempt count.
	/// </param>
	/// <returns>
	/// The builder instance.
	/// </returns>
	public MfaChallengeBuilder WithAttempts(int attempts)
	{
		Attempts = attempts;
		return this;
	}

	/// <summary>
	/// Marks the challenge as already used.
	/// </summary>
	/// <returns>
	/// The builder instance.
	/// </returns>
	public MfaChallengeBuilder AsUsed()
	{
		IsUsed = true;
		return this;
	}

	/// <summary>
	/// Sets the client IP address.
	/// </summary>
	/// <param name="clientIp">
	/// The client IP.
	/// </param>
	/// <returns>
	/// The builder instance.
	/// </returns>
	public MfaChallengeBuilder WithClientIp(string? clientIp)
	{
		ClientIp = clientIp;
		return this;
	}

	/// <summary>
	/// Builds the MfaChallenge instance.
	/// </summary>
	/// <returns>
	/// A configured MfaChallenge.
	/// </returns>
	public MfaChallenge Build()
	{
		DateTime now =
			TimeProviderField.GetUtcNow().UtcDateTime;

		string codeHash =
			ComputeSha256Hash(Code);

		return new MfaChallenge
		{
			Token = Token,
			UserId = UserId,
			CodeHash = codeHash,
			ExpiresAt = now.AddMinutes(ExpirationMinutes),
			Attempts = Attempts,
			IsUsed = IsUsed,
			ClientIp = ClientIp,
			CreateDate = now
		};
	}

	private static string ComputeSha256Hash(string input)
	{
		byte[] bytes =
			SHA256.HashData(Encoding.UTF8.GetBytes(input));

		return Convert.ToHexString(bytes).ToLowerInvariant();
	}
}