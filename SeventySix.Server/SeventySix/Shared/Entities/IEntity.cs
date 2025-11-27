namespace SeventySix.Shared;

/// <summary>
/// Base interface for all entities with an integer primary key.
/// </summary>
/// <remarks>
/// Provides consistent access to the Id property across all domain entities
/// without requiring reflection in repository operations.
/// Entities may choose to implement additional audit properties (CreateDate, ModifyDate)
/// based on their specific domain requirements.
/// </remarks>
public interface IEntity
{
	/// <summary>
	/// Gets or sets the unique identifier for this entity.
	/// </summary>
	int Id
	{
		get; set;
	}
}
