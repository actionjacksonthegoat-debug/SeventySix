// <copyright file="EmailVerificationTokenConfiguration.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace SeventySix.Identity;

/// <summary>
/// EF Core configuration for EmailVerificationToken entity.
/// </summary>
public class EmailVerificationTokenConfiguration : IEntityTypeConfiguration<EmailVerificationToken>
{
	/// <inheritdoc/>
	public void Configure(EntityTypeBuilder<EmailVerificationToken> builder)
	{
		builder.ToTable(
			"email_verification_tokens",
			"identity");

		builder.HasKey(token => token.Id);

		builder
			.Property(token => token.Email)
			.HasMaxLength(255)
			.IsRequired();

		builder
			.Property(token => token.Token)
			.HasMaxLength(128)
			.IsRequired();

		builder
			.HasIndex(token => token.Token)
			.IsUnique();

		builder
			.HasIndex(token => token.Email);
	}
}