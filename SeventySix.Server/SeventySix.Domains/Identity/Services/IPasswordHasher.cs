// <copyright file="IPasswordHasher.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity;

/// <summary>
/// Interface for password hashing and verification operations.
/// </summary>
/// <remarks>
/// <para>
/// Security Requirements (OWASP 2024):
/// - Must use memory-hard algorithm (Argon2id preferred)
/// - Must include salt (automatically handled by Argon2id)
/// - Must be computationally expensive to resist brute-force attacks
/// </para>
/// <para>
/// Implementation: <see cref="Argon2PasswordHasher"/> using Argon2id.
/// </para>
/// </remarks>
public interface IPasswordHasher
{
	/// <summary>
	/// Hashes a password using Argon2id algorithm.
	/// </summary>
	/// <param name="password">The plaintext password to hash.</param>
	/// <returns>The hashed password with embedded parameters and salt.</returns>
	/// <remarks>
	/// The returned hash includes all parameters needed for verification:
	/// algorithm identifier, version, memory cost, iterations, parallelism, salt, and hash.
	/// </remarks>
	public string HashPassword(string password);

	/// <summary>
	/// Verifies a password against a stored hash.
	/// </summary>
	/// <param name="password">The plaintext password to verify.</param>
	/// <param name="passwordHash">The stored password hash.</param>
	/// <returns>True if the password matches the hash; otherwise, false.</returns>
	/// <remarks>
	/// Uses constant-time comparison to prevent timing attacks.
	/// </remarks>
	public bool VerifyPassword(string password, string passwordHash);
}