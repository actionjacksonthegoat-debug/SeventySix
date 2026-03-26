/**
 * Shared Babylon.js engine model definitions.
 * Used by all games that utilize the Babylon.js rendering engine.
 */

/**
 * Configuration options for Babylon.js engine creation.
 */
export interface EngineOptions
{
	/**
	 * When true, uses NullEngine instead of WebGL Engine.
	 * Useful for testing environments without GPU access.
	 * @type {boolean}
	 */
	useNullEngine?: boolean;
}