// <copyright file="AuthSettingsValidator.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation;

namespace SeventySix.Identity;

/// <summary>
/// Validates <see cref="AuthSettings"/> configuration values.
/// Delegates to sub-record validators for nested settings.
/// </summary>
public sealed class AuthSettingsValidator : AbstractValidator<AuthSettings>
{
	/// <summary>
	/// Initializes a new instance of the <see cref="AuthSettingsValidator"/> class.
	/// </summary>
	public AuthSettingsValidator()
	{
		RuleFor(auth => auth.Lockout)
			.SetValidator(new LockoutSettingsValidator());

		RuleFor(auth => auth.Password)
			.SetValidator(new PasswordSettingsValidator());

		RuleFor(auth => auth.RateLimit)
			.SetValidator(new AuthRateLimitSettingsValidator());

		RuleFor(auth => auth.Cookie)
			.SetValidator(new AuthCookieSettingsValidator());

		RuleFor(auth => auth.Token)
			.SetValidator(new TokenSettingsValidator());

		RuleFor(auth => auth.BreachedPassword)
			.SetValidator(new BreachedPasswordSettingsValidator());

		RuleFor(auth => auth.SessionInactivity)
			.SetValidator(new SessionInactivitySettingsValidator());

		RuleFor(auth => auth.OAuth)
			.SetValidator(new OAuthSettingsValidator());
	}
}

/// <summary>
/// Validates <see cref="LockoutSettings"/> configuration values.
/// </summary>
public sealed class LockoutSettingsValidator : AbstractValidator<LockoutSettings>
{
	/// <summary>
	/// Initializes a new instance of the <see cref="LockoutSettingsValidator"/> class.
	/// </summary>
	public LockoutSettingsValidator()
	{
		When(
			lockout => lockout.Enabled,
			() =>
			{
				RuleFor(lockout => lockout.MaxFailedAttempts)
					.GreaterThan(0)
					.WithMessage("Auth:Lockout:MaxFailedAttempts must be greater than 0");

				RuleFor(lockout => lockout.LockoutDurationMinutes)
					.GreaterThan(0)
					.WithMessage("Auth:Lockout:LockoutDurationMinutes must be greater than 0");
			});
	}
}

/// <summary>
/// Validates <see cref="PasswordSettings"/> configuration values.
/// </summary>
public sealed class PasswordSettingsValidator : AbstractValidator<PasswordSettings>
{
	/// <summary>
	/// Initializes a new instance of the <see cref="PasswordSettingsValidator"/> class.
	/// </summary>
	public PasswordSettingsValidator()
	{
		RuleFor(password => password.MinLength)
			.GreaterThan(0)
			.WithMessage("Auth:Password:MinLength must be greater than 0");

		RuleFor(password => password.Argon2)
			.SetValidator(new Argon2SettingsValidator());
	}
}

/// <summary>
/// Validates <see cref="Argon2Settings"/> configuration values.
/// </summary>
public sealed class Argon2SettingsValidator : AbstractValidator<Argon2Settings>
{
	/// <summary>
	/// Initializes a new instance of the <see cref="Argon2SettingsValidator"/> class.
	/// </summary>
	public Argon2SettingsValidator()
	{
		RuleFor(argon => argon.MemorySize)
			.GreaterThan(0)
			.WithMessage("Auth:Password:Argon2:MemorySize must be greater than 0");

		RuleFor(argon => argon.Iterations)
			.GreaterThan(0)
			.WithMessage("Auth:Password:Argon2:Iterations must be greater than 0");

		RuleFor(argon => argon.DegreeOfParallelism)
			.GreaterThan(0)
			.WithMessage("Auth:Password:Argon2:DegreeOfParallelism must be greater than 0");
	}
}

/// <summary>
/// Validates <see cref="AuthRateLimitSettings"/> configuration values.
/// </summary>
public sealed class AuthRateLimitSettingsValidator : AbstractValidator<AuthRateLimitSettings>
{
	/// <summary>
	/// Initializes a new instance of the <see cref="AuthRateLimitSettingsValidator"/> class.
	/// </summary>
	public AuthRateLimitSettingsValidator()
	{
		RuleFor(rateLimit => rateLimit.LoginAttemptsPerMinute)
			.GreaterThan(0)
			.WithMessage("Auth:RateLimit:LoginAttemptsPerMinute must be greater than 0");

		RuleFor(rateLimit => rateLimit.RegisterAttemptsPerHour)
			.GreaterThan(0)
			.WithMessage("Auth:RateLimit:RegisterAttemptsPerHour must be greater than 0");

		RuleFor(rateLimit => rateLimit.TokenRefreshPerMinute)
			.GreaterThan(0)
			.WithMessage("Auth:RateLimit:TokenRefreshPerMinute must be greater than 0");

		RuleFor(rateLimit => rateLimit.AltchaChallengePerMinute)
			.GreaterThan(0)
			.WithMessage("Auth:RateLimit:AltchaChallengePerMinute must be greater than 0");

		RuleFor(rateLimit => rateLimit.ClientLogsPerMinute)
			.GreaterThan(0)
			.WithMessage("Auth:RateLimit:ClientLogsPerMinute must be greater than 0");

		RuleFor(rateLimit => rateLimit.MfaVerifyPerMinute)
			.GreaterThan(0)
			.WithMessage("Auth:RateLimit:MfaVerifyPerMinute must be greater than 0");

		RuleFor(rateLimit => rateLimit.MfaResendPerMinute)
			.GreaterThan(0)
			.WithMessage("Auth:RateLimit:MfaResendPerMinute must be greater than 0");
	}
}

/// <summary>
/// Validates <see cref="AuthCookieSettings"/> configuration values.
/// </summary>
public sealed class AuthCookieSettingsValidator : AbstractValidator<AuthCookieSettings>
{
	/// <summary>
	/// Initializes a new instance of the <see cref="AuthCookieSettingsValidator"/> class.
	/// </summary>
	public AuthCookieSettingsValidator()
	{
		RuleFor(cookie => cookie.RefreshTokenCookieName)
			.NotEmpty()
			.WithMessage("Auth:Cookie:RefreshTokenCookieName is required");
	}
}

/// <summary>
/// Validates <see cref="TokenSettings"/> configuration values.
/// </summary>
public sealed class TokenSettingsValidator : AbstractValidator<TokenSettings>
{
	/// <summary>
	/// Initializes a new instance of the <see cref="TokenSettingsValidator"/> class.
	/// </summary>
	public TokenSettingsValidator()
	{
		RuleFor(token => token.MaxActiveSessionsPerUser)
			.GreaterThan(0)
			.WithMessage("Auth:Token:MaxActiveSessionsPerUser must be greater than 0");
	}
}

/// <summary>
/// Validates <see cref="BreachedPasswordSettings"/> configuration values.
/// </summary>
public sealed class BreachedPasswordSettingsValidator : AbstractValidator<BreachedPasswordSettings>
{
	/// <summary>
	/// Initializes a new instance of the <see cref="BreachedPasswordSettingsValidator"/> class.
	/// </summary>
	public BreachedPasswordSettingsValidator()
	{
		When(
			breached => breached.Enabled,
			() =>
			{
				RuleFor(breached => breached.MinBreachCount)
					.GreaterThan(0)
					.WithMessage("Auth:BreachedPassword:MinBreachCount must be greater than 0");

				RuleFor(breached => breached.ApiTimeoutMs)
					.GreaterThan(0)
					.WithMessage("Auth:BreachedPassword:ApiTimeoutMs must be greater than 0");
			});
	}
}

/// <summary>
/// Validates <see cref="OAuthSettings"/> configuration values.
/// </summary>
public sealed class OAuthSettingsValidator : AbstractValidator<OAuthSettings>
{
	/// <summary>
	/// Initializes a new instance of the <see cref="OAuthSettingsValidator"/> class.
	/// </summary>
	public OAuthSettingsValidator()
	{
		When(
			oauth => oauth.Enabled,
			() =>
			{
				RuleFor(oauth => oauth.ClientCallbackUrl)
					.NotEmpty()
					.WithMessage("Auth:OAuth:ClientCallbackUrl is required when OAuth is enabled");

				RuleFor(oauth => oauth.Providers)
					.NotEmpty()
					.WithMessage("Auth:OAuth:Providers must have at least one provider when OAuth is enabled");
			});
	}
}