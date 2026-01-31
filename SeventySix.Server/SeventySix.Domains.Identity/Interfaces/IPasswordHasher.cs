// <copyright file="IPasswordHasher.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity;

/// <summary>
/// Interface for password hashing operations.
/// </summary>
/// <remarks>
/// Provides a simple abstraction for password hashing that is independent
/// of ASP.NET Core Identity. Used by services that need password hashing
/// without user context.
/// </remarks>
public interface IPasswordHasher
{
	/// <summary>
	/// Hashes a password using the configured hashing algorithm.
	/// </summary>
	/// <param name="password">
	/// The plain text password to hash.
	/// </param>
	/// <returns>
	/// The hashed password string including algorithm parameters and salt.
	/// </returns>
	public string HashPassword(string password);

	/// <summary>
	/// Verifies a password against a stored hash.
	/// </summary>
	/// <param name="password">
	/// The plain text password to verify.
	/// </param>
	/// <param name="passwordHash">
	/// The stored password hash to verify against.
	/// </param>
	/// <returns>
	/// True if the password matches the hash; otherwise, false.
	/// </returns>
	public bool VerifyPassword(string password, string passwordHash);
}