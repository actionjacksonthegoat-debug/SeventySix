/**
 * Shared math utilities for game services.
 * Provides common geometric calculations used across multiple game domains.
 */

/**
 * Computes the Euclidean distance between two points on the XZ plane.
 * @param x1
 * The X coordinate of the first point.
 * @param z1
 * The Z coordinate of the first point.
 * @param x2
 * The X coordinate of the second point.
 * @param z2
 * The Z coordinate of the second point.
 * @returns
 * The distance between the two points.
 */
export function distanceXZ(
	x1: number,
	z1: number,
	x2: number,
	z2: number): number
{
	const deltaX: number =
		x2 - x1;
	const deltaZ: number =
		z2 - z1;

	return Math.sqrt(deltaX * deltaX + deltaZ * deltaZ);
}