// <copyright file="AuditInterceptor.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;

namespace SeventySix.Shared.Infrastructure;

/// <summary>
/// EF Core interceptor for automatic audit property management.
/// </summary>
/// <remarks>
/// Automatically sets CreateDate, ModifyDate, CreatedBy, and ModifiedBy
/// based on entity interface implementation (IAuditableEntity, IModifiableEntity, ICreatableEntity).
/// </remarks>
public class AuditInterceptor(
	IUserContextAccessor userContextAccessor,
	TimeProvider timeProvider) : SaveChangesInterceptor
{
	/// <summary>
	/// Intercepts SaveChangesAsync to set audit properties on entities.
	/// </summary>
	/// <param name="eventData">Contextual information about the DbContext operation.</param>
	/// <param name="result">Represents the current result if one exists.</param>
	/// <param name="cancellationToken">Cancellation token.</param>
	/// <returns>A task that represents the asynchronous save operation.</returns>
	public override ValueTask<InterceptionResult<int>> SavingChangesAsync(
		DbContextEventData eventData,
		InterceptionResult<int> result,
		CancellationToken cancellationToken = default)
	{
		if (eventData.Context is null)
		{
			return base.SavingChangesAsync(eventData, result, cancellationToken);
		}

		IEnumerable<Microsoft.EntityFrameworkCore.ChangeTracking.EntityEntry> entries =
			eventData.Context.ChangeTracker.Entries();
		string currentUser = userContextAccessor.GetCurrentUser();

		foreach (Microsoft.EntityFrameworkCore.ChangeTracking.EntityEntry entry in entries)
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
						timeProvider
							.GetUtcNow()
							.UtcDateTime;
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
					timeProvider
						.GetUtcNow()
						.UtcDateTime;
					auditable.ModifiedBy = currentUser;
				}
			}
			// IModifiableEntity: Set CreateDate + ModifyDate (no user tracking)
			// (ThirdPartyApiRequest - timestamps only)
			else if (entry.Entity is IModifiableEntity modifiable)
			{
				if (entry.State == EntityState.Added)
				{
					if (modifiable.CreateDate == default)
					{
						modifiable.CreateDate =
						timeProvider
							.GetUtcNow()
							.UtcDateTime;
					}
				}
				if (entry.State == EntityState.Modified)
				{
					modifiable.ModifyDate =
					timeProvider
						.GetUtcNow()
						.UtcDateTime;
				}
			}
			// ICreatableEntity: Set CreateDate only (no modify, no user tracking)
			// (Log entity - always gets CreateDate = NOW() if not set)
			else if (entry.Entity is ICreatableEntity creatable)
			{
				if (entry.State == EntityState.Added && creatable.CreateDate == default)
				{
					creatable.CreateDate =
						timeProvider
							.GetUtcNow()
							.UtcDateTime;
				}
			}
		}

		return base.SavingChangesAsync(eventData, result, cancellationToken);
	}
}