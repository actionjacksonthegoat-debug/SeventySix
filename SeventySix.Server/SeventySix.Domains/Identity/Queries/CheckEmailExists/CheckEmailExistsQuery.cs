namespace SeventySix.Identity;

/// <summary>
/// Query to check whether an email exists in the system.
/// </summary>
/// <param name="Email">
/// The email address to check.
/// </param>
/// <param name="ExcludeUserId">
/// Optional user ID to exclude from the check (useful for updates).
/// </param>
public record CheckEmailExistsQuery(string Email, int? ExcludeUserId);