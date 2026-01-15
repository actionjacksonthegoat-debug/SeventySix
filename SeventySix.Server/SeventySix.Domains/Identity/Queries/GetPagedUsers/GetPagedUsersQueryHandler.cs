using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using SeventySix.Shared.POCOs;

namespace SeventySix.Identity;

/// <summary>
/// Handler for retrieving paginated users.
/// </summary>
public static class GetPagedUsersQueryHandler
{
	public static async Task<PagedResult<UserDto>> HandleAsync(
		GetPagedUsersQuery query,
		UserManager<ApplicationUser> userManager,
		CancellationToken cancellationToken)
	{
		IQueryable<ApplicationUser> usersQuery =
			userManager.Users.AsNoTracking();

		// Apply search filter if provided
		if (!string.IsNullOrWhiteSpace(query.Request.SearchTerm))
		{
			string searchTerm =
				query.Request.SearchTerm.ToLowerInvariant();

			usersQuery =
				usersQuery.Where(user =>
					(user.UserName != null
						&& user.UserName.ToLower().Contains(searchTerm))
					|| (user.Email != null
						&& user.Email.ToLower().Contains(searchTerm))
					|| (user.FullName != null
						&& user.FullName.ToLower().Contains(searchTerm)));
		}

		// Get total count before pagination
		int totalCount =
			await usersQuery.CountAsync(cancellationToken);

		// Apply ordering
		usersQuery =
			usersQuery.OrderBy(user => user.UserName);

		// Apply pagination
		List<ApplicationUser> pagedUsers =
			await usersQuery
				.Skip((query.Request.Page - 1) * query.Request.PageSize)
				.Take(query.Request.PageSize)
				.ToListAsync(cancellationToken);

		return new PagedResult<UserDto>
		{
			Items = pagedUsers.ToDto().ToList(),
			TotalCount = totalCount,
			Page = query.Request.Page,
			PageSize = query.Request.PageSize,
		};
	}
}