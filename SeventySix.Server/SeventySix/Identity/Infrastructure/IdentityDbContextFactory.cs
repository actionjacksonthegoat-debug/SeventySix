// <copyright file="IdentityDbContextFactory.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace SeventySix.Identity;

/// <summary>
/// Design-time factory for creating IdentityDbContext instances.
/// Used by EF Core tools for migrations and scaffolding.
/// </summary>
public class IdentityDbContextFactory : IDesignTimeDbContextFactory<IdentityDbContext>
{
	/// <summary>
	/// Creates a new instance of IdentityDbContext for design-time operations.
	/// </summary>
	/// <param name="args">Arguments passed from EF Core tools.</param>
	/// <returns>A configured IdentityDbContext instance.</returns>
	public IdentityDbContext CreateDbContext(string[] args)
	{
		DbContextOptionsBuilder<IdentityDbContext> optionsBuilder = new DbContextOptionsBuilder<IdentityDbContext>();

		// Use a placeholder connection string for design-time operations
		// The actual connection string comes from appsettings.json at runtime
		optionsBuilder.UseNpgsql("Host=localhost;Database=seventysix;Username=postgres;Password=postgres");

		return new IdentityDbContext(optionsBuilder.Options);
	}
}
