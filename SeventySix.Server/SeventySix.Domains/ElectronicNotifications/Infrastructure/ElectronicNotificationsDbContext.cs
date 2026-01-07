// <copyright file="ElectronicNotificationsDbContext.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.EntityFrameworkCore;
using SeventySix.ElectronicNotifications.Emails;
using SeventySix.Shared.Constants;
using SeventySix.Shared.Persistence;

namespace SeventySix.ElectronicNotifications;

/// <summary>
/// Database context for the ElectronicNotifications bounded context.
/// </summary>
/// <remarks>
/// Manages email queue and future notification entities.
/// Uses PostgreSQL with schema 'ElectronicNotifications' for isolation.
/// Inherits common configuration from BaseDbContext.
///
/// Design Patterns:
/// - Unit of Work: Coordinates changes to multiple entities
/// - Outbox Pattern: Persists emails before sending for reliability
/// - Template Method: Inherits from BaseDbContext
///
/// SOLID Principles:
/// - SRP: Only responsible for ElectronicNotifications domain data access
/// - OCP: Can be extended with new entity configurations (SMS, push, etc.)
/// </remarks>
public class ElectronicNotificationsDbContext
	: BaseDbContext<ElectronicNotificationsDbContext>
{
	/// <summary>
	/// Initializes a new instance of the <see cref="ElectronicNotificationsDbContext"/> class.
	/// </summary>
	/// <param name="options">
	/// The options for this context.
	/// </param>
	public ElectronicNotificationsDbContext(
		DbContextOptions<ElectronicNotificationsDbContext> options)
		: base(options) { }

	/// <summary>
	/// Gets the EmailQueue DbSet.
	/// </summary>
	public DbSet<EmailQueueEntry> EmailQueue => Set<EmailQueueEntry>();

	/// <summary>
	/// Gets the schema name for ElectronicNotifications bounded context.
	/// </summary>
	/// <returns>
	/// "ElectronicNotifications".
	/// </returns>
	protected override string GetSchemaName() =>
		SchemaConstants.ElectronicNotifications;
}