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

		builder.Property(token => token.Id).UseIdentityColumn().IsRequired();

		// Token - Required, base64 encoded 64 bytes = ~88 chars (allow 128 for safety)
		builder.Property(token => token.Token).HasMaxLength(128).IsRequired();

		builder
			.HasIndex(token => token.Token)
			.IsUnique()
			.HasDatabaseName("IX_PasswordResetTokens_Token");

		// UserId - for finding tokens by user
		builder.Property(token => token.UserId).IsRequired();

		builder
			.HasIndex(token => token.UserId)
			.HasDatabaseName("IX_PasswordResetTokens_UserId");

		// FK relationship to User - cascade delete tokens when user is deleted
		builder
			.HasOne<User>()
			.WithMany()
			.HasForeignKey(token => token.UserId)
			.OnDelete(DeleteBehavior.Cascade);

		// ExpiresAt - Required
		builder.Property(token => token.ExpiresAt).IsRequired();

		// CreateDate - Required (auto-set by AuditInterceptor for ICreatableEntity)
		builder.Property(token => token.CreateDate).IsRequired();

		// IsUsed - Required, defaults to false
		builder.Property(token => token.IsUsed).IsRequired();
	}
}
