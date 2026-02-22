// <copyright file="IdentityRegistration.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using SeventySix.Identity.Infrastructure;
using SeventySix.Identity.Settings;
using SeventySix.Shared.BackgroundJobs;
using SeventySix.Shared.Constants;
using SeventySix.Shared.Interfaces;
using SeventySix.Shared.Registration;

namespace SeventySix.Identity.Registration;

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
		// Bind AuthSettings from configuration to use as single source of truth
		AuthSettings authSettings =
			configuration
				.GetSection(AuthSettings.SectionName)
				.Get<AuthSettings>()
			?? throw new InvalidOperationException(
				$"Auth configuration section '{AuthSettings.SectionName}' is missing.");

		RegisterCoreInfrastructure(
			services,
			connectionString);

		RegisterAspNetIdentity(
			services,
			authSettings);

		RegisterRepositories(services);

		RegisterServices(
			services,
			configuration);

		RegisterBackgroundJobs(
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
	/// <param name="authSettings">
	/// The authentication settings for configuring Identity options.
	/// This is the single source of truth for password and lockout settings (DRY).
	/// </param>
	private static void RegisterAspNetIdentity(
		IServiceCollection services,
		AuthSettings authSettings)
	{
		PasswordSettings passwordSettings =
			authSettings.Password;

		LockoutSettings lockoutSettings =
			authSettings.Lockout;

		services
			.AddIdentityCore<ApplicationUser>(
				options =>
				{
					// Password settings bound from single source: AuthSettings (DRY)
					// Validation only - Argon2 handles actual hashing
					options.Password.RequiredLength =
						passwordSettings.MinLength;
					options.Password.RequireDigit =
						passwordSettings.RequireDigit;
					options.Password.RequireLowercase =
						passwordSettings.RequireLowercase;
					options.Password.RequireUppercase =
						passwordSettings.RequireUppercase;
					options.Password.RequireNonAlphanumeric =
						passwordSettings.RequireSpecialChar;

					// Lockout settings bound from single source: AuthSettings (DRY)
					options.Lockout.DefaultLockoutTimeSpan =
						TimeSpan.FromMinutes(lockoutSettings.LockoutDurationMinutes);
					options.Lockout.MaxFailedAccessAttempts =
						lockoutSettings.MaxFailedAttempts;
					options.Lockout.AllowedForNewUsers =
						lockoutSettings.Enabled;

					// User settings
					options.User.RequireUniqueEmail = true;
				})
			.AddRoles<ApplicationRole>()
			.AddEntityFrameworkStores<IdentityDbContext>()
			.AddSignInManager()
			.AddDefaultTokenProviders();

		// Replace default password hasher with Argon2
		services.AddSingleton<IPasswordHasher, Argon2PasswordHasherService>();
		services.AddScoped<
			IPasswordHasher<ApplicationUser>,
			IdentityArgon2PasswordHasherService>();

		// Register password settings for FluentValidation validators (DRY)
		services.AddSingleton(passwordSettings);

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
		services.AddScoped<IMfaChallengeRepository, MfaChallengeRepository>();
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
		// Register Identity-specific cache service
		services.AddScoped<IIdentityCacheService, IdentityCacheService>();

		// Client info service for IP/UserAgent extraction (used by SecurityAuditService)
		services.AddScoped<IClientInfoService, ClientInfoService>();

		// Security audit logging service
		services.AddScoped<ISecurityAuditService, SecurityAuditService>();

		services.AddScoped<ITokenService, TokenService>();
		services.AddScoped<AuthenticationService>();
		services.AddScoped<IMfaService, MfaService>();
		services.AddScoped<IMfaOrchestrator, MfaOrchestrator>();
		services.AddScoped<ITotpService, TotpService>();
		services.AddScoped<TotpSecretProtector>();

		// Register password hasher for BackupCode (required for BackupCodeService)
		services.AddScoped<IPasswordHasher<BackupCode>, PasswordHasher<BackupCode>>();
		services.AddScoped<IBackupCodeService, BackupCodeService>();

		services.AddScoped<ITrustedDeviceService, TrustedDeviceService>();

		// MFA brute-force protection — singleton to persist attempt counts across requests
		services.AddSingleton<IMfaAttemptTracker, MfaAttemptTracker>();

		// Configure MFA-related settings with FluentValidation + ValidateOnStart
		services.AddSingleton<IValidator<MfaSettings>, MfaSettingsValidator>();
		services.AddSingleton<IValidator<TotpSettings>, TotpSettingsValidator>();
		services.AddSingleton<IValidator<BackupCodeSettings>, BackupCodeSettingsValidator>();
		services.AddSingleton<IValidator<TrustedDeviceSettings>, TrustedDeviceSettingsValidator>();

		services
			.AddOptions<MfaSettings>()
			.Bind(configuration.GetSection(MfaSettings.SectionName))
			.ValidateWithFluentValidation()
			.ValidateOnStart();

		services
			.AddOptions<TotpSettings>()
			.Bind(configuration.GetSection(TotpSettings.SectionName))
			.ValidateWithFluentValidation()
			.ValidateOnStart();

		services
			.AddOptions<BackupCodeSettings>()
			.Bind(configuration.GetSection(BackupCodeSettings.SectionName))
			.ValidateWithFluentValidation()
			.ValidateOnStart();

		services
			.AddOptions<TrustedDeviceSettings>()
			.Bind(configuration.GetSection(TrustedDeviceSettings.SectionName))
			.ValidateWithFluentValidation()
			.ValidateOnStart();

		// Register OAuth strategies (Singleton — stateless, IHttpClientFactory is Singleton-compatible)
		services.AddSingleton<IOAuthProviderStrategy, GitHubOAuthStrategy>();
		// Future providers: services.AddSingleton<IOAuthProviderStrategy, GoogleOAuthStrategy>();

		services.AddSingleton<OAuthProviderFactory>();

		services.AddScoped<OAuthService>();
		services.AddScoped<IOAuthService>(
			serviceProvider =>
				serviceProvider.GetRequiredService<OAuthService>());
		services.AddScoped<
			IOAuthCodeExchangeService,
			OAuthCodeExchangeService>();
		services.AddScoped<RegistrationService>();

		// Register breached password checking service (OWASP ASVS V2.1.7)
		RegisterBreachedPasswordService(services);

		// Register ALTCHA services
		RegisterAltchaServices(
			services,
			configuration);
	}

	/// <summary>
	/// Registers the HaveIBeenPwned breached password checking service.
	/// </summary>
	/// <param name="services">
	/// The service collection.
	/// </param>
	private static void RegisterBreachedPasswordService(IServiceCollection services)
	{
		// Register named HttpClient for HIBP API calls
		services.AddHttpClient(
			BreachedPasswordService.HttpClientName,
			httpClient =>
			{
				httpClient.DefaultRequestHeaders.Add(
					"User-Agent",
					"SeventySix-BreachedPasswordCheck");
			});

		// Register the service
		services.AddScoped<IBreachedPasswordService, BreachedPasswordService>();

		// Register compound dependencies for Wolverine handlers (reduces params < 7)
		services.AddScoped<BreachCheckDependencies>();
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
		// Bind ALTCHA settings with FluentValidation + ValidateOnStart
		services.AddSingleton<IValidator<AltchaSettings>, AltchaSettingsValidator>();

		services
			.AddOptions<AltchaSettings>()
			.Bind(configuration.GetSection(AltchaSettings.SectionName))
			.ValidateWithFluentValidation()
			.ValidateOnStart();

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

	/// <summary>
	/// Registers Identity-specific background jobs and their settings.
	/// </summary>
	/// <param name="services">
	/// The service collection.
	/// </param>
	/// <param name="configuration">
	/// The application configuration.
	/// </param>
	private static void RegisterBackgroundJobs(
		IServiceCollection services,
		IConfiguration configuration)
	{
		// Register job settings with FluentValidation + ValidateOnStart
		services.AddSingleton<IValidator<RefreshTokenCleanupSettings>, RefreshTokenCleanupSettingsValidator>();
		services.AddSingleton<IValidator<IpAnonymizationSettings>, IpAnonymizationSettingsValidator>();
		services.AddSingleton<IValidator<AdminSeederSettings>, AdminSeederSettingsValidator>();
		services.AddSingleton<IValidator<OrphanedRegistrationCleanupSettings>, OrphanedRegistrationCleanupSettingsValidator>();

		services
			.AddOptions<RefreshTokenCleanupSettings>()
			.Bind(configuration.GetSection(RefreshTokenCleanupSettings.SectionName))
			.ValidateWithFluentValidation()
			.ValidateOnStart();

		services
			.AddOptions<IpAnonymizationSettings>()
			.Bind(configuration.GetSection(IpAnonymizationSettings.SectionName))
			.ValidateWithFluentValidation()
			.ValidateOnStart();

		services
			.AddOptions<AdminSeederSettings>()
			.Bind(configuration.GetSection(AdminSeederSettings.SectionName))
			.ValidateWithFluentValidation()
			.ValidateOnStart();

		services
			.AddOptions<OrphanedRegistrationCleanupSettings>()
			.Bind(configuration.GetSection(OrphanedRegistrationCleanupSettings.SectionName))
			.ValidateWithFluentValidation()
			.ValidateOnStart();

		// Register job scheduler contributor for decoupled job scheduling
		services.AddScoped<IJobSchedulerContributor, IdentityJobSchedulerContributor>();

		// Skip AdminSeederService if background jobs are disabled
		bool isBackgroundJobsEnabled =
			configuration.GetValue<bool>(ConfigurationSectionConstants.BackgroundJobs.Enabled);
		if (!isBackgroundJobsEnabled)
		{
			return;
		}

		// AdminSeederService - One-time admin user seeding at startup
		services.AddHostedService<AdminSeederService>();
	}
}