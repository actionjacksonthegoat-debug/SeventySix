// <copyright file="MfaChallengeConfiguration.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace SeventySix.Identity;

/// <summary>
/// Entity Framework Core configuration for <see cref="MfaChallenge"/> entity.
/// </summary>
/// <remarks>
/// Design Principles:
/// - Token is a GUID (32 chars hex) for challenge identification
/// - SHA256 hash is 64 characters (hex-encoded)
/// - Unique index on Token for fast lookups
/// - Filtered index for active (unused) challenges
/// </remarks>
public class MfaChallengeConfiguration : IEntityTypeConfiguration<MfaChallenge>
{
	/// <summary>
	/// Configures the entity mapping for MfaChallenge.
	/// </summary>
	/// <param name="builder">
	/// The builder to be used to configure the entity type.
	/// </param>
	public void Configure(EntityTypeBuilder<MfaChallenge> builder)
	{
		ArgumentNullException.ThrowIfNull(builder);

		builder.ToTable("MfaChallenges");

		builder.HasKey(challenge => challenge.Id);
		builder
			.Property(challenge => challenge.Id)
			.UseIdentityColumn()
			.IsRequired();

		// Token - Required, GUID hex = 32 chars
		builder
			.Property(challenge => challenge.Token)
			.IsRequired()
			.HasMaxLength(32);
		builder
			.HasIndex(challenge => challenge.Token)
			.IsUnique()
			.HasDatabaseName("IX_MfaChallenges_Token");

		// UserId - Required
		builder
			.Property(challenge => challenge.UserId)
			.IsRequired();

		// CodeHash - Required, SHA256 hex = 64 chars
		builder
			.Property(challenge => challenge.CodeHash)
			.IsRequired()
			.HasMaxLength(64);

		// ExpiresAt - Required
		builder
			.Property(challenge => challenge.ExpiresAt)
			.IsRequired();

		// Attempts - Required with default
		builder
			.Property(challenge => challenge.Attempts)
			.IsRequired()
			.HasDefaultValue(0);

		// IsUsed - Required with default
		builder
			.Property(challenge => challenge.IsUsed)
			.IsRequired()
			.HasDefaultValue(false);

		// ClientIp - Optional, max 45 chars for IPv6
		builder
			.Property(challenge => challenge.ClientIp)
			.HasMaxLength(45);

		// CreateDate - Required
		builder
			.Property(challenge => challenge.CreateDate)
			.IsRequired();

		// IsDeleted - Required with default false
		builder
			.Property(challenge => challenge.IsDeleted)
			.IsRequired()
			.HasDefaultValue(false);

		// Query filter to match ApplicationUser's soft-delete filter
		builder.HasQueryFilter(challenge => !challenge.IsDeleted);

		// Filtered index for finding active challenges by user
		builder
			.HasIndex(
				challenge => new
				{
					challenge.UserId,
					challenge.ExpiresAt
				})
			.HasFilter("\"IsUsed\" = false")
			.HasDatabaseName("IX_MfaChallenges_UserId_ExpiresAt_Active");

		// Foreign key to ApplicationUser
		builder
			.HasOne(challenge => challenge.User)
			.WithMany()
			.HasForeignKey(challenge => challenge.UserId)
			.OnDelete(DeleteBehavior.Cascade);
	}
}