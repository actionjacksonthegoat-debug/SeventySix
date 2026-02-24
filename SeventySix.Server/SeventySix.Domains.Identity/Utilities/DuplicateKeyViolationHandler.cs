// <copyright file="DuplicateKeyViolationHandler.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Npgsql;
using SeventySix.Shared.Utilities;

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
	/// <param name="username">
	/// The username attempted (for logging).
	/// </param>
	/// <param name="email">
	/// The email attempted (for logging).
	/// </param>
	/// <param name="logger">
	/// Logger instance.
	/// </param>
	/// <returns>
	/// AuthResult.Failed with appropriate error message and code.
	/// </returns>
	public static AuthResult HandleAsAuthResult(
		DbUpdateException exception,
		string username,
		string email,
		ILogger logger)
	{
		string? constraintName =
			GetConstraintName(exception);

		if (constraintName == UsernameConstraint)
		{
			logger.LogWarning(
				"Registration attempt with existing username: {Username}",
				LogSanitizer.MaskUsername(username));

			return AuthResult.Failed(
				"Username is already taken.",
				AuthErrorCodes.UsernameExists);
		}

		if (constraintName == EmailConstraint)
		{
			// codeql[cs/exposure-of-sensitive-information] -- email is masked via LogSanitizer.MaskEmail (shows only first char + domain)
			logger.LogWarning(
				"Registration attempt with already registered email: {Email}",
				LogSanitizer.MaskEmail(email));

			return AuthResult.Failed(
				"This email is already registered.",
				AuthErrorCodes.EmailExists);
		}

		// Unknown constraint violation
		// codeql[cs/exposure-of-sensitive-information] -- username/email masked via LogSanitizer (first 2 chars / first char + domain only)
		logger.LogWarning(
			"Unknown duplicate key violation during registration. Username: {Username}, Email: {Email}, Constraint: {Constraint}",
			LogSanitizer.MaskUsername(username),
			LogSanitizer.MaskEmail(email),
			constraintName ?? "unknown");

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
	/// <param name="username">
	/// The username attempted (for logging and exception message).
	/// </param>
	/// <param name="email">
	/// The email attempted (for logging and exception message).
	/// </param>
	/// <param name="logger">
	/// Logger instance.
	/// </param>
	/// <exception cref="DuplicateUserException">Always thrown with appropriate message.</exception>
	public static void HandleAsException(
		DbUpdateException exception,
		string username,
		string email,
		ILogger logger)
	{
		string? constraintName =
			GetConstraintName(exception);

		if (constraintName == UsernameConstraint)
		{
			// codeql[cs/exposure-of-sensitive-information] -- username/email masked via LogSanitizer (first 2 chars / first char + domain only)
			logger.LogWarning(
				"Duplicate username detected during user creation. Username: {Username}, Email: {Email}",
				LogSanitizer.MaskUsername(username),
				LogSanitizer.MaskEmail(email));

			throw new DuplicateUserException(
				$"Failed to create user: Username '{username}' is already taken");
		}

		if (constraintName == EmailConstraint)
		{
			// codeql[cs/exposure-of-sensitive-information] -- email/username masked via LogSanitizer (first char + domain / first 2 chars only)
			logger.LogWarning(
				"Duplicate email detected during user creation. Email: {Email}, Username: {Username}",
				LogSanitizer.MaskEmail(email),
				LogSanitizer.MaskUsername(username));

			throw new DuplicateUserException(
				$"Failed to create user: Email '{email}' is already registered");
		}

		// Unknown constraint violation
		// codeql[cs/exposure-of-sensitive-information] -- username/email masked via LogSanitizer (first 2 chars / first char + domain only)
		logger.LogWarning(
			"Unknown duplicate key violation during user creation. Username: {Username}, Email: {Email}, Constraint: {Constraint}",
			LogSanitizer.MaskUsername(username),
			LogSanitizer.MaskEmail(email),
			constraintName ?? "unknown");

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