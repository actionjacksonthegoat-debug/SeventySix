// <copyright file="IdentityArgon2PasswordHasher.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System;
using Microsoft.AspNetCore.Identity;

namespace SeventySix.Identity;

/// <summary>
/// ASP.NET Core Identity password hasher adapter using Argon2id.
/// Wraps the project-level <see cref="IPasswordHasher"/> to satisfy Identity's interface.
/// </summary>
/// <remarks>
/// Adapter used to integrate the project-level Argon2 implementation with ASP.NET Core Identity.
/// This class performs argument validation and adapts the interface semantics.
/// </remarks>
/// <param name="passwordHasher">
/// The project-level Argon2 password hasher.
/// </param>
public class IdentityArgon2PasswordHasher(
	IPasswordHasher passwordHasher) : IPasswordHasher<ApplicationUser>
{
	/// <inheritdoc/>
	/// <param name="user">
	/// The user for which the hash is created. May be null.
	/// </param>
	/// <para/>
	/// <returns>
	/// The hashed password string including Argon2 parameters and salt.
	/// </returns>
	public string HashPassword(ApplicationUser user, string password)
	{
		ArgumentException.ThrowIfNullOrWhiteSpace(password);
		return passwordHasher.HashPassword(password);
	}



	/// <inheritdoc/>
	/// <param name="user">
	/// The user the password belongs to. May be null.
	/// </param>
	/// <para/>
	/// <returns>
	/// A <see cref="PasswordVerificationResult"/> indicating success or failure.
	/// </returns>
	public PasswordVerificationResult VerifyHashedPassword(ApplicationUser user, string hashedPassword, string providedPassword)
	{
		ArgumentException.ThrowIfNullOrWhiteSpace(hashedPassword);
		ArgumentException.ThrowIfNullOrWhiteSpace(providedPassword);

		bool isValid =
			passwordHasher.VerifyPassword(
				providedPassword,
				hashedPassword);

		return isValid
			? PasswordVerificationResult.Success
			: PasswordVerificationResult.Failed;
	}
}