// <copyright file="IdentityMockFactory.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.AspNetCore.Identity;
using NSubstitute;
using SeventySix.Identity;

namespace SeventySix.TestUtilities.Mocks;

/// <summary>
/// Factory for creating Identity-related mock objects.
/// Centralizes mock creation to ensure consistency and reduce duplication.
/// </summary>
public static class IdentityMockFactory
{
	/// <summary>
	/// Creates a mock <see cref="UserManager{ApplicationUser}"/> with required constructor parameters.
	/// </summary>
	/// <returns>
	/// A configured NSubstitute mock for UserManager.
	/// </returns>
	public static UserManager<ApplicationUser> CreateUserManager()
	{
		return Substitute.For<UserManager<ApplicationUser>>(
			Substitute.For<IUserStore<ApplicationUser>>(),
			null,
			null,
			null,
			null,
			null,
			null,
			null,
			null);
	}

	/// <summary>
	/// Creates a mock <see cref="AuthenticationService"/> with required constructor parameters.
	/// </summary>
	/// <returns>
	/// A configured NSubstitute mock for AuthenticationService.
	/// </returns>
	public static AuthenticationService CreateAuthenticationService()
	{
		return Substitute.For<AuthenticationService>(
			Substitute.For<IAuthRepository>(),
			Substitute.For<ITokenService>(),
			Substitute.For<Microsoft.Extensions.Options.IOptions<JwtSettings>>(),
			Substitute.For<TimeProvider>(),
			CreateUserManager());
	}
}
