using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace SeventySix.Identity;

/// <summary>
/// Handler for retrieving all users.
/// </summary>
public static class GetAllUsersQueryHandler
{
	public static async Task<IEnumerable<UserDto>> HandleAsync(
		GetAllUsersQuery query,
		UserManager<ApplicationUser> userManager,
		CancellationToken cancellationToken)
	{
		List<ApplicationUser> users =
			await userManager.Users
				.AsNoTracking()
				.ToListAsync(cancellationToken);

		return users.ToDto();
	}
}