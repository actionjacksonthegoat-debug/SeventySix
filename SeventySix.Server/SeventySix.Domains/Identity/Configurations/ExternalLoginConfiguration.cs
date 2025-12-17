// <copyright file="ExternalLoginConfiguration.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace SeventySix.Identity;

/// <summary>
/// Entity Framework Core configuration for <see cref="ExternalLogin"/> entity.
/// </summary>
/// <remarks>
/// Design Principles:
/// - Composite unique index on (Provider, ProviderUserId) prevents duplicate links
/// - Index on UserId for finding user's linked providers
/// </remarks>
public class ExternalLoginConfiguration
	: IEntityTypeConfiguration<ExternalLogin>
{
	/// <summary>
	/// Configures the entity mapping for ExternalLogin.
	/// </summary>
	/// <param name="builder">The builder to be used to configure the entity type.</param>
	public void Configure(EntityTypeBuilder<ExternalLogin> builder)
	{
		ArgumentNullException.ThrowIfNull(builder);

		builder.ToTable("ExternalLogins");

		builder.HasKey(e => e.Id);
		builder.Property(e => e.Id).UseIdentityColumn().IsRequired();

		// UserId - Required
		builder.Property(e => e.UserId).IsRequired();
		builder
			.HasIndex(e => e.UserId)
			.HasDatabaseName("IX_ExternalLogins_UserId");

		// Provider - Required, e.g., "GitHub"
		builder.Property(e => e.Provider).IsRequired().HasMaxLength(50);

		// ProviderUserId - Required, external ID from provider
		builder.Property(e => e.ProviderUserId).IsRequired().HasMaxLength(255);

		// Composite unique index - each provider user can only link once
		builder
			.HasIndex(e => new { e.Provider, e.ProviderUserId })
			.IsUnique()
			.HasDatabaseName("IX_ExternalLogins_Provider_ProviderUserId");

		// ProviderEmail - Optional
		builder.Property(e => e.ProviderEmail).HasMaxLength(255);

		// CreateDate - Required (auto-set by AuditInterceptor for ICreatableEntity)
		builder
			.Property(e => e.CreateDate)
			.IsRequired()
			.HasDefaultValueSql("NOW()")
			.HasColumnType("timestamp with time zone");

		// LastUsedAt - Optional
		builder
			.Property(e => e.LastUsedAt)
			.HasColumnType("timestamp with time zone");

		// FK relationship to User - cascade delete external logins when user is deleted
		builder
			.HasOne<User>()
			.WithMany()
			.HasForeignKey(externalLogin => externalLogin.UserId)
			.OnDelete(DeleteBehavior.Cascade);
	}
}