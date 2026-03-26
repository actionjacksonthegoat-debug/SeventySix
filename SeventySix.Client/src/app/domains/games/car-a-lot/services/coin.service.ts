/**
 * Coin Service.
 * Manages coin placement, collection detection, and spinning animation on the track.
 */

import { Injectable, Signal, signal, WritableSignal } from "@angular/core";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { Scene } from "@babylonjs/core/scene";
import {
	COIN_COLLECT_RADIUS,
	COIN_COLOR,
	COIN_COUNT,
	COIN_DIAMETER,
	COIN_EMISSIVE_COLOR,
	COIN_FLOAT_HEIGHT,
	COIN_ROTATION_SPEED
} from "@games/car-a-lot/constants/car-a-lot.constants";
import { RoadSegment, TrackCoin } from "@games/car-a-lot/models/car-a-lot.models";

/**
 * Manages collectible coins placed along the track.
 * Domain-scoped — provided via route `providers` array.
 */
@Injectable()
export class CoinService
{
	/** Number of coins collected in current race. */
	private readonly _coinsCollected: WritableSignal<number> =
		signal(0);

	/** Total coins on the track. */
	private readonly _totalCoins: WritableSignal<number> =
		signal(0);

	/** Read-only signal for coins collected. */
	readonly coinsCollected: Signal<number> =
		this._coinsCollected.asReadonly();

	/** Read-only signal for total coins. */
	readonly totalCoins: Signal<number> =
		this._totalCoins.asReadonly();

	/** Internal coin state array. */
	private coins: TrackCoin[] = [];

	/** Coin meshes for animation and disposal. */
	private readonly meshes: Mesh[] = [];

	/** Shared coin material. */
	private coinMaterial: StandardMaterial | null = null;

	/**
	 * Place coins evenly along track segments.
	 * @param scene
	 * The Babylon.js Scene.
	 * @param segments
	 * Track road segments to distribute coins across.
	 */
	placeCoins(
		scene: Scene,
		segments: readonly RoadSegment[]): void
	{
		if (segments.length === 0)
		{
			return;
		}

		this.coinMaterial =
			this.createCoinMaterial(scene);

		const spacing: number =
			Math.max(1, Math.floor(segments.length / COIN_COUNT));

		for (let coinIdx: number = 0; coinIdx < COIN_COUNT; coinIdx++)
		{
			const segIdx: number =
				Math.min(
					coinIdx * spacing,
					segments.length - 1);
			const segment: RoadSegment =
				segments[segIdx];

			const mesh: Mesh =
				MeshBuilder.CreateCylinder(
					`coin-${coinIdx}`,
					{
						diameter: COIN_DIAMETER,
						height: 0.2,
						tessellation: 16
					},
					scene);

			mesh.position.x =
				segment.positionX;
			mesh.position.y =
				segment.elevation + COIN_FLOAT_HEIGHT;
			mesh.position.z =
				segment.positionZ;
			mesh.rotation.x =
				Math.PI / 2;
			mesh.material =
				this.coinMaterial;

			this.meshes.push(mesh);
			this.coins.push(
				{
					positionX: segment.positionX,
					positionZ: segment.positionZ,
					collected: false,
					meshIndex: coinIdx
				});
		}

		this._totalCoins.set(COIN_COUNT);
	}

	/**
	 * Create the shared coin material.
	 * @param scene
	 * The Babylon.js Scene.
	 * @returns
	 * A configured StandardMaterial for coins.
	 */
	private createCoinMaterial(scene: Scene): StandardMaterial
	{
		const material: StandardMaterial =
			new StandardMaterial("coin-mat", scene);
		material.diffuseColor =
			COIN_COLOR.clone();
		material.emissiveColor =
			COIN_EMISSIVE_COLOR.clone();
		material.specularPower = 64;

		return material;
	}

	/**
	 * Get the current coin state array (for testing).
	 * @returns
	 * Array of track coins.
	 */
	getCoins(): readonly TrackCoin[]
	{
		return this.coins;
	}

	/**
	 * Check if kart position collects any nearby coins.
	 * @param posX
	 * Kart world X position.
	 * @param posZ
	 * Kart world Z position.
	 * @returns
	 * True if a coin was collected this check.
	 */
	checkCollection(
		posX: number,
		posZ: number): boolean
	{
		for (const coin of this.coins)
		{
			if (coin.collected)
			{
				continue;
			}

			const dx: number =
				posX - coin.positionX;
			const dz: number =
				posZ - coin.positionZ;
			const distSq: number =
				dx * dx + dz * dz;

			if (distSq <= COIN_COLLECT_RADIUS * COIN_COLLECT_RADIUS)
			{
				coin.collected = true;

				const mesh: Mesh | undefined =
					this.meshes[coin.meshIndex];

				if (mesh != null)
				{
					mesh.setEnabled(false);
				}

				this._coinsCollected.update(
					(count) => count + 1);

				return true;
			}
		}

		return false;
	}

	/**
	 * Animate coin rotation each frame.
	 * @param deltaTime
	 * Frame delta time in seconds.
	 */
	updateAnimation(deltaTime: number): void
	{
		const rotationDelta: number =
			COIN_ROTATION_SPEED * deltaTime;

		for (let meshIdx: number = 0; meshIdx < this.meshes.length; meshIdx++)
		{
			if (this.coins[meshIdx]?.collected !== true)
			{
				this.meshes[meshIdx].rotation.y += rotationDelta;
			}
		}
	}

	/**
	 * Reset all coins for race restart.
	 */
	reset(): void
	{
		for (const coin of this.coins)
		{
			coin.collected = false;

			const mesh: Mesh | undefined =
				this.meshes[coin.meshIndex];

			if (mesh != null)
			{
				mesh.setEnabled(true);
			}
		}

		this._coinsCollected.set(0);
	}

	/**
	 * Dispose all coin meshes and material.
	 */
	dispose(): void
	{
		for (const mesh of this.meshes)
		{
			mesh.dispose();
		}

		this.meshes.length = 0;

		if (this.coinMaterial != null)
		{
			this.coinMaterial.dispose();
			this.coinMaterial = null;
		}

		this.coins = [];
		this._coinsCollected.set(0);
		this._totalCoins.set(0);
	}
}