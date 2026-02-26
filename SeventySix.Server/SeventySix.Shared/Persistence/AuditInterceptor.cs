// <copyright file="AuditInterceptor.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using SeventySix.Shared.Entities;
using SeventySix.Shared.Interfaces;

namespace SeventySix.Shared.Persistence;

/// <summary>
/// EF Core interceptor for automatic audit property management.
/// </summary>
/// <param name="userContextAccessor">
/// Accessor used to determine the current user for audit fields.
/// </param>
/// <param name="timeProvider">
/// Provides the current time used for date/time audit fields.
/// </param>
/// <remarks>
/// Automatically sets CreateDate, ModifyDate, CreatedBy, and ModifiedBy
/// based on entity interface implementation (IAuditableEntity, IModifiableEntity, ICreatableEntity).
/// </remarks>
public sealed class AuditInterceptor(
	IUserContextAccessor userContextAccessor,
	TimeProvider timeProvider) : SaveChangesInterceptor
{
	/// <summary>
	/// Intercepts SaveChangesAsync to set audit properties on entities.
	/// </summary>
	/// <param name="eventData">
	/// Contextual information about the DbContext operation.
	/// </param>
	/// <param name="result">
	/// Represents the current result if one exists.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token.
	/// </param>
	/// <returns>
	/// A task that represents the asynchronous save operation.
	/// </returns>
	public override ValueTask<InterceptionResult<int>> SavingChangesAsync(
		DbContextEventData eventData,
		InterceptionResult<int> result,
		CancellationToken cancellationToken = default)
	{
		if (eventData.Context is null)
		{
			return base.SavingChangesAsync(
				eventData,
				result,
				cancellationToken);
		}

		IEnumerable<Microsoft.EntityFrameworkCore.ChangeTracking.EntityEntry> entries =
			eventData.Context.ChangeTracker.Entries();
		string currentUser =
			userContextAccessor.GetCurrentUser();

		foreach (
			Microsoft.EntityFrameworkCore.ChangeTracking.EntityEntry entry in entries)
		{
			// IAuditableEntity: Set CreateDate, ModifyDate, CreatedBy, ModifiedBy
			// (User entity only - has timestamps + user tracking)
			if (entry.Entity is IAuditableEntity auditable)
			{
				if (entry.State == EntityState.Added)
				{
					if (auditable.CreateDate == default)
					{
						auditable.CreateDate =
						timeProvider.GetUtcNow();
					}
					if (string.IsNullOrWhiteSpace(auditable.CreatedBy))
					{
						auditable.CreatedBy = currentUser;
					}
					if (string.IsNullOrWhiteSpace(auditable.ModifiedBy))
					{
						auditable.ModifiedBy = currentUser;
					}
				}
				if (entry.State == EntityState.Modified)
				{
					auditable.ModifyDate =
						timeProvider.GetUtcNow();
					auditable.ModifiedBy = currentUser;
				}
			}
			// IModifiableEntity: Set CreateDate + ModifyDate (no user tracking)
			// (ThirdPartyApiRequest - timestamps only)
			else if (entry.Entity is IModifiableEntity modifiable)
			{
				if (entry.State == EntityState.Added
					&& modifiable.CreateDate == default)
				{
					modifiable.CreateDate =
					timeProvider.GetUtcNow();
				}

				if (entry.State == EntityState.Modified)
				{
					modifiable.ModifyDate =
						timeProvider.GetUtcNow();
				}
			}
			// ICreatableEntity: Set CreateDate only (no modify, no user tracking)
			// (Log entity - always gets CreateDate = NOW() if not set)
			else if (entry.Entity is ICreatableEntity creatable
				&& entry.State == EntityState.Added
				&& creatable.CreateDate == default)
			{
				creatable.CreateDate =
					timeProvider.GetUtcNow();
			}
		}

		return base.SavingChangesAsync(eventData, result, cancellationToken);
	}
}