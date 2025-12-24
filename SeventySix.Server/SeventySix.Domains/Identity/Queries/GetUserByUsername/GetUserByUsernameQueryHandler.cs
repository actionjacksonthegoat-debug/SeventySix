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