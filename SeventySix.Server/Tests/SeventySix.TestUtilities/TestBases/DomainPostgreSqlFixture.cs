// <copyright file="DomainPostgreSqlFixture.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Collections.Concurrent;

namespace SeventySix.TestUtilities.TestBases;

/// <summary>
/// Domain-specific PostgreSQL fixture that creates an isolated database per bounded context.
/// </summary>
/// <remarks>
/// Uses the shared PostgreSQL container from <see cref="SharedContainerManager"/> but creates
/// separate databases per domain. This enables parallel test execution across domains
/// while minimizing container startup overhead.
///
/// Each bounded context (Identity, Logging, ApiTracking, ElectronicNotifications)
/// gets its own database within the shared container.
/// </remarks>
public class DomainPostgreSqlFixture : BasePostgreSqlFixture
{
	private readonly string DomainName;
	private readonly ConcurrentDictionary<Type, object> CachedFactories = new();
	private string? ConnectionStringValue;

	/// <summary>
	/// Initializes a new instance of the <see cref="DomainPostgreSqlFixture"/> class.
	/// </summary>
	/// <param name="domainName">
	/// The bounded context name (Identity, Logging, ApiTracking, ElectronicNotifications).
	/// </param>
	public DomainPostgreSqlFixture(string domainName)
	{
		DomainName = domainName;
	}

	/// <inheritdoc/>
	public override string ConnectionString =>
		ConnectionStringValue
		?? throw new InvalidOperationException(
			"Fixture not initialized. Call InitializeAsync first.");

	/// <inheritdoc/>
	public override SharedWebApplicationFactory<TProgram> GetOrCreateFactory<TProgram>()
	{
		return (SharedWebApplicationFactory<TProgram>)
			CachedFactories.GetOrAdd(
				typeof(TProgram),
				_ => new SharedWebApplicationFactory<TProgram>(ConnectionString));
	}

	/// <inheritdoc/>
	public override async Task InitializeAsync()
	{
		// Use shared container with domain-specific database name
		// This is faster than creating separate containers
		string databaseName =
			$"domain_{DomainName.ToLowerInvariant()}";

		ConnectionStringValue =
			await SharedContainerManager.CreateDatabaseAsync(databaseName);
	}

	/// <inheritdoc/>
	public override async Task DisposeAsync()
	{
		foreach (object factory in CachedFactories.Values)
		{
			if (factory is IDisposable disposable)
			{
				disposable.Dispose();
			}
		}

		CachedFactories.Clear();
		await Task.CompletedTask;
	}
}

/// <summary>
/// Identity domain PostgreSQL fixture.
/// </summary>
public sealed class IdentityPostgreSqlFixture : DomainPostgreSqlFixture
{
	/// <summary>
	/// Initializes a new instance of the <see cref="IdentityPostgreSqlFixture"/> class.
	/// </summary>
	public IdentityPostgreSqlFixture()
		: base("Identity")
	{
	}
}

/// <summary>
/// Logging domain PostgreSQL fixture.
/// </summary>
public sealed class LoggingPostgreSqlFixture : DomainPostgreSqlFixture
{
	/// <summary>
	/// Initializes a new instance of the <see cref="LoggingPostgreSqlFixture"/> class.
	/// </summary>
	public LoggingPostgreSqlFixture()
		: base("Logging")
	{
	}
}

/// <summary>
/// ApiTracking domain PostgreSQL fixture.
/// </summary>
public sealed class ApiTrackingPostgreSqlFixture : DomainPostgreSqlFixture
{
	/// <summary>
	/// Initializes a new instance of the <see cref="ApiTrackingPostgreSqlFixture"/> class.
	/// </summary>
	public ApiTrackingPostgreSqlFixture()
		: base("ApiTracking")
	{
	}
}

/// <summary>
/// ElectronicNotifications domain PostgreSQL fixture.
/// </summary>
public sealed class ElectronicNotificationsPostgreSqlFixture : DomainPostgreSqlFixture
{
	/// <summary>
	/// Initializes a new instance of the <see cref="ElectronicNotificationsPostgreSqlFixture"/> class.
	/// </summary>
	public ElectronicNotificationsPostgreSqlFixture()
		: base("ElectronicNotifications")
	{
	}
}