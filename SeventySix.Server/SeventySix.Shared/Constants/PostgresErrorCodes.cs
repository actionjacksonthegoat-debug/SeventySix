// <copyright file="PostgresErrorCodes.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Shared.Constants;

/// <summary>
/// PostgreSQL error codes for exception handling.
/// </summary>
/// <remarks>
/// See: https://www.postgresql.org/docs/current/errcodes-appendix.html
/// </remarks>
public static class PostgresErrorCodes
{
	/// <summary>
	/// Error code 23505: unique_violation.
	/// Thrown when an INSERT or UPDATE violates a unique constraint.
	/// </summary>
	public const string UniqueViolation = "23505";

	/// <summary>
	/// Error code 40001: serialization_failure.
	/// Thrown when a transaction cannot be serialized due to concurrent modifications.
	/// </summary>
	public const string SerializationFailure = "40001";

	/// <summary>
	/// Error code 40P01: deadlock_detected.
	/// Thrown when a deadlock is detected between concurrent transactions.
	/// </summary>
	public const string DeadlockDetected = "40P01";

	/// <summary>
	/// Human-readable error message fragment for duplicate key violations.
	/// </summary>
	public const string DuplicateKeyMessage = "duplicate key";
}
