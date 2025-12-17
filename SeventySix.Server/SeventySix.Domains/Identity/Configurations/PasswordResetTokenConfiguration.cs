// <copyright file="PasswordResetTokenConfiguration.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace SeventySix.Identity;

/// <summary>
/// Entity Framework Core configuration for <see cref="PasswordResetToken"/> entity.
/// </summary>
/// <remarks>
/// Design Principles:
/// - Token indexed for fast lookups (unique constraint)
/// - UserId indexed for finding user's tokens
/// - All datetime fields required for audit trail.
/// </remarks>
public class PasswordResetTokenConfiguration
	: IEntityTypeConfiguration<PasswordResetToken>
{
	/// <summary>
	/// Configures the entity mapping for PasswordResetToken.
	/// </summary>
	/// <param name="builder">The builder to be used to configure the entity type.</param>
	public void Configure(EntityTypeBuilder<PasswordResetToken> builder)
	{
		ArgumentNullException.ThrowIfNull(builder);

		builder.ToTable("PasswordResetTokens", "identity");

		builder.HasKey(token => token.Id);

		builder
			.Property(resetToken => resetToken.Id)
			.UseIdentityColumn()
			.IsRequired();

		// TokenHash - Required, SHA256 hex = 64 chars
		builder
			.Property(resetToken => resetToken.TokenHash)
			.HasMaxLength(64)
			.IsRequired();

		builder
			.HasIndex(resetToken => resetToken.TokenHash)
			.IsUnique()
			.HasDatabaseName("IX_PasswordResetTokens_TokenHash");

		// UserId - for finding tokens by user
		builder.Property(resetToken => resetToken.UserId).IsRequired();

		builder
			.HasIndex(resetToken => resetToken.UserId)
			.HasDatabaseName("IX_PasswordResetTokens_UserId");

		// FK relationship to User - cascade delete tokens when user is deleted
		builder
			.HasOne<User>()
			.WithMany()
			.HasForeignKey(resetToken => resetToken.UserId)
			.OnDelete(DeleteBehavior.Cascade);

		// ExpiresAt - Required
		builder.Property(resetToken => resetToken.ExpiresAt).IsRequired();

		// CreateDate - Required (auto-set by AuditInterceptor for ICreatableEntity)
		builder.Property(resetToken => resetToken.CreateDate).IsRequired();

		// IsUsed - Required, defaults to false
		builder.Property(resetToken => resetToken.IsUsed).IsRequired();
	}
}