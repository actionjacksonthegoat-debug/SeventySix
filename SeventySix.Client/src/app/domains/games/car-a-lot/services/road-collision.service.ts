/**
 * Road Collision Service.
 * Detects road boundaries, manages bumper collision zones,
 * and creates visual bumper meshes along road edges.
 */

import { Injectable } from "@angular/core";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { Scene } from "@babylonjs/core/scene";
import {
	BUMPER_RED,
	BUMPER_WHITE,
	BUMPER_WIDTH,
	ROAD_WIDTH
} from "@games/car-a-lot/constants/car-a-lot.constants";
import { RoadBoundaryResult, RoadSegment } from "@games/car-a-lot/models/car-a-lot.models";

/** Bumper height in world units. */
const BUMPER_HEIGHT: number = 1.5;

/** Number of bumper stripes per segment. */
const STRIPE_COUNT: number = 4;

/** Pre-computed segment geometry for bumper stripe placement. */
interface SegmentGeometry
{
	/** Half of the road width. */
	halfWidth: number;
	/** Forward direction X component. */
	dirX: number;
	/** Forward direction Z component. */
	dirZ: number;
	/** Perpendicular direction X component. */
	perpX: number;
	/** Perpendicular direction Z component. */
	perpZ: number;
}

/** Configuration for creating a single bumper stripe mesh. */
interface BumperStripeConfig
{
	/** Babylon.js Scene. */
	scene: Scene;
	/** Road segment definition. */
	segment: RoadSegment;
	/** Segment index for mesh naming. */
	segmentIndex: number;
	/** Stripe index along the segment. */
	stripeIndex: number;
	/** Offset along the road direction. */
	alongOffset: number;
	/** Stripe depth along the road. */
	depth: number;
	/** Pre-computed segment geometry. */
	geometry: SegmentGeometry;
	/** Stripe material to apply. */
	material: StandardMaterial;
	/** Which side of the road. */
	side: "left" | "right";
}

/**
 * Road boundary collision detection and bumper mesh management.
 * Checks if the kart is on-road, in a bumper zone, or off-road,
 * and creates red/white striped bumper visuals along road edges.
 */
@Injectable()
export class RoadCollisionService
{
	/** All bumper meshes for disposal. */
	private readonly bumperMeshes: Mesh[] = [];

	/**
	 * Checks whether a world XZ position is on the road, in a bumper zone, or off-road.
	 * @param positionX - World X coordinate.
	 * @param positionZ - World Z coordinate.
	 * @param segments - Road segment definitions from TrackBuilderService.
	 * @returns Boundary check result with on-road, bumper zone, and edge distance.
	 */
	checkRoadBoundary(
		positionX: number,
		positionZ: number,
		segments: readonly RoadSegment[]): RoadBoundaryResult
	{
		let bestDistance: number = Infinity;
		let bestIndex: number = 0;
		let bestPerpendicularDist: number = Infinity;
		let bestSegmentAngle: number = 0;
		let bestSide: number = 1;

		for (const [index, segment] of segments.entries())
		{
			const localResult: { distance: number; perpendicularDist: number; side: number; } =
				this
					.getPerpendicularDistance(
						positionX,
						positionZ,
						segment);

			if (localResult.distance < bestDistance)
			{
				bestDistance =
					localResult.distance;
				bestIndex = index;
				bestPerpendicularDist =
					localResult.perpendicularDist;
				bestSegmentAngle =
					segment.rotationY;
				bestSide =
					localResult.side;
			}
		}

		const halfWidth: number =
			ROAD_WIDTH / 2;
		const bumperZoneStart: number =
			halfWidth - BUMPER_WIDTH;
		const absPerpDist: number =
			Math.abs(bestPerpendicularDist);

		const isOnRoad: boolean =
			absPerpDist <= halfWidth;
		const isInBumperZone: boolean =
			absPerpDist > bumperZoneStart
				&& absPerpDist <= halfWidth;

		const bumperNormalAngle: number =
			bestSegmentAngle + (bestSide > 0 ? -Math.PI / 2 : Math.PI / 2);

		return {
			isOnRoad,
			isInBumperZone,
			bumperNormalAngle,
			distanceToEdge: halfWidth - absPerpDist,
			segmentIndex: bestIndex,
			groundElevation: segments[bestIndex].elevation
		};
	}

	/**
	 * Creates red/white striped bumper meshes along all road segment edges.
	 * @param scene - The Babylon.js Scene to create meshes in.
	 * @param segments - Road segment definitions from TrackBuilderService.
	 */
	createBumpers(
		scene: Scene,
		segments: readonly RoadSegment[]): void
	{
		const redMaterial: StandardMaterial =
			new StandardMaterial("bumper-red-mat", scene);
		redMaterial.diffuseColor =
			BUMPER_RED.clone();

		const whiteMaterial: StandardMaterial =
			new StandardMaterial("bumper-white-mat", scene);
		whiteMaterial.diffuseColor =
			BUMPER_WHITE.clone();

		for (const [index, segment] of segments.entries())
		{
			this.createSegmentBumpers(
				scene,
				segment,
				index,
				redMaterial,
				whiteMaterial);
		}
	}

	/**
	 * Disposes all bumper meshes and clears references.
	 */
	dispose(): void
	{
		for (const mesh of this.bumperMeshes)
		{
			mesh.dispose();
		}

		this.bumperMeshes.length = 0;
	}

	/**
	 * Calculates the perpendicular distance from a point to a road segment.
	 * @param posX - World X coordinate.
	 * @param posZ - World Z coordinate.
	 * @param segment - Road segment definition.
	 * @returns Distance metrics for collision checking.
	 */
	private getPerpendicularDistance(
		posX: number,
		posZ: number,
		segment: RoadSegment): { distance: number; perpendicularDist: number; side: number; }
	{
		const dirX: number =
			Math.sin(segment.rotationY);
		const dirZ: number =
			Math.cos(segment.rotationY);

		const relX: number =
			posX - segment.positionX;
		const relZ: number =
			posZ - segment.positionZ;

		const alongRoad: number =
			relX * dirX + relZ * dirZ;
		const perpendicular: number =
			relX * dirZ - relZ * dirX;

		const halfLength: number =
			segment.length / 2;
		const clampedAlong: number =
			Math.max(-halfLength, Math.min(halfLength, alongRoad));

		const closestX: number =
			segment.positionX + dirX * clampedAlong;
		const closestZ: number =
			segment.positionZ + dirZ * clampedAlong;

		const distX: number =
			posX - closestX;
		const distZ: number =
			posZ - closestZ;
		const distance: number =
			Math.sqrt(distX * distX + distZ * distZ);

		return {
			distance,
			perpendicularDist: perpendicular,
			side: perpendicular >= 0 ? 1 : -1
		};
	}

	/**
	 * Creates bumper meshes on both sides of a single road segment.
	 * @param scene - Babylon.js Scene.
	 * @param segment - Road segment definition.
	 * @param segmentIndex - Segment index for naming.
	 * @param redMaterial - Red stripe material.
	 * @param whiteMaterial - White stripe material.
	 */
	private createSegmentBumpers(
		scene: Scene,
		segment: RoadSegment,
		segmentIndex: number,
		redMaterial: StandardMaterial,
		whiteMaterial: StandardMaterial): void
	{
		const geometry: SegmentGeometry =
			{
				halfWidth: ROAD_WIDTH / 2,
				dirX: Math.sin(segment.rotationY),
				dirZ: Math.cos(segment.rotationY),
				perpX: Math.cos(segment.rotationY),
				perpZ: -Math.sin(segment.rotationY)
			};

		const bumperDepth: number =
			segment.length / STRIPE_COUNT;

		for (let stripe: number = 0; stripe < STRIPE_COUNT; stripe++)
		{
			const offset: number =
				(stripe - STRIPE_COUNT / 2 + 0.5) * bumperDepth;
			const material: StandardMaterial =
				stripe % 2 === 0 ? redMaterial : whiteMaterial;

			this.createBumperStripe(
				{
					scene,
					segment,
					segmentIndex,
					stripeIndex: stripe,
					alongOffset: offset,
					depth: bumperDepth,
					geometry,
					material,
					side: "left"
				});

			this.createBumperStripe(
				{
					scene,
					segment,
					segmentIndex,
					stripeIndex: stripe,
					alongOffset: offset,
					depth: bumperDepth,
					geometry,
					material,
					side: "right"
				});
		}
	}

	/**
	 * Creates a single bumper stripe mesh on one side of the road.
	 * @param scene - Babylon.js Scene.
	 * @param segment - Road segment definition.
	 * @param segmentIndex - Segment index for naming.
	 * @param stripeIndex - Stripe index along the segment.
	 * @param alongOffset - Offset along the road direction.
	 * @param depth - Stripe depth along the road.
	 * @param halfWidth - Half of the road width.
	 * @param config - Bumper stripe placement configuration.
	 */
	private createBumperStripe(config: BumperStripeConfig): void
	{
		const sideMultiplier: number =
			config.side === "left" ? -1 : 1;
		const edgeOffset: number =
			config.geometry.halfWidth + BUMPER_WIDTH / 2;

		const bumper: Mesh =
			MeshBuilder.CreateBox(
				`bumper-${config.segmentIndex}-${config.side}-${config.stripeIndex}`,
				{
					width: BUMPER_WIDTH,
					height: BUMPER_HEIGHT,
					depth: config.depth
				},
				config.scene);

		bumper.position.x =
			config.segment.positionX
				+ config.geometry.dirX * config.alongOffset
				+ config.geometry.perpX * sideMultiplier * edgeOffset;
		bumper.position.y =
			config.segment.elevation + BUMPER_HEIGHT / 2 + (config.stripeIndex % 2) * 0.02;
		bumper.position.z =
			config.segment.positionZ
				+ config.geometry.dirZ * config.alongOffset
				+ config.geometry.perpZ * sideMultiplier * edgeOffset;
		bumper.rotation.y =
			config.segment.rotationY;
		bumper.material =
			config.material;

		this.bumperMeshes.push(bumper);
	}
}