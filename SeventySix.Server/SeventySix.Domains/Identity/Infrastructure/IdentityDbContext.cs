// <copyright file="IdentityDbContext.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.EntityFrameworkCore;
using SeventySix.Shared.Constants;
using SeventySix.Shared.Persistence;

namespace SeventySix.Identity;

/// <summary>
/// Entity Framework Core DbContext for Identity bounded context.
/// Manages User entities and their database operations.
/// </summary>
/// <remarks>
/// Inherits common configuration from BaseDbContext.
/// Provides "Identity" schema name and soft delete query filter for User entities.
/// </remarks>
public class IdentityDbContext : BaseDbContext<IdentityDbContext>
{
	/// <summary>
	/// Initializes a new instance of the <see cref="IdentityDbContext"/> class.
	/// </summary>
	/// <param name="options">The options for this context.</param>
	public IdentityDbContext(DbContextOptions<IdentityDbContext> options)
		: base(options)
	{
	}

	/// <summary>
	/// Gets or sets the Users DbSet.
	/// </summary>
	public DbSet<User> Users => Set<User>();

	/// <summary>
	/// Gets or sets the UserCredentials DbSet.
	/// </summary>
	public DbSet<UserCredential> UserCredentials => Set<UserCredential>();

	/// <summary>
	/// Gets or sets the RefreshTokens DbSet.
	/// </summary>
	public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();

	/// <summary>
	/// Gets or sets the ExternalLogins DbSet.
	/// </summary>
	public DbSet<ExternalLogin> ExternalLogins => Set<ExternalLogin>();

	/// <summary>
	/// Gets or sets the UserRoles DbSet.
	/// </summary>
	public DbSet<UserRole> UserRoles => Set<UserRole>();

	/// <summary>
	/// Gets or sets the PasswordResetTokens DbSet.
	/// </summary>
	public DbSet<PasswordResetToken> PasswordResetTokens => Set<PasswordResetToken>();

	/// <summary>
	/// Gets or sets the EmailVerificationTokens DbSet.
	/// </summary>
	public DbSet<EmailVerificationToken> EmailVerificationTokens => Set<EmailVerificationToken>();

	/// <summary>
	/// Gets or sets the PermissionRequests DbSet.
	/// </summary>
	public DbSet<PermissionRequest> PermissionRequests => Set<PermissionRequest>();

	/// <summary>
	/// Gets or sets the SecurityRoles DbSet.
	/// </summary>
	public DbSet<SecurityRole> SecurityRoles => Set<SecurityRole>();

	/// <summary>
	/// Gets the schema name for Identity bounded context.
	/// </summary>
	/// <returns>"Identity".</returns>
	protected override string GetSchemaName() => SchemaConstants.Identity;

	/// <summary>
	/// Configures entity-specific settings for Identity domain.
	/// </summary>
	/// <param name="modelBuilder">The model builder.</param>
	/// <remarks>
	/// Applies global query filter for soft delete on User entities.
	/// </remarks>
	protected override void ConfigureEntities(ModelBuilder modelBuilder)
	{
		// Global query filter for soft delete
		modelBuilder.Entity<User>().HasQueryFilter(u => !u.IsDeleted);
	}
}