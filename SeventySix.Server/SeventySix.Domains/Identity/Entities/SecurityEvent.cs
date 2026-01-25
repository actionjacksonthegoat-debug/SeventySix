// <copyright file="SecurityEvent.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using SeventySix.Shared.Entities;

namespace SeventySix.Identity;

/// <summary>
/// Security audit event for compliance and forensics.
/// </summary>
/// <remarks>
/// Captures security-relevant events for audit logging and incident investigation.
/// Events are immutable once created (no update operations).
/// Schema: security.SecurityEvents
/// </remarks>
public class SecurityEvent : ICreatableEntity
{
	/// <summary>
	/// Gets or sets the unique identifier.
	/// </summary>
	public long Id { get; set; }

	/// <summary>
	/// Gets or sets the type of security event.
	/// </summary>
	public SecurityEventType EventType { get; set; }

	/// <summary>
	/// Gets or sets the user identifier (null for anonymous events).
	/// </summary>
	/// <remarks>
	/// Null for events like failed login attempts where user is not identified.
	/// </remarks>
	public long? UserId { get; set; }

	/// <summary>
	/// Gets or sets the username at time of event.
	/// </summary>
	/// <remarks>
	/// Stored separately from UserId to preserve username at event time,
	/// even if username is later changed.
	/// </remarks>
	public string? Username { get; set; }

	/// <summary>
	/// Gets or sets the client IP address.
	/// </summary>
	/// <remarks>
	/// <para>
	/// PII Classification: Personal Data (GDPR Article 4 - IP addresses).
	/// </para>
	/// <para>
	/// Storage: Plaintext for security monitoring and anomaly detection.
	/// Retention: Security events retained per compliance requirements.
	/// </para>
	/// </remarks>
	public string? IpAddress { get; set; }

	/// <summary>
	/// Gets or sets the client user agent string.
	/// </summary>
	public string? UserAgent { get; set; }

	/// <summary>
	/// Gets or sets additional event details (JSON).
	/// </summary>
	/// <remarks>
	/// Structured JSON for event-specific metadata.
	/// Examples: role changes, failed attempt counts, OAuth provider.
	/// </remarks>
	public string? Details { get; set; }

	/// <summary>
	/// Gets or sets whether the operation was successful.
	/// </summary>
	public bool Success { get; set; }

	/// <summary>
	/// Gets or sets the event timestamp.
	/// </summary>
	public DateTime CreateDate { get; set; }
}