namespace SeventySix.Identity;

/// <summary>
/// Query to retrieve a user by username.
/// </summary>
/// <param name="Username">The username to search for.</param>
public record GetUserByUsernameQuery(
	string Username);
