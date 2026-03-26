/**
 * Boost Service.
 * Manages boost pad placement, trigger detection, and speed override timer.
 */

import { computed, Injectable, Signal, signal, WritableSignal } from "@angular/core";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { Scene } from "@babylonjs/core/scene";
import {
	BOOST_CHEVRON_COLOR,
	BOOST_INCREMENT_MPH,
	BOOST_PAD_COLOR,
	BOOST_PAD_COUNT,
	BOOST_PAD_EMISSIVE,
	BOOST_PAD_LENGTH,
	BOOST_PAD_WIDTH,
	BOOST_TRIGGER_RADIUS,
	MAX_SPEED_MPH
} from "@games/car-a-lot/constants/car-a-lot.constants";
import { BoostPad, BoostState, RoadSegment } from "@games/car-a-lot/models/car-a-lot.models";

/**
 * Manages boost pads that temporarily increase max speed.
 * Domain-scoped — provided via route `providers` array.
 */
@Injectable()
export class BoostService
{
	/** Current boost state signal. */
	private readonly _boostState: WritableSignal<BoostState> =
		signal(
			{
				isActive: false,
				remainingSeconds: 0
			});

	/** Read-only boost state. */
	readonly boostState: Signal<BoostState> =
		this._boostState.asReadonly();

	/** Whether boost is currently active. */
	readonly isBoostActive: Signal<boolean> =
		computed(
			() => this._boostState().isActive);

	/** Boost pad definitions. */
	private pads: BoostPad[] = [];

	/** Boost pad meshes for disposal. */
	private readonly meshes: Mesh[] = [];

	/** Indices of pads already triggered this session. */
	private readonly triggeredPadIndices: Set<number> =
		new Set();

	/** Number of unique boost pads collected (resets on bumper hit). */
	private boostCount: number = 0;

	/** Shared boost material. */
	private boostMaterial: StandardMaterial | null = null;

	/**
	 * Place boost pads evenly along the track.
	 * @param scene
	 * The Babylon.js Scene.
	 * @param segments
	 * Track road segments to distribute pads across.
	 */
	placeBoostPads(
		scene: Scene,
		segments: readonly RoadSegment[]): void
	{
		if (segments.length === 0)
		{
			return;
		}

		this.boostMaterial =
			new StandardMaterial("boost-mat", scene);
		this.boostMaterial.diffuseColor =
			BOOST_PAD_COLOR.clone();
		this.boostMaterial.emissiveColor =
			BOOST_PAD_EMISSIVE.clone();

		const chevronMat: StandardMaterial =
			new StandardMaterial("boost-chevron-mat", scene);
		chevronMat.diffuseColor =
			BOOST_CHEVRON_COLOR.clone();
		chevronMat.emissiveColor =
			BOOST_CHEVRON_COLOR.scale(0.3);
		this.meshes.push(chevronMat as unknown as Mesh);

		for (let padIdx: number = 0; padIdx < BOOST_PAD_COUNT; padIdx++)
		{
			const segIdx: number =
				Math.floor(
					segments.length * (padIdx + 1) / (BOOST_PAD_COUNT + 1));
			const segment: RoadSegment =
				segments[Math.min(segIdx, segments.length - 1)];

			const padMesh: Mesh =
				MeshBuilder.CreateBox(
					`boost-pad-${padIdx}`,
					{
						width: BOOST_PAD_WIDTH,
						height: 0.15,
						depth: BOOST_PAD_LENGTH
					},
					scene);

			padMesh.position.x =
				segment.positionX;
			padMesh.position.y =
				segment.elevation + 0.3;
			padMesh.position.z =
				segment.positionZ;
			padMesh.rotation.y =
				segment.rotationY;
			padMesh.material =
				this.boostMaterial;
			this.meshes.push(padMesh);

			for (let chevIdx: number = 0; chevIdx < 3; chevIdx++)
			{
				const chevron: Mesh =
					MeshBuilder.CreateBox(
						`boost-chevron-${padIdx}-${chevIdx}`,
						{
							width: BOOST_PAD_WIDTH * 0.6,
							height: 0.02,
							depth: 0.5
						},
						scene);

				const zOffset: number =
					(chevIdx - 1) * (BOOST_PAD_LENGTH / 3);
				chevron.position.x =
					segment.positionX + Math.sin(segment.rotationY) * zOffset;
				chevron.position.y =
					segment.elevation + 0.45;
				chevron.position.z =
					segment.positionZ + Math.cos(segment.rotationY) * zOffset;
				chevron.rotation.y =
					segment.rotationY;
				chevron.material = chevronMat;
				this.meshes.push(chevron);
			}

			this.pads.push(
				{
					positionX: segment.positionX,
					positionZ: segment.positionZ,
					rotationY: segment.rotationY,
					triggerRadius: BOOST_TRIGGER_RADIUS
				});
		}
	}

	/**
	 * Get the current boost pad definitions (for testing).
	 * @returns
	 * Array of boost pads.
	 */
	getPads(): readonly BoostPad[]
	{
		return this.pads;
	}

	/**
	 * Check if kart position triggers a boost pad.
	 * Each pad can only trigger once per session — driving over the same
	 * pad across multiple frames will not re-fire.
	 * @param posX
	 * Kart world X position.
	 * @param posZ
	 * Kart world Z position.
	 * @returns
	 * True if a new boost was activated.
	 */
	checkBoostTrigger(
		posX: number,
		posZ: number): boolean
	{
		for (let padIdx: number = 0; padIdx < this.pads.length; padIdx++)
		{
			if (this.triggeredPadIndices.has(padIdx))
			{
				continue;
			}

			const pad: BoostPad =
				this.pads[padIdx];
			const dx: number =
				posX - pad.positionX;
			const dz: number =
				posZ - pad.positionZ;
			const distSq: number =
				dx * dx + dz * dz;

			if (distSq <= pad.triggerRadius * pad.triggerRadius)
			{
				this.triggeredPadIndices.add(padIdx);
				this.boostCount++;

				this._boostState.set(
					{
						isActive: true,
						remainingSeconds: 0
					});

				return true;
			}
		}

		return false;
	}

	/**
	 * Deactivate boost immediately (called on wall/bumper hit).
	 * Resets boost count so next pad starts from first-boost speed.
	 */
	deactivateBoost(): void
	{
		this.boostCount = 0;
		this._boostState.set(
			{
				isActive: false,
				remainingSeconds: 0
			});
	}

	/**
	 * Tick boost timer each frame.
	 * @param deltaTime
	 * Frame delta time in seconds.
	 */
	/**
	 * No-op — boost now persists until wall hit.
	 * Kept for API compatibility with the game loop.
	 * @param _deltaTime
	 * Frame delta time in seconds (unused).
	 */
	updateBoost(_deltaTime: number): void
	{
		// Boost persists until deactivateBoost() is called on wall hit.
	}

	/**
	 * Get effective max speed considering boost state.
	 * Each boost pad adds BOOST_INCREMENT_MPH to the base max speed.
	 * @returns
	 * Max speed in mph.
	 */
	getEffectiveMaxSpeedMph(): number
	{
		if (!this._boostState().isActive || this.boostCount === 0)
		{
			return MAX_SPEED_MPH;
		}

		return MAX_SPEED_MPH + this.boostCount * BOOST_INCREMENT_MPH;
	}

	/**
	 * Reset boost state and triggered pads for race restart.
	 */
	reset(): void
	{
		this._boostState.set(
			{
				isActive: false,
				remainingSeconds: 0
			});

		this.triggeredPadIndices.clear();
		this.boostCount = 0;
	}

	/**
	 * Dispose all boost pad meshes and materials.
	 */
	dispose(): void
	{
		for (const mesh of this.meshes)
		{
			mesh.dispose();
		}

		this.meshes.length = 0;

		if (this.boostMaterial != null)
		{
			this.boostMaterial.dispose();
			this.boostMaterial = null;
		}

		this.pads = [];
		this.reset();
	}
}