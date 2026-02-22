// <copyright file="ApplicationRoleConfiguration.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SeventySix.Identity.Constants;

namespace SeventySix.Identity;

/// <summary>
/// EF Core configuration for <see cref="ApplicationRole"/>.
/// </summary>
public sealed class ApplicationRoleConfiguration : IEntityTypeConfiguration<ApplicationRole>
{
	/// <inheritdoc/>
	public void Configure(EntityTypeBuilder<ApplicationRole> builder)
	{
		// Seed the three core roles
		DateTimeOffset seedDate =
			new(2025, 1, 1, 0, 0, 0, TimeSpan.Zero);

		builder.HasData(
			new ApplicationRole
			{
				Id = 1,
				Name = RoleConstants.User,
				NormalizedName =
					RoleConstants.User.ToUpperInvariant(),
				Description = "Standard user access",
				IsActive = true,
				CreateDate = seedDate,
				ConcurrencyStamp =
					"a1b2c3d4-e5f6-7890-abcd-ef1234567890",
			},
			new ApplicationRole
			{
				Id = 2,
				Name = RoleConstants.Developer,
				NormalizedName =
					RoleConstants.Developer.ToUpperInvariant(),
				Description = "Access to developer tools and APIs",
				IsActive = true,
				CreateDate = seedDate,
				ConcurrencyStamp =
					"b2c3d4e5-f678-9012-bcde-f12345678901",
			},
			new ApplicationRole
			{
				Id = 3,
				Name = RoleConstants.Admin,
				NormalizedName =
					RoleConstants.Admin.ToUpperInvariant(),
				Description = "Full administrative access",
				IsActive = true,
				CreateDate = seedDate,
				ConcurrencyStamp =
					"c3d4e5f6-7890-1234-cdef-123456789012",
			});
	}
}