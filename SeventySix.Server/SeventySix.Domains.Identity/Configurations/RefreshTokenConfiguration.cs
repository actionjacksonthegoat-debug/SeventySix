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
public sealed class RefreshTokenConfiguration : IEntityTypeConfiguration<RefreshToken>
{
	/// <summary>
	/// Configures the entity mapping for RefreshToken.
	/// </summary>
	/// <param name="builder">
	/// The builder to be used to configure the entity type.
	/// </param>
	public void Configure(EntityTypeBuilder<RefreshToken> builder)
	{
		ArgumentNullException.ThrowIfNull(builder);

		builder.ToTable("RefreshTokens");

		builder.HasKey(refreshToken => refreshToken.Id);
		builder
			.Property(refreshToken => refreshToken.Id)
			.UseIdentityColumn()
			.IsRequired();

		// TokenHash - Required, SHA256 hex = 64 chars
		builder
			.Property(refreshToken => refreshToken.TokenHash)
			.IsRequired()
			.HasMaxLength(64);
		builder
			.HasIndex(refreshToken => refreshToken.TokenHash)
			.IsUnique()
			.HasDatabaseName("IX_RefreshTokens_TokenHash");

		// UserId - Required
		builder
			.Property(refreshToken => refreshToken.UserId)
			.IsRequired();

		// Composite index for finding valid tokens by user
		builder
			.HasIndex(
				refreshToken => new
				{
					refreshToken.UserId,
					refreshToken.IsRevoked,
				})
			.HasDatabaseName("IX_RefreshTokens_UserId_IsRevoked");

		// FamilyId - Required, for token rotation reuse detection
		builder
			.Property(refreshToken => refreshToken.FamilyId)
			.IsRequired();
		builder
			.HasIndex(refreshToken => refreshToken.FamilyId)
			.HasDatabaseName("IX_RefreshTokens_FamilyId");

		// ExpiresAt - Required
		builder
			.Property(refreshToken => refreshToken.ExpiresAt)
			.IsRequired()
			.HasColumnType("timestamp with time zone");

		// SessionStartedAt - Required, for absolute session timeout enforcement
		builder
			.Property(refreshToken => refreshToken.SessionStartedAt)
			.IsRequired()
			.HasColumnType("timestamp with time zone");

		// CreateDate - Required (auto-set by AuditInterceptor for ICreatableEntity)
		builder
			.Property(refreshToken => refreshToken.CreateDate)
			.IsRequired()
			.HasDefaultValueSql("NOW()")
			.HasColumnType("timestamp with time zone");

		// IsRevoked - Required
		builder
			.Property(refreshToken => refreshToken.IsRevoked)
			.IsRequired()
			.HasDefaultValue(false);

		// RevokedAt - Optional
		builder
			.Property(refreshToken => refreshToken.RevokedAt)
			.HasColumnType("timestamp with time zone");

		// CreatedByIp - Optional, IPv6 max 45 chars
		builder
			.Property(refreshToken => refreshToken.CreatedByIp)
			.HasMaxLength(45);

		// FK relationship to User - cascade delete tokens when user is deleted
		builder
			.HasOne<ApplicationUser>()
			.WithMany()
			.HasForeignKey(refreshToken => refreshToken.UserId)
			.OnDelete(DeleteBehavior.Cascade);
	}
}