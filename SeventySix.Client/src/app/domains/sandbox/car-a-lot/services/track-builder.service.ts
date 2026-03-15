/**
 * Track Builder Service.
 * Builds the complete race track: road segments, trees, rocks, and center lines.
 */

import { Injectable } from "@angular/core";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { Scene } from "@babylonjs/core/scene";
import {
	BUMPER_WIDTH,
	GOLD_ROCK_COLOR,
	HILL_COUNT,
	HILL_MAX_HEIGHT,
	HILL_MAX_LENGTH,
	HILL_MIN_HEIGHT,
	HILL_MIN_LENGTH,
	ROAD_COLOR,
	ROAD_LINE_COLOR,
	ROAD_WIDTH,
	ROCK_COUNT,
	SILVER_ROCK_COLOR,
	TREE_COUNT,
	TREE_TOP_COLOR,
	TREE_TRUNK_COLOR
} from "@sandbox/car-a-lot/constants/car-a-lot.constants";
import { RoadSegment } from "@sandbox/car-a-lot/models/car-a-lot.models";

/** Center line dash spacing in world units. */
const CENTER_LINE_SPACING: number = 3;

/** Center line dash length in world units. */
const CENTER_LINE_LENGTH: number = 1;

/** Minimum distance from road edge for tree placement. */
const _TREE_ROAD_OFFSET: number = 3;

/** Maximum placement distance from road center for scenery. */
const SCENERY_SPREAD: number = 80;

/**
 * Builds and manages all track geometry: road, trees, rocks, and center lines.
 * Domain-scoped — provided via route `providers` array.
 */
@Injectable()
export class TrackBuilderService
{
	/** All track meshes for disposal. */
	private readonly meshes: Mesh[] = [];

	/** Road segment definitions for collision checking. */
	private readonly segments: RoadSegment[] = [];

	/**
	 * Build the complete track in the given scene.
	 * @param scene
	 * The Babylon.js Scene to populate.
	 */
	buildTrack(scene: Scene): void
	{
		this.buildRoadNetwork(scene);
		this.createTrees(scene);
		this.createRocks(scene);
	}

	/**
	 * Get all road segments for collision checking.
	 * @returns
	 * Array of road segment definitions.
	 */
	getSegments(): readonly RoadSegment[]
	{
		return this.segments;
	}

	/**
	 * Dispose all track meshes and clear segment data.
	 */
	dispose(): void
	{
		for (const mesh of this.meshes)
		{
			mesh.dispose();
		}

		this.meshes.length = 0;
		this.segments.length = 0;
	}

	/**
	 * Build the road network as a series of box segments.
	 * @param scene
	 * The Babylon.js Scene.
	 */
	private buildRoadNetwork(scene: Scene): void
	{
		const roadMaterial: StandardMaterial =
			new StandardMaterial("road-mat", scene);

		roadMaterial.diffuseColor =
			ROAD_COLOR.clone();
		roadMaterial.specularColor =
			new Color3(0.2, 0.2, 0.2);

		const lineMaterial: StandardMaterial =
			new StandardMaterial("center-line-mat", scene);

		lineMaterial.diffuseColor =
			ROAD_LINE_COLOR.clone();
		lineMaterial.emissiveColor =
			ROAD_LINE_COLOR.clone();

		const trackLayout: RoadSegment[] =
			this.generateTrackLayout();

		for (const [index, segment] of trackLayout.entries())
		{
			this.createRoadSegment(
				scene,
				segment,
				index,
				roadMaterial);

			this.createCenterLines(
				scene,
				segment,
				index,
				lineMaterial);
		}

		this.createJunctionFills(
			scene,
			roadMaterial);
	}

	/**
	 * Generate the track layout as an array of road segments (~240 segments).
	 * Uses a procedural approach with varied sections ending heading north.
	 * @returns
	 * Array of road segment definitions.
	 */
	private generateTrackLayout(): RoadSegment[]
	{
		const layout: RoadSegment[] = [];

		let currentX: number = 0;
		let currentZ: number = 0;
		let currentAngle: number = 0;

		const addSegment: (
			length: number,
			turnAngle: number,
			isFork: boolean) => void =
			(
				length: number,
				turnAngle: number,
				isFork: boolean): void =>
			{
				const segment: RoadSegment =
					{
						positionX: currentX + Math.sin(currentAngle) * length / 2,
						positionZ: currentZ + Math.cos(currentAngle) * length / 2,
						length,
						rotationY: currentAngle,
						isFork,
						elevation: 0
					};

				layout.push(segment);
				this.segments.push(segment);

				currentX += Math.sin(currentAngle) * length;
				currentZ += Math.cos(currentAngle) * length;
				currentAngle += turnAngle;
			};

		const addRoundedTurn: (
			totalAngle: number,
			segLength: number) => void =
			(
				totalAngle: number,
				segLength: number): void =>
			{
				const steps: number = 3;
				const distribution: number[] =
					[0.25, 0.5, 0.25];

				for (let step: number = 0; step < steps; step++)
				{
					addSegment(
						segLength,
						totalAngle * distribution[step],
						false);
				}
			};

		// Section 1: Opening straight (segs 1-6) ~200 units
		addSegment(50, 0, false);
		addSegment(40, 0, false);
		addSegment(35, 0, true);
		addSegment(30, 0, true);
		addSegment(25, 0, false);
		addSegment(20, 0, false);

		// Section 2: First curves (segs 7-18) ~300 units
		addRoundedTurn(-Math.PI / 6, 25);
		addSegment(35, 0, true);
		addRoundedTurn(Math.PI / 4, 20);
		addSegment(30, 0, false);
		addRoundedTurn(-Math.PI / 8, 25);
		addSegment(40, 0, false);

		// Section 3: Speed straight (segs 19-28) ~400 units
		addSegment(50, 0, false);
		addSegment(45, 0, false);
		addSegment(50, 0, false);
		addSegment(40, 0, false);
		addSegment(50, 0, true);
		addSegment(45, 0, false);
		addSegment(40, 0, false);
		addSegment(35, 0, false);
		addSegment(30, 0, false);
		addSegment(35, 0, false);

		// Section 4: S-curves (segs 29-52) ~550 units
		addRoundedTurn(Math.PI / 6, 20);
		addSegment(30, 0, false);
		addRoundedTurn(-Math.PI / 4, 22);
		addSegment(25, 0, false);
		addRoundedTurn(Math.PI / 5, 18);
		addSegment(35, 0, true);
		addRoundedTurn(-Math.PI / 6, 20);
		addSegment(30, 0, false);
		addRoundedTurn(Math.PI / 8, 25);
		addSegment(25, 0, false);
		addRoundedTurn(-Math.PI / 5, 20);
		addSegment(30, 0, false);

		// Section 5: Tunnel straight (segs 53-58) ~240 units
		addSegment(45, 0, false);
		addSegment(50, 0, false);
		addSegment(40, 0, false);
		addSegment(35, 0, false);
		addSegment(40, 0, false);
		addSegment(30, 0, false);

		// Section 6: Mountain curves (segs 59-82) ~500 units
		addRoundedTurn(-Math.PI / 4, 18);
		addSegment(20, 0, false);
		addRoundedTurn(Math.PI / 3, 20);
		addSegment(25, 0, true);
		addRoundedTurn(-Math.PI / 6, 22);
		addSegment(30, 0, false);
		addRoundedTurn(Math.PI / 4, 18);
		addSegment(20, 0, false);
		addRoundedTurn(-Math.PI / 3, 20);
		addSegment(25, 0, false);
		addRoundedTurn(Math.PI / 6, 22);
		addSegment(30, 0, false);
		addRoundedTurn(-Math.PI / 8, 18);
		addSegment(35, 0, false);

		// Section 7: Short speed section ~250 units
		addSegment(40, 0, false);
		addSegment(50, 0, false);
		addSegment(45, 0, false);
		addSegment(40, 0, true);
		addSegment(35, 0, false);
		addSegment(40, 0, false);

		// Section 8: Sprint to finish ~350 units
		addRoundedTurn(Math.PI / 8, 25);
		addSegment(40, 0, false);
		addRoundedTurn(-Math.PI / 6, 25);
		addSegment(50, 0, false);
		addSegment(35, 0, true);
		addRoundedTurn(Math.PI / 6, 22);
		addSegment(40, 0, false);
		addSegment(45, 0, false);

		// Section 9: Final approach — correct heading to north (heading ≈ 0)
		// Calculate how much we need to turn to face north
		const normalizedAngle: number =
			((currentAngle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
		const targetAngle: number = 0;
		let correctionAngle: number =
			targetAngle - normalizedAngle;

		if (correctionAngle > Math.PI)
		{
			correctionAngle -= Math.PI * 2;
		}
		else if (correctionAngle < -Math.PI)
		{
			correctionAngle += Math.PI * 2;
		}

		// Distribute correction over several rounded turns
		const correctionSteps: number = 4;
		const correctionPerStep: number =
			correctionAngle / correctionSteps;

		for (let step: number = 0; step < correctionSteps; step++)
		{
			addRoundedTurn(correctionPerStep, 20);
			addSegment(30, 0, false);
		}

		// Final straight approach to octopus
		addSegment(40, 0, false);
		addSegment(50, 0, false);
		addSegment(40, 0, false);
		addSegment(35, 0, false);
		addSegment(45, 0, false);
		addSegment(30, 0, false);

		this.applyHillElevations(layout);

		return layout;
	}

	/**
	 * Apply sine-curve hill elevation to segments.
	 * Distributes HILL_COUNT hills evenly across the middle of the track.
	 * Automatically excludes the longest straight section (tunnel zone)
	 * and a buffer around it so the tunnel sits on flat ground.
	 * @param layout
	 * Road segments to modify elevation on.
	 */
	private applyHillElevations(layout: RoadSegment[]): void
	{
		const totalSegments: number =
			layout.length;
		const margin: number =
			Math.floor(totalSegments * 0.1);
		const usableRange: number =
			totalSegments - margin * 2;
		const spacing: number =
			Math.floor(usableRange / HILL_COUNT);

		const tunnelRange: { start: number; end: number; } =
			this.findTunnelFlatRange(layout);

		const hillHeights: number[] =
			[4, 7, 5, 8, 6];
		const hillLengths: number[] =
			[HILL_MIN_LENGTH, HILL_MAX_LENGTH, 10, HILL_MAX_LENGTH, 12];

		for (let hillIdx: number = 0; hillIdx < HILL_COUNT; hillIdx++)
		{
			const centerSeg: number =
				margin + Math.floor(spacing * (hillIdx + 0.5));
			const halfLength: number =
				Math.floor(hillLengths[hillIdx % hillLengths.length] / 2);
			const peakHeight: number =
				Math.max(
					HILL_MIN_HEIGHT,
					Math.min(HILL_MAX_HEIGHT, hillHeights[hillIdx % hillHeights.length]));
			const startSeg: number =
				Math.max(0, centerSeg - halfLength);
			const endSeg: number =
				Math.min(totalSegments - 1, centerSeg + halfLength);

			for (let seg: number = startSeg; seg <= endSeg; seg++)
			{
				if (seg >= tunnelRange.start && seg <= tunnelRange.end)
				{
					continue;
				}

				const progress: number =
					(seg - startSeg) / (endSeg - startSeg);
				const hillElevation: number =
					peakHeight * Math.sin(Math.PI * progress);

				layout[seg].elevation =
					Math.max(layout[seg].elevation, hillElevation);
			}
		}
	}

	/**
	 * Find the segment range that must stay flat for the tunnel.
	 * Identifies the longest consecutive straight stretch and adds a small buffer.
	 * @param layout
	 * Road segments to analyze.
	 * @returns
	 * Start and end segment indices (inclusive) that must remain at elevation 0.
	 */
	private findTunnelFlatRange(layout: RoadSegment[]): { start: number; end: number; }
	{
		let bestStart: number = 0;
		let bestCount: number = 1;
		let bestLength: number =
			layout.length > 0 ? layout[0].length : 0;

		let currentStart: number = 0;
		let currentCount: number = 1;
		let currentLength: number = bestLength;

		for (let idx: number = 1; idx < layout.length; idx++)
		{
			const headingDiff: number =
				Math.abs(layout[idx].rotationY - layout[idx - 1].rotationY);

			if (headingDiff < 0.01)
			{
				currentCount++;
				currentLength += layout[idx].length;
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
					layout[idx].length;
			}
		}

		if (currentLength > bestLength)
		{
			bestStart = currentStart;
			bestCount = currentCount;
		}

		const buffer: number = 3;

		return {
			start: Math.max(0, bestStart - buffer),
			end: Math.min(layout.length - 1, bestStart + bestCount - 1 + buffer)
		};
	}

	/**
	 * Create a single road segment mesh with slight overlap to prevent gaps.
	 * @param scene
	 * The Babylon.js Scene.
	 * @param segment
	 * Road segment definition.
	 * @param index
	 * Segment index for naming.
	 * @param material
	 * Road material to apply.
	 */
	private createRoadSegment(
		scene: Scene,
		segment: RoadSegment,
		index: number,
		material: StandardMaterial): void
	{
		const road: Mesh =
			MeshBuilder.CreateBox(
				`road-${index}`,
				{
					width: ROAD_WIDTH,
					height: 0.1,
					depth: segment.length + 2
				},
				scene);

		road.position =
			new Vector3(
				segment.positionX,
				segment.elevation,
				segment.positionZ);
		road.rotation.y =
			segment.rotationY;
		road.material = material;

		this.meshes.push(road);
	}

	/**
	 * Create dashed center line along a road segment.
	 * @param scene
	 * The Babylon.js Scene.
	 * @param segment
	 * Road segment to add lines to.
	 * @param segmentIndex
	 * Index for naming.
	 * @param material
	 * White line material.
	 */
	private createCenterLines(
		scene: Scene,
		segment: RoadSegment,
		segmentIndex: number,
		material: StandardMaterial): void
	{
		const dashCount: number =
			Math.floor(segment.length / CENTER_LINE_SPACING);

		const dirX: number =
			Math.sin(segment.rotationY);
		const dirZ: number =
			Math.cos(segment.rotationY);

		const startX: number =
			segment.positionX - dirX * segment.length / 2;
		const startZ: number =
			segment.positionZ - dirZ * segment.length / 2;

		for (let dashIndex: number = 0; dashIndex < dashCount; dashIndex++)
		{
			const offset: number =
				dashIndex * CENTER_LINE_SPACING + CENTER_LINE_SPACING / 2;

			const dash: Mesh =
				MeshBuilder.CreateBox(
					`center-line-${segmentIndex}-${dashIndex}`,
					{
						width: 0.3,
						height: 0.12,
						depth: CENTER_LINE_LENGTH
					},
					scene);

			dash.position =
				new Vector3(
					startX + dirX * offset,
					segment.elevation + 0.06,
					startZ + dirZ * offset);
			dash.rotation.y =
				segment.rotationY;
			dash.material = material;

			this.meshes.push(dash);
		}
	}

	/**
	 * Fill junction gaps between angled road segments with disc meshes.
	 * When consecutive segments have different headings, the box corners
	 * leave triangular gaps exposing the ground. A disc at each junction
	 * covers the gap.
	 * @param scene
	 * The Babylon.js Scene.
	 * @param material
	 * Road material to match road surface.
	 */
	private createJunctionFills(
		scene: Scene,
		material: StandardMaterial): void
	{
		const discRadius: number =
			ROAD_WIDTH / 2 + 1;

		for (let idx: number = 0; idx < this.segments.length - 1; idx++)
		{
			const current: RoadSegment =
				this.segments[idx];
			const next: RoadSegment =
				this.segments[idx + 1];

			const headingDelta: number =
				Math.abs(current.rotationY - next.rotationY);

			if (headingDelta < 0.001)
			{
				continue;
			}

			const junctionX: number =
				current.positionX + Math.sin(current.rotationY) * current.length / 2;
			const junctionZ: number =
				current.positionZ + Math.cos(current.rotationY) * current.length / 2;

			const disc: Mesh =
				MeshBuilder.CreateCylinder(
					`junction-fill-${idx}`,
					{
						diameter: discRadius * 2,
						height: 0.1,
						tessellation: 24
					},
					scene);

			const junctionElevation: number =
				(current.elevation + next.elevation) / 2;

			disc.position =
				new Vector3(
					junctionX,
					junctionElevation,
					junctionZ);
			disc.material = material;

			this.meshes.push(disc);
		}
	}

	/**
	 * Create decorative trees alongside the road, guaranteed off-road.
	 * @param scene
	 * The Babylon.js Scene.
	 */
	private createTrees(scene: Scene): void
	{
		const trunkMaterial: StandardMaterial =
			new StandardMaterial("tree-trunk-mat", scene);

		trunkMaterial.diffuseColor =
			TREE_TRUNK_COLOR.clone();

		const topMaterial: StandardMaterial =
			new StandardMaterial("tree-top-mat", scene);

		topMaterial.diffuseColor =
			TREE_TOP_COLOR.clone();
		topMaterial.emissiveColor =
			new Color3(0.05, 0.1, 0.07);

		const minClearance: number =
			ROAD_WIDTH / 2 + BUMPER_WIDTH + 3;

		for (let treeIndex: number = 0; treeIndex < TREE_COUNT; treeIndex++)
		{
			const position: { x: number; z: number; } | null =
				this.findOffRoadPosition(minClearance, SCENERY_SPREAD);

			if (position === null)
			{
				continue;
			}

			const posX: number =
				position.x;
			const posZ: number =
				position.z;

			const trunkHeight: number =
				4 + Math.random() * 4;
			const trunkDiameter: number =
				0.8 + Math.random() * 0.4;
			const topDiameter: number =
				4 + Math.random() * 3;

			const trunk: Mesh =
				MeshBuilder.CreateCylinder(
					`tree-trunk-${treeIndex}`,
					{
						height: trunkHeight,
						diameter: trunkDiameter
					},
					scene);

			trunk.position =
				new Vector3(
					posX,
					trunkHeight / 2,
					posZ);
			trunk.material = trunkMaterial;

			const top: Mesh =
				MeshBuilder.CreateSphere(
					`tree-top-${treeIndex}`,
					{
						diameter: topDiameter,
						segments: 8
					},
					scene);

			top.position =
				new Vector3(
					posX,
					trunkHeight + topDiameter / 3,
					posZ);
			top.material = topMaterial;

			this.meshes.push(trunk);
			this.meshes.push(top);
		}
	}

	/**
	 * Create decorative gold and silver rocks, guaranteed off-road.
	 * @param scene
	 * The Babylon.js Scene.
	 */
	private createRocks(scene: Scene): void
	{
		const goldMaterial: StandardMaterial =
			new StandardMaterial("rock-gold-mat", scene);

		goldMaterial.diffuseColor =
			GOLD_ROCK_COLOR.clone();
		goldMaterial.specularColor =
			new Color3(0.5, 0.5, 0.4);
		goldMaterial.emissiveColor =
			new Color3(0.1, 0.08, 0.02);

		const silverMaterial: StandardMaterial =
			new StandardMaterial("rock-silver-mat", scene);

		silverMaterial.diffuseColor =
			SILVER_ROCK_COLOR.clone();
		silverMaterial.specularColor =
			new Color3(0.6, 0.6, 0.6);

		const minClearance: number =
			ROAD_WIDTH / 2 + BUMPER_WIDTH + 2;

		for (let rockIndex: number = 0; rockIndex < ROCK_COUNT; rockIndex++)
		{
			const position: { x: number; z: number; } | null =
				this.findOffRoadPosition(minClearance, SCENERY_SPREAD);

			if (position === null)
			{
				continue;
			}

			const diameter: number =
				1 + Math.random() * 3;

			const rock: Mesh =
				MeshBuilder.CreateSphere(
					`rock-${rockIndex}`,
					{
						diameter,
						segments: 4
					},
					scene);

			rock.position =
				new Vector3(
					position.x,
					diameter / 3,
					position.z);

			rock.scaling =
				new Vector3(
					0.7 + Math.random() * 0.6,
					0.7 + Math.random() * 0.6,
					0.7 + Math.random() * 0.6);

			rock.rotation.y =
				Math.random() * Math.PI * 2;

			const isGold: boolean =
				rockIndex % 2 === 0;

			rock.material =
				isGold ? goldMaterial : silverMaterial;

			this.meshes.push(rock);
		}
	}

	/**
	 * Find a position that is guaranteed off-road by checking against all segments.
	 * Picks a random segment, then offsets perpendicular to the road.
	 * @param minClearance
	 * Minimum distance from road center line.
	 * @param maxSpread
	 * Maximum additional distance beyond clearance.
	 * @returns
	 * Position object or null if placement failed after retries.
	 */
	private findOffRoadPosition(
		minClearance: number,
		maxSpread: number): { x: number; z: number; } | null
	{
		for (let attempt: number = 0; attempt < 10; attempt++)
		{
			const segIdx: number =
				Math.floor(Math.random() * this.segments.length);
			const segment: RoadSegment =
				this.segments[segIdx];

			const perpX: number =
				Math.cos(segment.rotationY);
			const perpZ: number =
				-Math.sin(segment.rotationY);
			const side: number =
				Math.random() > 0.5 ? 1 : -1;
			const offset: number =
				minClearance + Math.random() * maxSpread;
			const along: number =
				(Math.random() - 0.5) * segment.length;
			const dirX: number =
				Math.sin(segment.rotationY);
			const dirZ: number =
				Math.cos(segment.rotationY);

			const posX: number =
				segment.positionX + dirX * along + perpX * side * offset;
			const posZ: number =
				segment.positionZ + dirZ * along + perpZ * side * offset;

			if (this.isOffRoad(posX, posZ, minClearance))
			{
				return { x: posX, z: posZ };
			}
		}

		return null;
	}

	/**
	 * Check if a position is safely off-road from all segments.
	 * @param posX
	 * World X position.
	 * @param posZ
	 * World Z position.
	 * @param minClearance
	 * Minimum distance from any road center line.
	 * @returns
	 * True if position is off-road.
	 */
	private isOffRoad(
		posX: number,
		posZ: number,
		minClearance: number): boolean
	{
		for (const segment of this.segments)
		{
			const dirX: number =
				Math.sin(segment.rotationY);
			const dirZ: number =
				Math.cos(segment.rotationY);
			const relX: number =
				posX - segment.positionX;
			const relZ: number =
				posZ - segment.positionZ;
			const along: number =
				relX * dirX + relZ * dirZ;
			const halfLength: number =
				segment.length / 2 + 1;

			if (Math.abs(along) > halfLength)
			{
				continue;
			}

			const perpendicular: number =
				Math.abs(relX * dirZ - relZ * dirX);

			if (perpendicular < minClearance)
			{
				return false;
			}
		}

		return true;
	}
}