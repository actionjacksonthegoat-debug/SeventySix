using System;

namespace SeventySix.Api.Infrastructure;

/// <summary>
/// Represents a fatal startup failure that prevents the application from completing initialization.
/// This exception is intended to be thrown during the startup sequence (for example during
/// database migration or dependency validation) so that an attached debugger can break and
/// present detailed exception context in the Exception Helper.
/// </summary>
public sealed class StartupFailedException : Exception
{
	/// <summary>
	/// Gets the reason why the startup failed.
	/// </summary>
	public StartupFailedReason Reason { get; }

	/// <summary>
	/// Initializes a new instance of the <see cref="StartupFailedException"/> class.
	/// </summary>
	/// <param name="reason">
	/// A <see cref="StartupFailedReason"/> value describing the failure category.
	/// </param>
	/// <param name="message">
	/// A short human-readable message describing the error condition.
	/// </param>
	/// <param name="innerException">
	/// An optional inner <see cref="Exception"/> that caused this failure.
	/// </param>
	public StartupFailedException(
		StartupFailedReason reason,
		string message,
		Exception? innerException = null)
		: base(message, innerException)
	{
		Reason = reason;
	}
}

/// <summary>
/// Enumerates reasons why application startup may fail.
/// </summary>
public enum StartupFailedReason
{
	/// <summary>
	/// Failure occurred while applying database migrations or interacting with the database schema.
	/// </summary>
	DatabaseMigration,

	/// <summary>
	/// Failure due to missing or invalid configuration (e.g., connection string missing).
	/// </summary>
	Configuration,

	/// <summary>
	/// Failure because a required dependency (e.g., PostgreSQL) was unavailable.
	/// </summary>
	DependencyUnavailable
}