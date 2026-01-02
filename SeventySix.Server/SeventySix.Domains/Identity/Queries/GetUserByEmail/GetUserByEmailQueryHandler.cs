using Microsoft.AspNetCore.Identity;

namespace SeventySix.Identity;

/// <summary>
/// Handler for retrieving a user by email address.
/// </summary>
public static class GetUserByEmailQueryHandler
{
	/// <summary>
	/// Retrieves a user by email address and returns a <see cref="UserDto"/> if found.
	/// </summary>
	public static async Task<UserDto?> HandleAsync(
		GetUserByEmailQuery query,
		UserManager<ApplicationUser> userManager,
		CancellationToken cancellationToken)
	{
		ApplicationUser? user =
			await userManager.FindByEmailAsync(query.Email);

		return user?.ToDto();
	}
}