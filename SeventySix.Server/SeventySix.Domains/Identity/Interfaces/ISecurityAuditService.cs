// <copyright file="ISecurityAuditService.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity;

/// <summary>
/// Service for logging security audit events.
/// </summary>
/// <remarks>
/// Centralizes security event logging for compliance and forensics.
/// Events are immutable and stored in security.SecurityEvents table.
/// </remarks>
public interface ISecurityAuditService
{
	/// <summary>
	/// Logs a security event asynchronously.
	/// </summary>
	/// <param name="eventType">
	/// The type of security event.
	/// </param>
	/// <param name="userId">
	/// The user ID (null for anonymous events).
	/// </param>
	/// <param name="username">
	/// The username at time of event.
	/// </param>
	/// <param name="success">
	/// Whether the operation was successful.
	/// </param>
	/// <param name="details">
	/// Optional JSON details for event-specific metadata.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token for the async operation.
	/// </param>
	/// <returns>
	/// A task representing the asynchronous operation.
	/// </returns>
	public Task LogEventAsync(
		SecurityEventType eventType,
		long? userId,
		string? username,
		bool success,
		string? details = null,
		CancellationToken cancellationToken = default);

	/// <summary>
	/// Logs a security event for an identified user asynchronously.
	/// </summary>
	/// <param name="eventType">
	/// The type of security event.
	/// </param>
	/// <param name="user">
	/// The user involved in the event.
	/// </param>
	/// <param name="success">
	/// Whether the operation was successful.
	/// </param>
	/// <param name="details">
	/// Optional JSON details for event-specific metadata.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token for the async operation.
	/// </param>
	/// <returns>
	/// A task representing the asynchronous operation.
	/// </returns>
	public Task LogEventAsync(
		SecurityEventType eventType,
		ApplicationUser user,
		bool success,
		string? details = null,
		CancellationToken cancellationToken = default);
}