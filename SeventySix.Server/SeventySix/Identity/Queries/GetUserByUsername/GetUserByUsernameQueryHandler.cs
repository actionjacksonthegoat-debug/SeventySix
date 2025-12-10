namespace SeventySix.Identity;

/// <summary>
/// Handler for retrieving a user by username.
/// </summary>
public static class GetUserByUsernameQueryHandler
{
	public static async Task<UserDto?> HandleAsync(
		GetUserByUsernameQuery query,
		IUserQueryRepository repository,
		CancellationToken cancellationToken)
	{
		User? user =
			await repository.GetByUsernameAsync(
				query.Username,
				cancellationToken);

		return user?.ToDto();
	}
}