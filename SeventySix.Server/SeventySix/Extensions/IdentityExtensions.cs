// <copyright file="IdentityExtensions.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using SeventySix.Identity;
using SeventySix.Identity.Infrastructure;
using SeventySix.Identity.Settings;
using SeventySix.Shared;
using SeventySix.Shared.Infrastructure;

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
		// Register user context accessor (Identity owns authentication/user concerns)
		services.AddScoped<IUserContextAccessor, UserContextAccessor>();

		// Register IdentityDbContext with PostgreSQL and AuditInterceptor
		services.AddDbContext<IdentityDbContext>((serviceProvider, options) =>
		{
			AuditInterceptor auditInterceptor = serviceProvider.GetRequiredService<AuditInterceptor>();
			options.UseNpgsql(connectionString);
			options.AddInterceptors(auditInterceptor);
		});

		// Register transaction manager for Identity context
		services.AddScoped<ITransactionManager>(serviceProvider =>
			new TransactionManager(serviceProvider.GetRequiredService<IdentityDbContext>()));

		// Register repositories
		services.AddScoped<IUserRepository, UserRepository>();
		services.AddScoped<IPermissionRequestRepository, PermissionRequestRepository>();

		// Register services
		services.AddScoped<IUserService, UserService>();
		services.AddScoped<ITokenService, TokenService>();
		services.AddScoped<IAuthService, AuthService>();
		services.AddScoped<IPermissionRequestService, PermissionRequestService>();
		services.AddSingleton<IOAuthCodeExchangeService, OAuthCodeExchangeService>();

		// Register validators
		services.AddSingleton<IValidator<CreateUserRequest>, CreateUserValidator>();
		services.AddSingleton<IValidator<CreatePermissionRequestDto>, CreatePermissionRequestValidator>();
		services.AddSingleton<IValidator<UpdateUserRequest>, UpdateUserValidator>();
		services.AddSingleton<IValidator<UserQueryRequest>, UserQueryValidator>();
		services.AddSingleton<IValidator<LoginRequest>, LoginRequestValidator>();
		services.AddSingleton<IValidator<RegisterRequest>, RegisterRequestValidator>();
		services.AddSingleton<IValidator<ChangePasswordRequest>, ChangePasswordRequestValidator>();
		services.AddSingleton<IValidator<SetPasswordRequest>, SetPasswordRequestValidator>();
		services.AddSingleton<IValidator<ForgotPasswordRequest>, ForgotPasswordRequestValidator>();
		services.AddSingleton<IValidator<InitiateRegistrationRequest>, InitiateRegistrationRequestValidator>();
		services.AddSingleton<IValidator<CompleteRegistrationRequest>, CompleteRegistrationRequestValidator>();

		// Register background services
		services.AddHostedService<TokenCleanupService>();
		services.AddHostedService<AdminSeederService>();

		return services;
	}
}