// <copyright file="RefreshTokenConfiguration.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace SeventySix.Identity;

/// <summary>
/// Entity Framework Core configuration for <see cref="RefreshToken"/> entity.
/// </summary>
/// <remarks>
/// Design Principles:
/// - SHA256 hash is 64 characters (hex-encoded)
/// - Index on TokenHash for fast token lookups
/// - Composite index on UserId + IsRevoked for user token queries
/// </remarks>
public class RefreshTokenConfiguration : IEntityTypeConfiguration<RefreshToken>
{
	/// <summary>
	/// Configures the entity mapping for RefreshToken.
	/// </summary>
	/// <param name="builder">The builder to be used to configure the entity type.</param>
	public void Configure(EntityTypeBuilder<RefreshToken> builder)
	{
		ArgumentNullException.ThrowIfNull(builder);

		builder.ToTable("RefreshTokens");

		builder.HasKey(e => e.Id);
		builder.Property(e => e.Id)
			.UseIdentityColumn()
			.IsRequired();

		// TokenHash - Required, SHA256 hex = 64 chars
		builder.Property(e => e.TokenHash)
			.IsRequired()
			.HasMaxLength(64);
		builder.HasIndex(e => e.TokenHash)
			.IsUnique()
			.HasDatabaseName("IX_RefreshTokens_TokenHash");

		// UserId - Required
		builder.Property(e => e.UserId)
			.IsRequired();

		// Composite index for finding valid tokens by user
		builder.HasIndex(e => new { e.UserId, e.IsRevoked })
			.HasDatabaseName("IX_RefreshTokens_UserId_IsRevoked");

		// FamilyId - Required, for token rotation reuse detection
		builder.Property(e => e.FamilyId)
			.IsRequired();
		builder.HasIndex(e => e.FamilyId)
			.HasDatabaseName("IX_RefreshTokens_FamilyId");

		// ExpiresAt - Required
		builder.Property(e => e.ExpiresAt)
			.IsRequired()
			.HasColumnType("timestamp with time zone");

		// CreatedAt - Required
		builder.Property(e => e.CreatedAt)
			.IsRequired()
			.HasDefaultValueSql("NOW()")
			.HasColumnType("timestamp with time zone");

		// IsRevoked - Required
		builder.Property(e => e.IsRevoked)
			.IsRequired()
			.HasDefaultValue(false);

		// RevokedAt - Optional
		builder.Property(e => e.RevokedAt)
			.HasColumnType("timestamp with time zone");

		// CreatedByIp - Optional, IPv6 max 45 chars
		builder.Property(e => e.CreatedByIp)
			.HasMaxLength(45);

		// FK relationship to User - cascade delete tokens when user is deleted
		builder
			.HasOne<User>()
			.WithMany()
			.HasForeignKey(refreshToken => refreshToken.UserId)
			.OnDelete(DeleteBehavior.Cascade);
	}
}