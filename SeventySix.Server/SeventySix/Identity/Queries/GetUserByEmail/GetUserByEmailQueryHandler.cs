namespace SeventySix.Identity;

/// <summary>
/// Handler for retrieving a user by email address.
/// </summary>
public static class GetUserByEmailQueryHandler
{
	public static async Task<UserDto?> HandleAsync(
		GetUserByEmailQuery query,
		IUserRepository repository,
		CancellationToken cancellationToken)
	{
		User? user =
			await repository.GetByEmailAsync(
				query.Email,
				cancellationToken);

		return user?.ToDto();
	}
}
