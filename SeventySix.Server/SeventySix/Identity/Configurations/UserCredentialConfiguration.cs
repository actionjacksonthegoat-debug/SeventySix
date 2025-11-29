// <copyright file="UserCredentialConfiguration.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace SeventySix.Identity;

/// <summary>
/// Entity Framework Core configuration for <see cref="UserCredential"/> entity.
/// </summary>
/// <remarks>
/// Design Principles:
/// - Fluent API over Data Annotations
/// - One credential per user (1:1 relationship)
/// - Index on UserId for fast lookups during login
/// </remarks>
public class UserCredentialConfiguration : IEntityTypeConfiguration<UserCredential>
{
	/// <summary>
	/// Configures the entity mapping for UserCredential.
	/// </summary>
	/// <param name="builder">The builder to be used to configure the entity type.</param>
	public void Configure(EntityTypeBuilder<UserCredential> builder)
	{
		ArgumentNullException.ThrowIfNull(builder);

		builder.ToTable("UserCredentials");

		// UserId is the primary key (1:1 with User)
		builder.HasKey(e => e.UserId);
		builder.Property(e => e.UserId)
			.IsRequired();

		// PasswordHash - Required, BCrypt hash is 60 chars
		builder.Property(e => e.PasswordHash)
			.IsRequired()
			.HasMaxLength(72);

		// PasswordChangedAt - Optional
		builder.Property(e => e.PasswordChangedAt)
			.HasColumnType("timestamp with time zone");

		// CreatedAt - Required
		builder.Property(e => e.CreatedAt)
			.IsRequired()
			.HasDefaultValueSql("NOW()")
			.HasColumnType("timestamp with time zone");

		// FK relationship to User (1:1) - cascade delete credential when user is deleted
		builder
			.HasOne<User>()
			.WithOne()
			.HasForeignKey<UserCredential>(credential => credential.UserId)
			.OnDelete(DeleteBehavior.Cascade);
	}
}