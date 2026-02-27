// <copyright file="DuplicateKeyViolationHandler.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Diagnostics.CodeAnalysis;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Npgsql;

namespace SeventySix.Identity;

/// <summary>
/// Centralized handler for PostgreSQL duplicate key constraint violations.
/// Eliminates duplicate violation handling code across command handlers (DRY).
/// </summary>
/// <remarks>
/// Uses PostgresException.ConstraintName to reliably detect which constraint was violated.
///
/// Supported constraints:
/// - IX_Users_Username: Username uniqueness violation
/// - IX_Users_Email: Email uniqueness violation
///
/// Usage Patterns:
/// - Authentication handlers: Return AuthResult.Failed
/// - Admin handlers: Throw DuplicateUserException
/// </remarks>
[ExcludeFromCodeCoverage]
public static class DuplicateKeyViolationHandler
{
	private const string UsernameConstraint = "IX_Users_Username";
	private const string EmailConstraint = "IX_Users_Email";

	/// <summary>
	/// Handles duplicate key violation and returns AuthResult.Failed.
	/// Use for authentication/registration flows.
	/// </summary>
	/// <param name="exception">
	/// The database update exception.
	/// </param>
	/// <param name="logger">
	/// Logger instance.
	/// </param>
	/// <returns>
	/// AuthResult.Failed with appropriate error message and code.
	/// </returns>
	public static AuthResult HandleAsAuthResult(
		DbUpdateException exception,
		ILogger logger)
	{
		string? constraintName =
			GetConstraintName(exception);

		if (constraintName == UsernameConstraint)
		{
			logger.LogWarning(
				"Registration attempt with existing username.");

			return AuthResult.Failed(
				"Username is already taken.",
				AuthErrorCodes.UsernameExists);
		}

		if (constraintName == EmailConstraint)
		{
			logger.LogWarning(
				"Registration attempt with already registered email.");

			return AuthResult.Failed(
				"This email is already registered.",
				AuthErrorCodes.EmailExists);
		}

		// Unknown constraint violation — do not log constraint name to avoid leaking schema info
		logger.LogWarning(
			"Unknown duplicate key violation during registration.");

		return AuthResult.Failed(
			"Username or email already exists.",
			AuthErrorCodes.UsernameExists);
	}

	/// <summary>
	/// Handles duplicate key violation and throws DuplicateUserException.
	/// Use for admin/user management flows.
	/// </summary>
	/// <param name="exception">
	/// The database update exception.
	/// </param>
	/// <param name="logger">
	/// Logger instance.
	/// </param>
	/// <exception cref="DuplicateUserException">Always thrown with appropriate message.</exception>
	public static void HandleAsException(
		DbUpdateException exception,
		ILogger logger)
	{
		string? constraintName =
			GetConstraintName(exception);

		if (constraintName == UsernameConstraint)
		{
			logger.LogWarning(
				"Duplicate username detected during user creation.");

			throw new DuplicateUserException(
				"Username already taken.");
		}

		if (constraintName == EmailConstraint)
		{
			logger.LogWarning(
				"Duplicate email detected during user creation.");

			throw new DuplicateUserException(
				"Email already registered.");
		}

		// Unknown constraint violation — do not log constraint name to avoid leaking schema info
		logger.LogWarning(
			"Unknown duplicate key violation during user creation.");

		throw new DuplicateUserException(
			"Failed to create user: Username or email already exists");
	}

	/// <summary>
	/// Extracts the constraint name from PostgreSQL exception.
	/// Uses PostgresException.ConstraintName for reliable detection.
	/// </summary>
	/// <param name="exception">
	/// The database update exception.
	/// </param>
	/// <returns>
	/// The constraint name, or null if not a PostgreSQL constraint violation.
	/// </returns>
	private static string? GetConstraintName(DbUpdateException exception)
	{
		if (exception.InnerException is PostgresException postgresException)
		{
			return postgresException.ConstraintName;
		}

		return null;
	}
}