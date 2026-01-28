// <copyright file="DbExceptionExtensions.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.EntityFrameworkCore;
using SeventySix.Shared.Constants;

namespace SeventySix.Shared.Extensions;

/// <summary>
/// Extension methods for database exception handling.
/// </summary>
public static class DbExceptionExtensions
{
	/// <summary>
	/// Determines if a DbUpdateException is caused by a unique constraint violation.
	/// </summary>
	/// <param name="exception">
	/// The exception to check.
	/// </param>
	/// <returns>
	/// True if the exception indicates a unique constraint violation (PostgreSQL error code 23505).
	/// </returns>
	/// <remarks>
	/// PostgreSQL error codes:
	/// - 23505: Unique violation (duplicate key)
	/// This method checks both the exception message and inner exception for the error code.
	/// </remarks>
	public static bool IsDuplicateKeyViolation(this DbUpdateException exception)
	{
		string message =
			GetExceptionMessage(exception);

		return message.Contains(
			PostgresErrorCodes.DuplicateKeyMessage,
			StringComparison.OrdinalIgnoreCase)
			|| message.Contains(
				PostgresErrorCodes.UniqueViolation,
				StringComparison.Ordinal);
	}

	/// <summary>
	/// Determines if a DbUpdateException is related to concurrency issues.
	/// </summary>
	/// <param name="exception">
	/// The exception to check.
	/// </param>
	/// <returns>
	/// True if the exception indicates a concurrency conflict (duplicate key, serialization failure, or deadlock).
	/// </returns>
	/// <remarks>
	/// PostgreSQL error codes checked:
	/// - 23505: Unique violation (duplicate key)
	/// - 40001: Serialization failure
	/// - 40P01: Deadlock detected
	/// </remarks>
	public static bool IsConcurrencyRelated(this DbUpdateException exception)
	{
		string message =
			GetExceptionMessage(exception);

		return message.Contains(
			PostgresErrorCodes.DuplicateKeyMessage,
			StringComparison.OrdinalIgnoreCase)
			|| message.Contains(
				PostgresErrorCodes.UniqueViolation,
				StringComparison.Ordinal)
			|| message.Contains(
				PostgresErrorCodes.SerializationFailure,
				StringComparison.Ordinal)
			|| message.Contains(
				PostgresErrorCodes.DeadlockDetected,
				StringComparison.Ordinal);
	}

	/// <summary>
	/// Gets the most specific error message from a DbUpdateException.
	/// </summary>
	/// <param name="exception">
	/// The database update exception.
	/// </param>
	/// <returns>
	/// The inner exception message if available, otherwise the main exception message.
	/// </returns>
	private static string GetExceptionMessage(DbUpdateException exception) =>
		exception.InnerException?.Message ?? exception.Message;
}