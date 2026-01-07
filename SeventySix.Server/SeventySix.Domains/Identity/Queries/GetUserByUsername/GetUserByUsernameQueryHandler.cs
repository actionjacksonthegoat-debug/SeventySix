using Microsoft.AspNetCore.Identity;

namespace SeventySix.Identity;

/// <summary>
/// Handler for retrieving a user by username.
/// </summary>
public static class GetUserByUsernameQueryHandler
{
	/// <summary>
	/// Finds a user by username and returns a <see cref="UserDto"/> when found.
	/// </summary>
	public static async Task<UserDto?> HandleAsync(
		GetUserByUsernameQuery query,
		UserManager<ApplicationUser> userManager,
		CancellationToken cancellationToken)
	{
		ApplicationUser? user =
			await userManager.FindByNameAsync(
				query.Username);

		return user?.ToDto();
	}
}