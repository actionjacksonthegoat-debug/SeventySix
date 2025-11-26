namespace SeventySix.Shared;

/// <summary>
/// Base interface for all entities.
/// </summary>
public interface IEntity
{
	int Id
	{
		get; set;
	}
	DateTime CreatedAt
	{
		get; set;
	}
	DateTime? ModifiedAt
	{
		get; set;
	}
}
