/**
 * Collision Service.
 * Lightweight bounding sphere collision detection system.
 * Domain-scoped service — must be provided via route providers array.
 */

import { Injectable } from "@angular/core";
import type { CollidableEntity, CollisionResult } from "@sandbox/models/game.models";

/**
 * Bounding sphere collision detection service.
 * Uses simple distance-based sphere intersection for performance.
 */
@Injectable()
export class CollisionService
{
	/**
	 * Registered collidable entities.
	 * @type {CollidableEntity[]}
	 * @private
	 */
	private entities: CollidableEntity[] = [];

	/**
	 * Registers an entity for collision detection.
	 * @param {CollidableEntity} entity
	 * The entity to register.
	 */
	register(entity: CollidableEntity): void
	{
		this.entities.push(entity);
	}

	/**
	 * Unregisters an entity from collision detection.
	 * @param {CollidableEntity} entity
	 * The entity to remove.
	 */
	unregister(entity: CollidableEntity): void
	{
		const index: number =
			this.entities.indexOf(entity);

		if (index >= 0)
		{
			this.entities.splice(
				index,
				1);
		}
	}

	/**
	 * Checks for collisions between two groups of entities.
	 * @param {string} groupA
	 * First collision group to check.
	 * @param {string} groupB
	 * Second collision group to check against.
	 * @returns {CollisionResult[]}
	 * Array of detected collision pairs.
	 */
	checkCollisions(
		groupA: string,
		groupB: string): CollisionResult[]
	{
		const entitiesA: CollidableEntity[] =
			this.entities.filter(
				(ent: CollidableEntity) =>
					ent.group === groupA);
		const entitiesB: CollidableEntity[] =
			this.entities.filter(
				(ent: CollidableEntity) =>
					ent.group === groupB);

		const results: CollisionResult[] = [];

		for (const entityA of entitiesA)
		{
			for (const entityB of entitiesB)
			{
				if (
					this.spheresIntersect(
						entityA,
						entityB))
				{
					results.push(
						{
							entityA,
							entityB
						});
				}
			}
		}

		return results;
	}

	/**
	 * Clears all registered entities.
	 */
	dispose(): void
	{
		this.entities = [];
	}

	/**
	 * Tests whether two bounding spheres intersect.
	 * @param {CollidableEntity} entityA
	 * First entity.
	 * @param {CollidableEntity} entityB
	 * Second entity.
	 * @returns {boolean}
	 * True if the spheres overlap.
	 * @private
	 */
	private spheresIntersect(
		entityA: CollidableEntity,
		entityB: CollidableEntity): boolean
	{
		const distance: number =
			entityA
				.mesh
				.position
				.subtract(entityB.mesh.position)
				.length();

		const combinedRadii: number =
			entityA.radius + entityB.radius;

		return distance < combinedRadii;
	}
}