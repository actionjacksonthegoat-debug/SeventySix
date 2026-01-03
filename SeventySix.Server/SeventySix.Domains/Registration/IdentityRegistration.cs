// <copyright file="IdentityRegistration.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.DependencyInjection;
using SeventySix.Identity;
using SeventySix.Identity.Infrastructure;
using SeventySix.Shared.Constants;
using SeventySix.Shared.Interfaces;
using SeventySix.Shared.Registration;

namespace SeventySix.Registration;

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
/// - Repositories: IUserQueryRepository, IUserCommandRepository, IAuthRepository, ITokenRepository, etc.
/// - Wolverine CQRS handlers for Identity operations (auto-discovered)
/// - Traditional services: ITokenService, IOAuthService, IPermissionRequestService
/// - Validators: Command/query validators with FluentValidation.
/// </remarks>
public static class IdentityRegistration
{
	/// <summary>
	/// Registers Identity bounded context services with the dependency injection container.
	/// </summary>
	/// <param name="services">
	/// The service collection to register services with.
	/// </param>
	/// <param name="connectionString">
	/// The database connection string for IdentityDbContext.
	/// </param>
	/// <returns>
	/// The service collection for method chaining.
	/// </returns>
	/// <remarks>
	/// Service Lifetimes:
	/// - DbContext: Scoped (per request)
	/// - Repositories: Scoped (shares DbContext instance)
	/// - Services: Scoped (shares repository and DbContext)
	/// - Validators: Singleton (stateless, thread-safe)
	///
	/// This method should be called once during application startup.
	/// </remarks>
	public static IServiceCollection AddIdentityDomain(
		this IServiceCollection services,
		string connectionString)
	{
		// Register user context accessor (Identity owns authentication/user concerns)
		services.AddScoped<IUserContextAccessor, UserContextAccessor>();

		// Register IdentityDbContext via shared helper
		services.AddDomainDbContext<IdentityDbContext>(
			connectionString,
			SchemaConstants.Identity);

		// Register ASP.NET Core Identity
		services
			.AddIdentityCore<ApplicationUser>(options =>
			{
				// Password settings (validation only - Argon2 handles hashing)
				options.Password.RequiredLength = 8;
				options.Password.RequireDigit = true;
				options.Password.RequireLowercase = true;
				options.Password.RequireUppercase = true;
				options.Password.RequireNonAlphanumeric = true;

				// Lockout settings
				options.Lockout.DefaultLockoutTimeSpan =
					TimeSpan.FromMinutes(15);
				options.Lockout.MaxFailedAccessAttempts = 5;
				options.Lockout.AllowedForNewUsers = true;

				// User settings
				options.User.RequireUniqueEmail = true;
			})
			.AddRoles<ApplicationRole>()
			.AddEntityFrameworkStores<IdentityDbContext>()
			.AddSignInManager()
			.AddDefaultTokenProviders();

		// Replace default password hasher with Argon2
		services.AddSingleton<IPasswordHasher, Argon2PasswordHasher>();
		services.AddScoped<IPasswordHasher<ApplicationUser>, IdentityArgon2PasswordHasher>();

		// Register transaction manager for Identity context
		services.AddTransactionManagerFor<IdentityDbContext>();

		// Register custom repositories (for entities not managed by Identity)
		services.AddScoped<
			IPermissionRequestRepository,
			PermissionRequestRepository
		>();
		services.AddScoped<ITokenRepository, TokenRepository>();
		services.AddScoped<IAuthRepository, AuthRepository>();

		// Register services - focused interfaces only (no composite IUserService)
		services.AddScoped<ITokenService, TokenService>();
		services.AddScoped<AuthenticationService>();
		services.AddScoped<OAuthService>();
		services.AddScoped<IOAuthService>(serviceProvider =>
			serviceProvider.GetRequiredService<OAuthService>());
		services.AddScoped<
			IOAuthCodeExchangeService,
			OAuthCodeExchangeService
		>();
		services.AddScoped<RegistrationService>();

		// Register health check for multi-db health monitoring using generic Wolverine wrapper
		services.AddWolverineHealthCheck<CheckIdentityHealthQuery>(SchemaConstants.Identity);

		// Register validators via scanning and command adapter
		services.AddDomainValidatorsFromAssemblyContaining<IdentityDbContext>();

		return services;
	}
}