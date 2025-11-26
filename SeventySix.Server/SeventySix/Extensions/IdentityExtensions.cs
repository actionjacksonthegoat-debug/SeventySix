// <copyright file="IdentityExtensions.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using SeventySix.Identity;

namespace SeventySix.Extensions;

/// <summary>
/// Dependency injection extension methods for the Identity bounded context.
/// Registers all services, repositories, validators, and DbContext for Identity domain.
/// </summary>
/// <remarks>
/// This class follows the Extension Method pattern for clean service registration.
/// It encapsulates all Identity-related dependency injection configuration.
///
/// Usage in Program.cs:
/// <code>
/// builder.Services.AddIdentityDomain(builder.Configuration);
/// </code>
///
/// Registered Components:
/// - IdentityDbContext: Entity Framework Core DbContext
/// - IUserRepository → UserRepository: Data access layer
/// - IUserService → UserService: Business logic layer
/// - Validators: CreateUserValidator, UpdateUserValidator, UserQueryValidator
/// </remarks>
public static class IdentityExtensions
{
	/// <summary>
	/// Registers Identity bounded context services with the dependency injection container.
	/// </summary>
	/// <param name="services">The service collection to register services with.</param>
	/// <param name="connectionString">The database connection string for IdentityDbContext.</param>
	/// <returns>The service collection for method chaining.</returns>
	/// <remarks>
	/// Service Lifetimes:
	/// - DbContext: Scoped (per request)
	/// - Repositories: Scoped (shares DbContext instance)
	/// - Services: Scoped (shares repository and DbContext)
	/// - Validators: Singleton (stateless, thread-safe)
	///
	/// This method should be called once during application startup.
	/// </remarks>
	public static IServiceCollection AddIdentityDomain(this IServiceCollection services, string connectionString)
	{
		// Register IdentityDbContext with PostgreSQL
		services.AddDbContext<IdentityDbContext>(options =>
			options.UseNpgsql(connectionString));

		// Register repositories
		services.AddScoped<IUserRepository, UserRepository>();

		// Register services
		services.AddScoped<IUserService, UserService>();

		// Register validators
		services.AddSingleton<IValidator<CreateUserRequest>, CreateUserValidator>();
		services.AddSingleton<IValidator<UpdateUserRequest>, UpdateUserValidator>();
		services.AddSingleton<IValidator<UserQueryRequest>, UserQueryValidator>();

		return services;
	}
}
