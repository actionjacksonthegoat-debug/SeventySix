// <copyright file="EmailVerificationTokenConfiguration.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace SeventySix.Identity;

/// <summary>
/// EF Core configuration for EmailVerificationToken entity.
/// </summary>
public class EmailVerificationTokenConfiguration
	: IEntityTypeConfiguration<EmailVerificationToken>
{
	/// <inheritdoc/>
	public void Configure(EntityTypeBuilder<EmailVerificationToken> builder)
	{
		builder.ToTable("EmailVerificationTokens");

		builder.HasKey(token => token.Id);

		builder.Property(token => token.Email).HasMaxLength(255).IsRequired();

		builder
			.Property(token => token.TokenHash)
			.HasMaxLength(64)
			.IsRequired();

		// ExpiresAt - Required
		builder.Property(token => token.ExpiresAt).IsRequired();

		// CreateDate - Required (auto-set by AuditInterceptor for ICreatableEntity)
		builder.Property(token => token.CreateDate).IsRequired();

		// IsUsed - Required
		builder.Property(token => token.IsUsed).IsRequired();

		builder.HasIndex(token => token.TokenHash).IsUnique();

		builder.HasIndex(token => token.Email);
	}
}