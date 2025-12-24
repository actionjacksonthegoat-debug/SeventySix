namespace SeventySix.Identity;

/// <summary>
/// Query to check whether a username exists in the system.
/// </summary>
/// <param name="Username">
/// The username to check.
/// </param>
/// <param name="ExcludeUserId">
/// Optional user ID to exclude from the check (useful for updates).
/// </param>
public record CheckUsernameExistsQuery(string Username, int? ExcludeUserId);