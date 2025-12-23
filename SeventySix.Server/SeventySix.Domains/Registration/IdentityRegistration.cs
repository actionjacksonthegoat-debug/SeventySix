// <copyright file="IdentityRegistration.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using SeventySix.Identity;
using SeventySix.Identity.Commands.ChangePassword;
using SeventySix.Identity.Commands.CompleteRegistration;
using SeventySix.Identity.Commands.CreatePermissionRequest;
using SeventySix.Identity.Commands.CreateUser;
using SeventySix.Identity.Commands.InitiatePasswordResetByEmail;
using SeventySix.Identity.Commands.InitiateRegistration;
using SeventySix.Identity.Commands.Login;
using SeventySix.Identity.Commands.Register;
using SeventySix.Identity.Commands.SetPassword;
using SeventySix.Identity.Commands.UpdateProfile;
using SeventySix.Identity.Commands.UpdateUser;
using SeventySix.Identity.Infrastructure;
using SeventySix.Identity.Queries.GetPagedUsers;
using SeventySix.Identity.Settings;
using SeventySix.Shared.Constants;
using SeventySix.Shared.Interfaces;
using SeventySix.Shared.Persistence;
using SeventySix.Shared.Validators;

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

		// Register IdentityDbContext with PostgreSQL and AuditInterceptor
		services.AddDbContext<IdentityDbContext>(
			(serviceProvider, options) =>
			{
				AuditInterceptor auditInterceptor =
					serviceProvider.GetRequiredService<AuditInterceptor>();
				options.UseNpgsql(
					connectionString,
					npgsqlOptions =>
						npgsqlOptions.MigrationsHistoryTable(
							DatabaseConstants.MigrationsHistoryTableName,
							SchemaConstants.Identity));
				options.AddInterceptors(auditInterceptor);
			});

		// Register transaction manager for Identity context
		services.AddScoped<ITransactionManager>(
			serviceProvider => new TransactionManager(
				serviceProvider.GetRequiredService<IdentityDbContext>()));

		// Register repositories (CQRS pattern - Query + Command)
		services.AddScoped<UserRepository>();
		services.AddScoped<IUserQueryRepository>(serviceProvider =>
			serviceProvider.GetRequiredService<UserRepository>());
		services.AddScoped<IUserCommandRepository>(serviceProvider =>
			serviceProvider.GetRequiredService<UserRepository>());
		services.AddScoped<
			IPermissionRequestRepository,
			PermissionRequestRepository
		>();
		services.AddScoped<ITokenRepository, TokenRepository>();
		services.AddScoped<ICredentialRepository, CredentialRepository>();
		services.AddScoped<
			IPasswordResetTokenRepository,
			PasswordResetTokenRepository
		>();
		services.AddScoped<IAuthRepository, AuthRepository>();
		services.AddScoped<
			IEmailVerificationTokenRepository,
			EmailVerificationTokenRepository
		>();

		// Register services - focused interfaces only (no composite IUserService)
		services.AddSingleton<IPasswordHasher, Argon2PasswordHasher>();
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

		// Register health check
		services.AddScoped<IDatabaseHealthCheck, IdentityHealthCheck>();

		// Register validators
		services.AddSingleton<
			IValidator<CreateUserRequest>,
			CreateUserCommandValidator
		>();
		services.AddSingleton<
			IValidator<CreatePermissionRequestCommand>,
			CreatePermissionRequestValidator
		>();
		services.AddSingleton<
			IValidator<UpdateUserRequest>,
			UpdateUserCommandValidator
		>();
		services.AddSingleton<
			IValidator<UpdateProfileRequest>,
			UpdateProfileCommandValidator
		>();
		services.AddSingleton<IValidator<UpdateProfileCommand>>(
			serviceProvider =>
				CommandValidatorFactory.CreateFor<
					UpdateProfileCommand,
					UpdateProfileRequest
				>(
					serviceProvider.GetRequiredService<
						IValidator<UpdateProfileRequest>
					>(),
					command => command.Request));
		services.AddSingleton<
			IValidator<UserQueryRequest>,
			UserQueryValidator
		>();
		services.AddSingleton<
			IValidator<LoginRequest>,
			LoginCommandValidator
		>();
		services.AddSingleton<
			IValidator<RegisterRequest>,
			RegisterCommandValidator
		>();
		services.AddSingleton<
			IValidator<ChangePasswordRequest>,
			ChangePasswordCommandValidator
		>();
		services.AddSingleton<IValidator<ChangePasswordCommand>>(
			serviceProvider =>
				CommandValidatorFactory.CreateFor<
					ChangePasswordCommand,
					ChangePasswordRequest
				>(
					serviceProvider.GetRequiredService<
						IValidator<ChangePasswordRequest>
					>(),
					command => command.Request));
		services.AddSingleton<
			IValidator<SetPasswordRequest>,
			SetPasswordCommandValidator
		>();
		services.AddSingleton<IValidator<SetPasswordCommand>>(serviceProvider =>
			CommandValidatorFactory.CreateFor<
				SetPasswordCommand,
				SetPasswordRequest
			>(
				serviceProvider.GetRequiredService<
					IValidator<SetPasswordRequest>
				>(),
				command => command.Request));
		services.AddSingleton<
			IValidator<ForgotPasswordRequest>,
			InitiatePasswordResetByEmailCommandValidator
		>();
		services.AddSingleton<
			IValidator<InitiateRegistrationRequest>,
			InitiateRegistrationCommandValidator
		>();
		services.AddSingleton<
			IValidator<CompleteRegistrationRequest>,
			CompleteRegistrationCommandValidator
		>();
		services.AddSingleton<IValidator<CompleteRegistrationCommand>>(
			serviceProvider =>
				CommandValidatorFactory.CreateFor<
					CompleteRegistrationCommand,
					CompleteRegistrationRequest
				>(
					serviceProvider.GetRequiredService<
						IValidator<CompleteRegistrationRequest>
					>(),
					command => command.Request));

		return services;
	}
}