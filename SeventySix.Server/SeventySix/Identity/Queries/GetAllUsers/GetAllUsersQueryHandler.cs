namespace SeventySix.Identity;

/// <summary>
/// Handler for retrieving all users.
/// </summary>
public static class GetAllUsersQueryHandler
{
	public static async Task<IEnumerable<UserDto>> HandleAsync(
		GetAllUsersQuery query,
		IUserRepository repository,
		CancellationToken cancellationToken)
	{
		return await repository.GetAllProjectedAsync(
			cancellationToken);
	}
}