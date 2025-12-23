// <copyright file="JwtTestHelper.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;

namespace SeventySix.TestUtilities.TestHelpers;

/// <summary>
/// Helper methods for creating JWT tokens in tests.
/// Used to test authentication edge cases like invalid signatures and expired tokens.
/// </summary>
public static class JwtTestHelper
{
	/// <summary>
	/// The valid issuer used in the application (must match appsettings.json).
	/// </summary>
	private const string ValidIssuer = "SeventySix.Api";

	/// <summary>
	/// The valid audience used in the application (must match appsettings.json).
	/// </summary>
	private const string ValidAudience = "SeventySix.Client";

	/// <summary>
	/// A secret key different from the application's secret key.
	/// Used to generate tokens with invalid signatures.
	/// </summary>
	private const string WrongSecretKey =
		"ThisIsADifferentSecretKeyThatIs32CharsOrMore!";

	/// <summary>
	/// Generates a JWT signed with the wrong secret key.
	/// The API should reject this token with 401 Unauthorized.
	/// </summary>
	/// <param name="userId">
	/// The user ID to include in claims.
	/// </param>
	/// <param name="username">
	/// The username to include in claims.
	/// </param>
	/// <param name="email">
	/// The email to include in claims.
	/// </param>
	/// <param name="timeProvider">
	/// The time provider for generating expiration times.
	/// </param>
	/// <returns>
	/// A JWT string signed with the wrong key.
	/// </returns>
	public static string GenerateTokenWithWrongKey(
		int userId,
		string username,
		string email,
		TimeProvider timeProvider)
	{
		List<Claim> claims =
			[
			new Claim(JwtRegisteredClaimNames.Sub, userId.ToString()),
			new Claim(JwtRegisteredClaimNames.UniqueName, username),
			new Claim(JwtRegisteredClaimNames.Email, email),
			new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
		];

		SymmetricSecurityKey key =
			new(Encoding.UTF8.GetBytes(WrongSecretKey));

		SigningCredentials credentials =
			new(
			key,
			SecurityAlgorithms.HmacSha256);

		JwtSecurityToken token =
			new(
			issuer: ValidIssuer,
			audience: ValidAudience,
			claims: claims,
			expires: timeProvider.GetUtcNow().AddMinutes(15).UtcDateTime,
			signingCredentials: credentials);

		return new JwtSecurityTokenHandler().WriteToken(token);
	}

	/// <summary>
	/// Generates an expired JWT signed with the wrong secret key.
	/// The API should reject this token with 401 Unauthorized and set X-Token-Expired header.
	/// </summary>
	/// <param name="userId">
	/// The user ID to include in claims.
	/// </param>
	/// <param name="timeProvider">
	/// The time provider for generating expiration times.
	/// </param>
	/// <returns>
	/// A JWT string that has already expired.
	/// </returns>
	/// <remarks>
	/// Uses a wrong key to ensure the test doesn't require the real secret.
	/// The API validates expiration before signature in most JWT libraries,
	/// but this approach ensures the token structure is valid.
	/// </remarks>
	public static string GenerateExpiredToken(
		int userId,
		string username,
		string email,
		TimeProvider timeProvider)
	{
		List<Claim> claims =
			[
			new Claim(JwtRegisteredClaimNames.Sub, userId.ToString()),
			new Claim(JwtRegisteredClaimNames.UniqueName, username),
			new Claim(JwtRegisteredClaimNames.Email, email),
			new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
		];

		SymmetricSecurityKey key =
			new(Encoding.UTF8.GetBytes(WrongSecretKey));

		SigningCredentials credentials =
			new(
			key,
			SecurityAlgorithms.HmacSha256);

		// Create token that expired 1 hour ago
		DateTime pastExpiration =
			timeProvider
			.GetUtcNow()
			.AddHours(-1)
			.UtcDateTime;

		JwtSecurityToken token =
			new(
			issuer: ValidIssuer,
			audience: ValidAudience,
			claims: claims,
			notBefore: timeProvider.GetUtcNow().AddHours(-2).UtcDateTime,
			expires: pastExpiration,
			signingCredentials: credentials);

		return new JwtSecurityTokenHandler().WriteToken(token);
	}
}