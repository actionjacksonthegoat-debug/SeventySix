/**
 * Track Features Service.
 * Manages jump ramps, tunnel construction, and road fork detection.
 */

import { Injectable } from "@angular/core";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { Scene } from "@babylonjs/core/scene";
import {
	JUMP_LARGE_VELOCITY,
	JUMP_MEDIUM_VELOCITY,
	JUMP_MIN_SPEED_MPH,
	JUMP_SMALL_VELOCITY,
	RAMP_CHEVRON_COLOR,
	RAMP_HEIGHT_LARGE,
	RAMP_HEIGHT_MEDIUM,
	RAMP_HEIGHT_SMALL,
	RAMP_LENGTH_LARGE,
	RAMP_LENGTH_MEDIUM,
	RAMP_LENGTH_SMALL,
	ROAD_WIDTH,
	TUNNEL_HEIGHT,
	TUNNEL_LENGTH,
	TUNNEL_LIGHT_COLOR,
	TUNNEL_LIGHT_EMISSIVE,
	TUNNEL_LIGHT_HEIGHT,
	TUNNEL_LIGHT_SPACING,
	TUNNEL_WALL_COLOR,
	TUNNEL_WALL_THICKNESS
} from "@sandbox/car-a-lot/constants/car-a-lot.constants";
import {
	JumpRamp,
	JumpRampSize,
	JumpResult,
	RoadSegment
} from "@sandbox/car-a-lot/models/car-a-lot.models";

/** Ramp trigger detection radius — covers full road width for side hits. */
const RAMP_TRIGGER_RADIUS: number =
	ROAD_WIDTH / 2;

/** Tunnel detection half-width for position checks. */
const TUNNEL_HALF_WIDTH: number =
	ROAD_WIDTH / 2 + 2;

/** Ramp segment spacing — place ramps on non-fork, non-first segments. */
const RAMP_COUNT: number = 9;

/** Directional vectors for tunnel construction. */
interface TunnelDirections
{
	/** Forward direction X component. */
	dirX: number;
	/** Forward direction Z component. */
	dirZ: number;
	/** Perpendicular direction X component. */
	perpX: number;
	/** Perpendicular direction Z component. */
	perpZ: number;
}

/**
 * Ramp size definition with physical properties.
 */
interface RampSizeConfig
{
	/** Ramp size classification. */
	size: JumpRampSize;

	/** Jump velocity to apply. */
	velocity: number;

	/** Ramp surface length. */
	rampLength: number;

	/** Ramp peak height. */
	height: number;
}

/** Ramp configurations indexed by size. */
const RAMP_CONFIGS: readonly RampSizeConfig[] =
	[
		{
			size: "small",
			velocity: JUMP_SMALL_VELOCITY,
			rampLength: RAMP_LENGTH_SMALL,
			height: RAMP_HEIGHT_SMALL
		},
		{
			size: "medium",
			velocity: JUMP_MEDIUM_VELOCITY,
			rampLength: RAMP_LENGTH_MEDIUM,
			height: RAMP_HEIGHT_MEDIUM
		},
		{
			size: "large",
			velocity: JUMP_LARGE_VELOCITY,
			rampLength: RAMP_LENGTH_LARGE,
			height: RAMP_HEIGHT_LARGE
		}
	];

/**
 * Builds and manages track features: jump ramps, tunnel, and fork detection.
 * Domain-scoped — provided via route `providers` array.
 */
@Injectable()
export class TrackFeaturesService
{
	/** All feature meshes for disposal. */
	private readonly meshes: Mesh[] = [];

	/** Jump ramp definitions. */
	private readonly jumpRamps: JumpRamp[] = [];

	/** Tunnel start position X. */
	private tunnelStartX: number = 0;

	/** Tunnel start position Z. */
	private tunnelStartZ: number = 0;

	/** Tunnel heading in radians. */
	private tunnelHeading: number = 0;

	/** Whether the tunnel has been created. */
	private tunnelCreated: boolean = false;

	/** Effective tunnel length (can be overridden by dynamic sizing). */
	private effectiveTunnelLength: number = TUNNEL_LENGTH;

	/**
	 * Find the longest consecutive straight stretch of segments.
	 * Consecutive segments with matching rotationY are considered straight.
	 * @param segments
	 * Track road segments to analyze.
	 * @returns
	 * Object with startIndex, count, and totalLength of the longest straight stretch.
	 */
	findLongestStraight(segments: readonly RoadSegment[]): { startIndex: number; count: number; totalLength: number; }
	{
		if (segments.length === 0)
		{
			return { startIndex: 0, count: 0, totalLength: 0 };
		}

		let bestStart: number = 0;
		let bestCount: number = 1;
		let bestLength: number =
			segments[0].length;

		let currentStart: number = 0;
		let currentCount: number = 1;
		let currentLength: number =
			segments[0].length;

		for (let idx: number = 1; idx < segments.length; idx++)
		{
			const headingDiff: number =
				Math.abs(segments[idx].rotationY - segments[idx - 1].rotationY);

			if (headingDiff < 0.01)
			{
				currentCount++;
				currentLength += segments[idx].length;
			}
			else
			{
				if (currentLength > bestLength)
				{
					bestStart = currentStart;
					bestCount = currentCount;
					bestLength = currentLength;
				}
				currentStart = idx;
				currentCount = 1;
				currentLength =
					segments[idx].length;
			}
		}

		if (currentLength > bestLength)
		{
			bestStart = currentStart;
			bestCount = currentCount;
			bestLength = currentLength;
		}

		return { startIndex: bestStart, count: bestCount, totalLength: bestLength };
	}

	/**
	 * Get all jump ramp definitions.
	 * @returns
	 * Readonly array of jump ramp definitions.
	 */
	getJumpRamps(): readonly JumpRamp[]
	{
		return this.jumpRamps;
	}

	/**
	 * Create jump ramps on the track, evenly distributed across segments.
	 * @param scene
	 * The Babylon.js Scene to add meshes to.
	 * @param segments
	 * Track road segments to place ramps on.
	 */
	createJumps(
		scene: Scene,
		segments: readonly RoadSegment[]): void
	{
		const spacing: number =
			Math.floor(segments.length / (RAMP_COUNT + 1));

		for (let rampIndex: number = 0; rampIndex < RAMP_COUNT; rampIndex++)
		{
			const config: RampSizeConfig =
				RAMP_CONFIGS[rampIndex % RAMP_CONFIGS.length];

			const segmentIndex: number =
				spacing * (rampIndex + 1);

			const segment: RoadSegment =
				segmentIndex < segments.length
					? segments[segmentIndex]
					: segments[segments.length - 1];

			if (this.isInsideTunnel(segment.positionX, segment.positionZ))
			{
				continue;
			}

			const ramp: JumpRamp =
				{
					size: config.size,
					positionX: segment.positionX,
					positionZ: segment.positionZ,
					rotationY: segment.rotationY,
					jumpVelocity: config.velocity,
					minimumSpeedMph: JUMP_MIN_SPEED_MPH,
					rampLength: config.rampLength
				};

			this.jumpRamps.push(ramp);
			this.createRampMesh(
				scene,
				ramp,
				config,
				rampIndex,
				segment.elevation);
		}
	}

	/**
	 * Check if a kart position triggers a jump ramp.
	 * @param positionX
	 * Kart world X position.
	 * @param positionZ
	 * Kart world Z position.
	 * @param speedMph
	 * Kart current speed in mph.
	 * @returns
	 * Jump result with velocity, or null if no jump triggered.
	 */
	checkJumpTrigger(
		positionX: number,
		positionZ: number,
		speedMph: number): JumpResult | null
	{
		for (const [rampIndex, ramp] of this.jumpRamps.entries())
		{
			const distX: number =
				positionX - ramp.positionX;
			const distZ: number =
				positionZ - ramp.positionZ;
			const distance: number =
				Math.sqrt(distX * distX + distZ * distZ);

			if (distance < RAMP_TRIGGER_RADIUS && speedMph >= ramp.minimumSpeedMph)
			{
				return {
					jumpVelocity: ramp.jumpVelocity,
					rampIndex
				};
			}
		}

		return null;
	}

	/**
	 * Create a tunnel at the specified position and heading.
	 * @param scene
	 * The Babylon.js Scene to add meshes to.
	 * @param startX
	 * Tunnel entrance world X position.
	 * @param startZ
	 * Tunnel entrance world Z position.
	 * @param heading
	 * Tunnel heading in radians.
	 * @param length
	 * Optional tunnel length override (defaults to TUNNEL_LENGTH constant).
	 */
	createTunnel(
		scene: Scene,
		startX: number,
		startZ: number,
		heading: number,
		length?: number): void
	{
		this.effectiveTunnelLength =
			length ?? TUNNEL_LENGTH;
		this.tunnelStartX = startX;
		this.tunnelStartZ = startZ;
		this.tunnelHeading = heading;
		this.tunnelCreated = true;

		const dirX: number =
			Math.sin(heading);
		const dirZ: number =
			Math.cos(heading);
		const centerX: number =
			startX + dirX * this.effectiveTunnelLength / 2;
		const centerZ: number =
			startZ + dirZ * this.effectiveTunnelLength / 2;
		const halfWidth: number =
			ROAD_WIDTH / 2 + TUNNEL_WALL_THICKNESS;

		const perpX: number =
			Math.cos(heading);
		const perpZ: number =
			-Math.sin(heading);

		const directions: TunnelDirections =
			{
				dirX,
				dirZ,
				perpX,
				perpZ
			};

		this.createTunnelWalls(
			scene,
			centerX,
			centerZ,
			directions,
			heading);

		this.createTunnelCeiling(
			scene,
			centerX,
			centerZ,
			halfWidth,
			heading);

		this.createTunnelLights(
			scene,
			startX,
			startZ,
			directions);
	}

	/**
	 * Check if a position is inside the tunnel.
	 * @param positionX
	 * World X position to check.
	 * @param positionZ
	 * World Z position to check.
	 * @returns
	 * True if position is within the tunnel bounds.
	 */
	isInsideTunnel(
		positionX: number,
		positionZ: number): boolean
	{
		if (!this.tunnelCreated)
		{
			return false;
		}

		const dirX: number =
			Math.sin(this.tunnelHeading);
		const dirZ: number =
			Math.cos(this.tunnelHeading);
		const relX: number =
			positionX - this.tunnelStartX;
		const relZ: number =
			positionZ - this.tunnelStartZ;

		const alongDist: number =
			relX * dirX + relZ * dirZ;

		if (alongDist < 0 || alongDist > this.effectiveTunnelLength)
		{
			return false;
		}

		const perpX: number =
			Math.cos(this.tunnelHeading);
		const perpZ: number =
			-Math.sin(this.tunnelHeading);
		const perpDist: number =
			Math.abs(relX * perpX + relZ * perpZ);

		return perpDist < TUNNEL_HALF_WIDTH;
	}

	/**
	 * Find indices of fork segments in the track data.
	 * @param segments
	 * Array of road segments to scan.
	 * @returns
	 * Indices of segments marked as forks.
	 */
	findForkSegments(segments: readonly RoadSegment[]): number[]
	{
		const forkIndices: number[] = [];

		for (const [index, segment] of segments.entries())
		{
			if (segment.isFork)
			{
				forkIndices.push(index);
			}
		}

		return forkIndices;
	}

	/**
	 * Dispose all meshes and lights created by this service.
	 */
	dispose(): void
	{
		for (const mesh of this.meshes)
		{
			mesh.dispose();
		}

		this.meshes.length = 0;
		this.jumpRamps.length = 0;
		this.tunnelCreated = false;
	}

	/**
	 * Create the visual mesh for a jump ramp.
	 * @param scene
	 * The Babylon.js Scene.
	 * @param ramp
	 * Jump ramp definition.
	 * @param config
	 * Ramp size configuration.
	 * @param index
	 * Ramp index for naming.
	 * @param elevation
	 * Road segment elevation Y offset.
	 */
	private createRampMesh(
		scene: Scene,
		ramp: JumpRamp,
		config: RampSizeConfig,
		index: number,
		elevation: number): void
	{
		const rampMesh: Mesh =
			MeshBuilder.CreateBox(
				`ramp-${index}`,
				{
					width: ROAD_WIDTH * 0.8,
					height: config.height,
					depth: config.rampLength
				},
				scene);

		const rampMaterial: StandardMaterial =
			new StandardMaterial(`ramp-mat-${index}`, scene);

		rampMaterial.diffuseColor =
			new Color3(0.78, 0.78, 0.78);
		rampMaterial.specularColor =
			new Color3(0.3, 0.3, 0.3);

		rampMesh.position =
			new Vector3(
				ramp.positionX,
				elevation + config.height / 2,
				ramp.positionZ);
		rampMesh.rotation.y =
			ramp.rotationY;
		rampMesh.material = rampMaterial;

		this.meshes.push(rampMesh);

		const chevronMesh: Mesh =
			MeshBuilder.CreateBox(
				`ramp-chevron-${index}`,
				{
					width: ROAD_WIDTH * 0.6,
					height: 0.15,
					depth: 0.5
				},
				scene);

		const chevronMaterial: StandardMaterial =
			new StandardMaterial(`ramp-chevron-mat-${index}`, scene);

		chevronMaterial.diffuseColor =
			RAMP_CHEVRON_COLOR.clone();
		chevronMaterial.emissiveColor =
			new Color3(0.3, 0.25, 0);

		chevronMesh.position =
			new Vector3(
				ramp.positionX,
				elevation + config.height + 0.08,
				ramp.positionZ);
		chevronMesh.rotation.y =
			ramp.rotationY;
		chevronMesh.material = chevronMaterial;

		this.meshes.push(chevronMesh);
	}

	/**
	 * Create tunnel wall meshes on both sides.
	 * @param scene
	 * The Babylon.js Scene.
	 * @param centerX
	 * Tunnel center X position.
	 * @param centerZ
	 * Tunnel center Z position.
	 * @param directions
	 * Pre-computed tunnel directional vectors.
	 * @param heading
	 * Tunnel heading rotation.
	 */
	private createTunnelWalls(
		scene: Scene,
		centerX: number,
		centerZ: number,
		directions: TunnelDirections,
		heading: number): void
	{
		const wallMaterial: StandardMaterial =
			new StandardMaterial("tunnel-wall-mat", scene);

		wallMaterial.diffuseColor =
			TUNNEL_WALL_COLOR.clone();
		wallMaterial.specularColor =
			new Color3(0.1, 0.1, 0.1);

		const halfWidth: number =
			ROAD_WIDTH / 2 + TUNNEL_WALL_THICKNESS;

		for (const side of [-1, 1])
		{
			const wall: Mesh =
				MeshBuilder.CreateBox(
					`tunnel-wall-${side > 0 ? "right" : "left"}`,
					{
						width: TUNNEL_WALL_THICKNESS,
						height: TUNNEL_HEIGHT,
						depth: this.effectiveTunnelLength
					},
					scene);

			wall.position =
				new Vector3(
					centerX + directions.perpX * halfWidth * side,
					TUNNEL_HEIGHT / 2,
					centerZ + directions.perpZ * halfWidth * side);
			wall.rotation.y = heading;
			wall.material = wallMaterial;

			this.meshes.push(wall);
		}
	}

	/**
	 * Create the tunnel ceiling mesh.
	 * @param scene
	 * The Babylon.js Scene.
	 * @param centerX
	 * Tunnel center X position.
	 * @param centerZ
	 * Tunnel center Z position.
	 * @param halfWidth
	 * Half the tunnel outer width.
	 * @param heading
	 * Tunnel heading rotation.
	 */
	private createTunnelCeiling(
		scene: Scene,
		centerX: number,
		centerZ: number,
		halfWidth: number,
		heading: number): void
	{
		const ceilingMaterial: StandardMaterial =
			new StandardMaterial("tunnel-ceiling-mat", scene);

		ceilingMaterial.diffuseColor =
			TUNNEL_WALL_COLOR.clone();

		const ceiling: Mesh =
			MeshBuilder.CreateBox(
				`tunnel-ceiling`,
				{
					width: halfWidth * 2,
					height: TUNNEL_WALL_THICKNESS,
					depth: this.effectiveTunnelLength
				},
				scene);

		ceiling.position =
			new Vector3(
				centerX,
				TUNNEL_HEIGHT,
				centerZ);
		ceiling.rotation.y = heading;
		ceiling.material = ceilingMaterial;

		this.meshes.push(ceiling);
	}

	/**
	 * Create tunnel interior lights on staggered wall positions.
	 * @param scene
	 * The Babylon.js Scene.
	 * @param startX
	 * Tunnel entrance X position.
	 * @param startZ
	 * Tunnel entrance Z position.
	 * @param dirX
	 * Forward direction X.
	 * @param dirZ
	 * Forward direction Z.
	 * @param perpX
	 * Perpendicular direction X.
	 * @param directions
	 * Pre-computed tunnel directional vectors.
	 */
	private createTunnelLights(
		scene: Scene,
		startX: number,
		startZ: number,
		directions: TunnelDirections): void
	{
		const lightCount: number =
			Math.floor(this.effectiveTunnelLength / TUNNEL_LIGHT_SPACING);

		const halfWidth: number =
			ROAD_WIDTH / 2;

		for (let lightIndex: number = 0; lightIndex < lightCount; lightIndex++)
		{
			const offset: number =
				(lightIndex + 0.5) * TUNNEL_LIGHT_SPACING;

			const side: number =
				lightIndex % 2 === 0 ? 1 : -1;

			const lightX: number =
				startX + directions.dirX * offset + directions.perpX * halfWidth * side;
			const lightZ: number =
				startZ + directions.dirZ * offset + directions.perpZ * halfWidth * side;

			const glowSphere: Mesh =
				MeshBuilder.CreateSphere(
					`tunnel-glow-${lightIndex}`,
					{
						diameter: 0.5,
						segments: 8
					},
					scene);

			const glowMaterial: StandardMaterial =
				new StandardMaterial(`tunnel-glow-mat-${lightIndex}`, scene);

			glowMaterial.emissiveColor =
				TUNNEL_LIGHT_EMISSIVE.clone();
			glowMaterial.diffuseColor =
				TUNNEL_LIGHT_COLOR.clone();

			glowSphere.position =
				new Vector3(
					lightX,
					TUNNEL_LIGHT_HEIGHT,
					lightZ);
			glowSphere.material = glowMaterial;

			this.meshes.push(glowSphere);
		}
	}
}