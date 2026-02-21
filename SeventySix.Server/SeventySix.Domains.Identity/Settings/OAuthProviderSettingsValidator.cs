// <copyright file="OAuthProviderSettingsValidator.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation;

namespace SeventySix.Identity;

/// <summary>
/// Validates <see cref="OAuthProviderSettings"/> configuration values.
/// </summary>
public sealed class OAuthProviderSettingsValidator : AbstractValidator<OAuthProviderSettings>
{
	/// <summary>
	/// Initializes a new instance of the <see cref="OAuthProviderSettingsValidator"/> class.
	/// </summary>
	public OAuthProviderSettingsValidator()
	{
		RuleFor(provider => provider.Provider)
			.NotEmpty()
			.WithMessage("Auth:OAuth:Providers[]:Provider is required");

		RuleFor(provider => provider.ClientId)
			.NotEmpty()
			.WithMessage("Auth:OAuth:Providers[]:ClientId is required");

		RuleFor(provider => provider.ClientSecret)
			.NotEmpty()
			.WithMessage("Auth:OAuth:Providers[]:ClientSecret is required");

		RuleFor(provider => provider.RedirectUri)
			.NotEmpty()
			.WithMessage("Auth:OAuth:Providers[]:RedirectUri is required")
			.Must(uri => uri.StartsWith('/') || Uri.IsWellFormedUriString(uri, UriKind.Absolute))
			.WithMessage("Auth:OAuth:Providers[]:RedirectUri must be a relative path starting with '/' or an absolute URI");

		RuleFor(provider => provider.AuthorizationEndpoint)
			.NotEmpty()
			.WithMessage("Auth:OAuth:Providers[]:AuthorizationEndpoint is required");

		RuleFor(provider => provider.TokenEndpoint)
			.NotEmpty()
			.WithMessage("Auth:OAuth:Providers[]:TokenEndpoint is required");
	}
}