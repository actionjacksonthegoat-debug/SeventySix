// <copyright file="AltchaChallengeConfiguration.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace SeventySix.Identity;

/// <summary>
/// Entity Framework Core configuration for <see cref="AltchaChallenge"/> entity.
/// </summary>
/// <remarks>
/// Design Principles:
/// - Challenge string is indexed for fast lookups
/// - ExpiryUtc enables cleanup of expired challenges
/// </remarks>
public class AltchaChallengeConfiguration : IEntityTypeConfiguration<AltchaChallenge>
{
	/// <summary>
	/// Configures the entity mapping for AltchaChallenge.
	/// </summary>
	/// <param name="builder">
	/// The builder to be used to configure the entity type.
	/// </param>
	public void Configure(EntityTypeBuilder<AltchaChallenge> builder)
	{
		ArgumentNullException.ThrowIfNull(builder);

		builder.ToTable("AltchaChallenges");

		builder.HasKey(altchaChallenge => altchaChallenge.Id);
		builder
			.Property(altchaChallenge => altchaChallenge.Id)
			.UseIdentityColumn()
			.IsRequired();

		// Challenge - Required, indexed for fast lookups
		builder
			.Property(altchaChallenge => altchaChallenge.Challenge)
			.IsRequired()
			.HasMaxLength(256);
		builder
			.HasIndex(altchaChallenge => altchaChallenge.Challenge)
			.IsUnique()
			.HasDatabaseName("IX_AltchaChallenges_Challenge");

		// ExpiryUtc - Required for cleanup
		builder
			.Property(altchaChallenge => altchaChallenge.ExpiryUtc)
			.IsRequired();
		builder
			.HasIndex(altchaChallenge => altchaChallenge.ExpiryUtc)
			.HasDatabaseName("IX_AltchaChallenges_ExpiryUtc");
	}
}
