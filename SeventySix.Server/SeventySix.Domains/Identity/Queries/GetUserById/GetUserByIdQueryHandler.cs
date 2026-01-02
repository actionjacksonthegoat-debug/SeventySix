using Microsoft.AspNetCore.Identity;

namespace SeventySix.Identity;

/// <summary>
/// Handler for retrieving a user by ID.
/// </summary>
public static class GetUserByIdQueryHandler
{
	/// <summary>
	/// Retrieves a user by its identifier and maps to <see cref="UserDto"/> if found.
	/// </summary>
	public static async Task<UserDto?> HandleAsync(
		GetUserByIdQuery query,
		UserManager<ApplicationUser> userManager,
		CancellationToken cancellationToken)
	{
		ApplicationUser? user =
			await userManager.FindByIdAsync(query.Id.ToString());

		return user?.ToDto();
	}
}