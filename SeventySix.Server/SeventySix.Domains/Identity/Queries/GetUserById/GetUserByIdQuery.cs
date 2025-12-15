namespace SeventySix.Identity;

/// <summary>
/// Query to retrieve a user by ID.
/// </summary>
/// <param name="Id">The user's unique identifier.</param>
public record GetUserByIdQuery(int Id);
