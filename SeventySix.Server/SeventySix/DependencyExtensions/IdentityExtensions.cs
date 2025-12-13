// <copyright file="IdentityExtensions.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using SeventySix.Identity;
using SeventySix.Identity.Infrastructure;
using SeventySix.Shared;
using SeventySix.Shared.Infrastructure;
using SeventySix.Shared.Validators;

namespace SeventySix.DependencyExtensions;

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
/// - Repositories: IUserRepository, IAuthRepository, ITokenRepository, etc.
/// - Wolverine CQRS handlers for Identity operations (auto-discovered)
/// - Traditional services: ITokenService, IOAuthService, IPermissionRequestService
/// - Validators: Command/query validators with FluentValidation
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
		services.AddScoped<UserRepository>();
		services.AddScoped<IUserQueryRepository>(
			serviceProvider => serviceProvider.GetRequiredService<UserRepository>());
		services.AddScoped<IUserCommandRepository>(
			serviceProvider => serviceProvider.GetRequiredService<UserRepository>());
		services.AddScoped<IPermissionRequestRepository, PermissionRequestRepository>();
		services.AddScoped<ITokenRepository, TokenRepository>();
		services.AddScoped<ICredentialRepository, CredentialRepository>();
		services.AddScoped<IPasswordResetTokenRepository, PasswordResetTokenRepository>();
		services.AddScoped<IAuthRepository, AuthRepository>();
		services.AddScoped<IEmailVerificationTokenRepository, EmailVerificationTokenRepository>();

		// Register services - focused interfaces only (no composite IUserService)
		services.AddScoped<ITokenService, TokenService>();
		services.AddScoped<AuthenticationService>();
		services.AddScoped<OAuthService>();
		services.AddScoped<IOAuthService>(serviceProvider =>
			serviceProvider.GetRequiredService<OAuthService>());
		services.AddScoped<IOAuthCodeExchangeService, OAuthCodeExchangeService>();
		services.AddScoped<IPermissionRequestService, PermissionRequestService>();
		services.AddScoped<RegistrationService>();
		// Register health check
		services.AddScoped<IDatabaseHealthCheck, IdentityHealthCheck>();

		// Register validators
		services.AddSingleton<IValidator<CreateUserRequest>, CreateUserValidator>();
		services.AddSingleton<IValidator<CreateUserCommand>>(
			serviceProvider =>
				CommandValidatorFactory.CreateFor<CreateUserCommand, CreateUserRequest>(
					serviceProvider.GetRequiredService<IValidator<CreateUserRequest>>(),
					command => command.Request));
		services.AddSingleton<IValidator<CreatePermissionRequestDto>, CreatePermissionRequestValidator>();
		services.AddSingleton<IValidator<UpdateUserRequest>, UpdateUserValidator>();
		services.AddSingleton<IValidator<UpdateUserCommand>>(
			serviceProvider =>
				CommandValidatorFactory.CreateFor<UpdateUserCommand, UpdateUserRequest>(
					serviceProvider.GetRequiredService<IValidator<UpdateUserRequest>>(),
					command => command.Request));
		services.AddSingleton<IValidator<UpdateProfileRequest>, UpdateProfileRequestValidator>();
		services.AddSingleton<IValidator<UpdateProfileCommand>>(
			serviceProvider =>
				CommandValidatorFactory.CreateFor<UpdateProfileCommand, UpdateProfileRequest>(
					serviceProvider.GetRequiredService<IValidator<UpdateProfileRequest>>(),
					command => command.Request));
		services.AddSingleton<IValidator<UserQueryRequest>, UserQueryValidator>();
		services.AddSingleton<IValidator<LoginRequest>, LoginRequestValidator>();
		services.AddSingleton<IValidator<RegisterRequest>, RegisterRequestValidator>();
		services.AddSingleton<IValidator<ChangePasswordRequest>, ChangePasswordRequestValidator>();
		services.AddSingleton<IValidator<ChangePasswordCommand>>(
			serviceProvider =>
				CommandValidatorFactory.CreateFor<ChangePasswordCommand, ChangePasswordRequest>(
					serviceProvider.GetRequiredService<IValidator<ChangePasswordRequest>>(),
					command => command.Request));
		services.AddSingleton<IValidator<SetPasswordRequest>, SetPasswordRequestValidator>();
		services.AddSingleton<IValidator<SetPasswordCommand>>(
			serviceProvider =>
				CommandValidatorFactory.CreateFor<SetPasswordCommand, SetPasswordRequest>(
					serviceProvider.GetRequiredService<IValidator<SetPasswordRequest>>(),
					command => command.Request));
		services.AddSingleton<IValidator<ForgotPasswordRequest>, ForgotPasswordRequestValidator>();
		services.AddSingleton<IValidator<InitiateRegistrationRequest>, InitiateRegistrationRequestValidator>();
		services.AddSingleton<IValidator<InitiateRegistrationCommand>>(
			serviceProvider =>
				CommandValidatorFactory.CreateFor<InitiateRegistrationCommand, InitiateRegistrationRequest>(
					serviceProvider.GetRequiredService<IValidator<InitiateRegistrationRequest>>(),
					command => command.Request));
		services.AddSingleton<IValidator<CompleteRegistrationRequest>, CompleteRegistrationRequestValidator>();
		services.AddSingleton<IValidator<CompleteRegistrationCommand>>(
			serviceProvider =>
				CommandValidatorFactory.CreateFor<CompleteRegistrationCommand, CompleteRegistrationRequest>(
					serviceProvider.GetRequiredService<IValidator<CompleteRegistrationRequest>>(),
					command => command.Request));

		return services;
	}
}