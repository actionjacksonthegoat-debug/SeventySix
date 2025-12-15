using SeventySix.Shared.DTOs;

namespace SeventySix.Identity;

/// <summary>
/// Handler for retrieving paginated users.
/// </summary>
public static class GetPagedUsersQueryHandler
{
	public static async Task<PagedResult<UserDto>> HandleAsync(
		GetPagedUsersQuery query,
		IUserQueryRepository repository,
		CancellationToken cancellationToken)
	{
		(IEnumerable<UserDto> users, int totalCount) =
			await repository.GetPagedProjectedAsync(
				query.Request,
				cancellationToken);

		return new PagedResult<UserDto>
		{
			Items =
				users.ToList(),
			TotalCount =
				totalCount,
			Page =
				query.Request.Page,
			PageSize =
				query.Request.PageSize
		};
	}
}