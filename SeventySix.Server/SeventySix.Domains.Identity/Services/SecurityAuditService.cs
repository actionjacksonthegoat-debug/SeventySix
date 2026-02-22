// <copyright file="SecurityAuditService.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.Extensions.Logging;

namespace SeventySix.Identity;

/// <summary>
/// Service for logging security audit events.
/// </summary>
/// <remarks>
/// <para>
/// Centralizes security event logging for compliance and forensics.
/// Events are stored in security.SecurityEvents table.
/// </para>
/// <para>
/// Uses IClientInfoService for IP/UserAgent extraction (DRY).
/// Errors during audit logging are logged but do not propagate
/// to avoid disrupting the primary operation.
/// </para>
/// </remarks>
/// <param name="dbContext">
/// The Identity database context.
/// </param>
/// <param name="clientInfoService">
/// The service for extracting client information.
/// </param>
/// <param name="timeProvider">
/// The time provider for timestamps.
/// </param>
/// <param name="logger">
/// The logger for error reporting.
/// </param>
public sealed class SecurityAuditService(
	IdentityDbContext dbContext,
	IClientInfoService clientInfoService,
	TimeProvider timeProvider,
	ILogger<SecurityAuditService> logger) : ISecurityAuditService
{
	/// <inheritdoc/>
	public async Task LogEventAsync(
		SecurityEventType eventType,
		long? userId,
		string? username,
		bool success,
		string? details = null,
		CancellationToken cancellationToken = default)
	{
		try
		{
			string? ipAddress =
				clientInfoService.ExtractClientIp();

			string? userAgent =
				clientInfoService.ExtractUserAgent();

			SecurityEvent securityEvent =
				new()
				{
					EventType = eventType,
					UserId = userId,
					Username = username,
					IpAddress = ipAddress,
					UserAgent = userAgent,
					Details = details,
					Success = success,
					CreateDate = timeProvider.GetUtcNow()
				};

			dbContext.SecurityEvents.Add(securityEvent);

			await dbContext.SaveChangesAsync(cancellationToken);
		}
		catch (Exception exception)
		{
			// Log but don't propagate - audit logging should not disrupt primary operations
			logger.LogWarning(
				exception,
				"Failed to log security event {EventType} for user {UserId}",
				eventType,
				userId);
		}
	}

	/// <inheritdoc/>
	public Task LogEventAsync(
		SecurityEventType eventType,
		ApplicationUser user,
		bool success,
		string? details = null,
		CancellationToken cancellationToken = default)
	{
		ArgumentNullException.ThrowIfNull(user);

		return LogEventAsync(
			eventType,
			user.Id,
			user.UserName,
			success,
			details,
			cancellationToken);
	}
}