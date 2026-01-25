// <copyright file="IdentityRegistration.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
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
	/// <param name="configuration">
	/// The application configuration for binding settings.
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
		string connectionString,
		IConfiguration configuration)
	{
		RegisterCoreInfrastructure(
			services,
			connectionString);

		RegisterAspNetIdentity(services);

		RegisterRepositories(services);

		RegisterServices(
			services,
			configuration);

		RegisterHealthCheckAndValidators(services);

		return services;
	}

	/// <summary>
	/// Registers core infrastructure including user context and DbContext.
	/// </summary>
	/// <param name="services">
	/// The service collection.
	/// </param>
	/// <param name="connectionString">
	/// The database connection string.
	/// </param>
	private static void RegisterCoreInfrastructure(
		IServiceCollection services,
		string connectionString)
	{
		// Register user context accessor (Identity owns authentication/user concerns)
		services.AddScoped<IUserContextAccessor, UserContextAccessor>();

		// Register IdentityDbContext via shared helper
		services.AddDomainDbContext<IdentityDbContext>(
			connectionString,
			SchemaConstants.Identity);
	}

	/// <summary>
	/// Registers ASP.NET Core Identity with password, lockout, and user settings.
	/// </summary>
	/// <param name="services">
	/// The service collection.
	/// </param>
	private static void RegisterAspNetIdentity(IServiceCollection services)
	{
		services
			.AddIdentityCore<ApplicationUser>(
				options =>
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
		services.AddScoped<
			IPasswordHasher<ApplicationUser>,
			IdentityArgon2PasswordHasher>();

		// Register transaction manager for Identity context
		services.AddTransactionManagerFor<IdentityDbContext>();
	}

	/// <summary>
	/// Registers custom repositories for entities not managed by Identity.
	/// </summary>
	/// <param name="services">
	/// The service collection.
	/// </param>
	private static void RegisterRepositories(IServiceCollection services)
	{
		services.AddScoped<
			IPermissionRequestRepository,
			PermissionRequestRepository>();
		services.AddScoped<ITokenRepository, TokenRepository>();
		services.AddScoped<IAuthRepository, AuthRepository>();
	}

	/// <summary>
	/// Registers application services including authentication, OAuth, and registration.
	/// </summary>
	/// <param name="services">
	/// The service collection.
	/// </param>
	/// <param name="configuration">
	/// The application configuration.
	/// </param>
	private static void RegisterServices(
		IServiceCollection services,
		IConfiguration configuration)
	{
		// Client info service for IP/UserAgent extraction (used by SecurityAuditService)
		services.AddScoped<IClientInfoService, ClientInfoService>();

		// Security audit logging service
		services.AddScoped<ISecurityAuditService, SecurityAuditService>();

		services.AddScoped<ITokenService, TokenService>();
		services.AddScoped<AuthenticationService>();
		services.AddScoped<OAuthService>();
		services.AddScoped<IOAuthService>(
			serviceProvider =>
				serviceProvider.GetRequiredService<OAuthService>());
		services.AddScoped<
			IOAuthCodeExchangeService,
			OAuthCodeExchangeService>();
		services.AddScoped<RegistrationService>();

		// Register ALTCHA services
		RegisterAltchaServices(
			services,
			configuration);
	}

	/// <summary>
	/// Registers ALTCHA Proof-of-Work captcha services.
	/// </summary>
	/// <param name="services">
	/// The service collection.
	/// </param>
	/// <param name="configuration">
	/// The application configuration.
	/// </param>
	private static void RegisterAltchaServices(
		IServiceCollection services,
		IConfiguration configuration)
	{
		// Bind ALTCHA settings from configuration
		services.Configure<AltchaSettings>(
			configuration.GetSection(AltchaSettings.SectionName));

		// Register EF-based challenge store
		services.AddScoped<AltchaChallengeStore>();

		// Read settings to determine if ALTCHA is enabled
		AltchaSettings altchaSettings =
			new();
		configuration
			.GetSection(AltchaSettings.SectionName)
			.Bind(altchaSettings);

		// Only register the Ixnas.AltchaNet library service when ALTCHA is enabled
		// When disabled, register a null placeholder that AltchaService will handle
		if (altchaSettings.Enabled)
		{
			byte[] hmacKey =
				string.IsNullOrWhiteSpace(altchaSettings.HmacKeyBase64)
					? throw new InvalidOperationException(
						"ALTCHA is enabled but HmacKeyBase64 is not configured")
					: Convert.FromBase64String(altchaSettings.HmacKeyBase64);

			services.AddScoped(
				serviceProvider =>
				{
					AltchaChallengeStore store =
						serviceProvider.GetRequiredService<AltchaChallengeStore>();

					return Ixnas.AltchaNet.Altcha.CreateServiceBuilder()
						.UseSha256(hmacKey)
						.UseStore(store)
						.SetComplexity(
							altchaSettings.ComplexityMin,
							altchaSettings.ComplexityMax)
						.SetExpiryInSeconds(altchaSettings.ExpirySeconds)
						.Build();
				});
		}
		else
		{
			// Register a null service when ALTCHA is disabled
			// AltchaService will check IsEnabled before using this
			services.AddScoped<Ixnas.AltchaNet.AltchaService>(
				serviceProvider => null!);
		}

		// Register application's ALTCHA service wrapper
		services.AddScoped<IAltchaService, AltchaService>();
	}

	/// <summary>
	/// Registers health check and validators for the Identity domain.
	/// </summary>
	/// <param name="services">
	/// The service collection.
	/// </param>
	private static void RegisterHealthCheckAndValidators(IServiceCollection services)
	{
		// Register health check for multi-db health monitoring using generic Wolverine wrapper
		services.AddWolverineHealthCheck<CheckIdentityHealthQuery>(
			SchemaConstants.Identity);

		// Register validators via scanning and command adapter
		services.AddDomainValidatorsFromAssemblyContaining<IdentityDbContext>();
	}
}