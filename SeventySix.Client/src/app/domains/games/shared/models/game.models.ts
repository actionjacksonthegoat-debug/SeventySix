/**
 * Shared game type definitions.
 * Used by all games for lifecycle management and asset loading.
 */

/**
 * Represents the lifecycle state of a game instance.
 * Tracks transitions from initialization through disposal.
 */
export enum GameLifecycleState
{
	/** Game is initializing resources and scene. */
	Initializing = "Initializing",
	/** Game resources are loaded and ready to start. */
	Ready = "Ready",
	/** Game loop is actively running. */
	Running = "Running",
	/** Game loop is paused. */
	Paused = "Paused",
	/** Game has been disposed and cleaned up. */
	Disposed = "Disposed"
}