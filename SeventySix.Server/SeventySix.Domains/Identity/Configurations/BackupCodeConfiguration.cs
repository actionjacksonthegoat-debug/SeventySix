// <copyright file="BackupCodeConfiguration.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace SeventySix.Identity;

/// <summary>
/// Entity Framework Core configuration for <see cref="BackupCode"/> entity.
/// </summary>
/// <remarks>
/// Design Principles:
/// - Backup codes are hashed using Identity's password hasher
/// - Multiple codes per user (typically 10)
/// - Single-use: marked as used after verification
/// </remarks>
public class BackupCodeConfiguration : IEntityTypeConfiguration<BackupCode>
{
	/// <summary>
	/// Configures the entity mapping for BackupCode.
	/// </summary>
	/// <param name="builder">
	/// The builder to be used to configure the entity type.
	/// </param>
	public void Configure(EntityTypeBuilder<BackupCode> builder)
	{
		ArgumentNullException.ThrowIfNull(builder);

		builder.ToTable("BackupCodes");

		builder.HasKey(code => code.Id);
		builder
			.Property(code => code.Id)
			.UseIdentityColumn()
			.IsRequired();

		// UserId - Required
		builder
			.Property(code => code.UserId)
			.IsRequired();

		// CodeHash - Required, Identity hasher output (variable length, max ~100)
		builder
			.Property(code => code.CodeHash)
			.IsRequired()
			.HasMaxLength(128);

		// IsUsed - Required with default
		builder
			.Property(code => code.IsUsed)
			.IsRequired()
			.HasDefaultValue(false);

		// UsedAt - Optional
		builder
			.Property(code => code.UsedAt)
			.IsRequired(false);

		// CreateDate - Required
		builder
			.Property(code => code.CreateDate)
			.IsRequired();

		// IsDeleted - Required with default false
		builder
			.Property(code => code.IsDeleted)
			.IsRequired()
			.HasDefaultValue(false);

		// Query filter to match ApplicationUser's soft-delete filter
		builder.HasQueryFilter(code => !code.IsDeleted);

		// Index for finding user's unused codes
		builder
			.HasIndex(
				code => new { code.UserId, code.IsUsed })
			.HasDatabaseName("IX_BackupCodes_UserId_IsUsed");

		// Relationship to User
		builder
			.HasOne(code => code.User)
			.WithMany()
			.HasForeignKey(code => code.UserId)
			.OnDelete(DeleteBehavior.Cascade);
	}
}