// <copyright file="DbExceptionExtensions.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.EntityFrameworkCore;

namespace SeventySix.Shared.Extensions;

/// <summary>
/// Extension methods for database exception handling.
/// </summary>
public static class DbExceptionExtensions
{
	/// <summary>
	/// Determines if a DbUpdateException is caused by a unique constraint violation.
	/// </summary>
	/// <param name="exception">The exception to check.</param>
	/// <returns>True if the exception indicates a unique constraint violation (PostgreSQL error code 23505).</returns>
	/// <remarks>
	/// PostgreSQL error codes:
	/// - 23505: Unique violation (duplicate key)
	/// This method checks both the exception message and inner exception for the error code.
	/// </remarks>
	public static bool IsDuplicateKeyViolation(this DbUpdateException exception)
	{
		string message =
			exception.InnerException?.Message ?? exception.Message;

		return message.Contains(
			"duplicate key",
			StringComparison.OrdinalIgnoreCase)
			|| message.Contains(
				"23505",
				StringComparison.Ordinal);
	}
}