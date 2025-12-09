namespace SeventySix.Identity;

/// <summary>
/// Query to retrieve a user by email address.
/// </summary>
/// <param name="Email">The email address to search for.</param>
public record GetUserByEmailQuery(
	string Email);
