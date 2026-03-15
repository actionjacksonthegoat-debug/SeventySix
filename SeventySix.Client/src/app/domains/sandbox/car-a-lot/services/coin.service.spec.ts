/**
 * Coin Service unit tests.
 * Tests coin placement, collection detection, and animation.
 */

import { provideZonelessChangeDetection } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { NullEngine } from "@babylonjs/core/Engines/nullEngine";
import { Scene } from "@babylonjs/core/scene";
import {
	COIN_COUNT
} from "@sandbox/car-a-lot/constants/car-a-lot.constants";
import { RoadSegment } from "@sandbox/car-a-lot/models/car-a-lot.models";
import { CoinService } from "./coin.service";

describe("CoinService",
	() =>
	{
		let service: CoinService;
		let scene: Scene;
		let engine: NullEngine;

		beforeEach(
			() =>
			{
				TestBed.configureTestingModule(
					{
						providers: [
							provideZonelessChangeDetection(),
							CoinService
						]
					});

				service =
					TestBed.inject(CoinService);
				engine =
					new NullEngine();
				scene =
					new Scene(engine);
			});

		afterEach(
			() =>
			{
				service.dispose();
				scene.dispose();
				engine.dispose();
			});

		describe("Coin Placement",
			() =>
			{
				it("should place coins along track segments",
					() =>
					{
						const segments: RoadSegment[] =
							createTestSegments();

						service.placeCoins(
							scene,
							segments);

						expect(service.totalCoins())
							.toBe(COIN_COUNT);
					});
			});

		describe("Coin Collection",
			() =>
			{
				it("should detect coin collection within radius",
					() =>
					{
						const segments: RoadSegment[] =
							createTestSegments();

						service.placeCoins(
							scene,
							segments);

						const coins: ReturnType<typeof service.getCoins> =
							service.getCoins();
						const firstCoin: { positionX: number; positionZ: number; } =
							coins[0];

						const collected: boolean =
							service.checkCollection(
								firstCoin.positionX,
								firstCoin.positionZ);

						expect(collected)
							.toBe(true);
						expect(service.coinsCollected())
							.toBe(1);
					});

				it("should not collect already-collected coin",
					() =>
					{
						const segments: RoadSegment[] =
							createTestSegments();

						service.placeCoins(
							scene,
							segments);

						const coins: ReturnType<typeof service.getCoins> =
							service.getCoins();
						const firstCoin: { positionX: number; positionZ: number; } =
							coins[0];

						service.checkCollection(
							firstCoin.positionX,
							firstCoin.positionZ);

						const secondCollect: boolean =
							service.checkCollection(
								firstCoin.positionX,
								firstCoin.positionZ);

						expect(secondCollect)
							.toBe(false);
						expect(service.coinsCollected())
							.toBe(1);
					});

				it("should not collect coin outside radius",
					() =>
					{
						const segments: RoadSegment[] =
							createTestSegments();

						service.placeCoins(
							scene,
							segments);

						const collected: boolean =
							service.checkCollection(
								-9999,
								-9999);

						expect(collected)
							.toBe(false);
						expect(service.coinsCollected())
							.toBe(0);
					});

				it("should return total collected count",
					() =>
					{
						const segments: RoadSegment[] =
							createTestSegments();

						service.placeCoins(
							scene,
							segments);

						const coins: ReturnType<typeof service.getCoins> =
							service.getCoins();

						service.checkCollection(
							coins[0].positionX,
							coins[0].positionZ);

						service.checkCollection(
							coins[1].positionX,
							coins[1].positionZ);

						expect(service.coinsCollected())
							.toBe(2);
					});
			});

		describe("Reset",
			() =>
			{
				it("should reset all coins on race restart",
					() =>
					{
						const segments: RoadSegment[] =
							createTestSegments();

						service.placeCoins(
							scene,
							segments);

						const coins: ReturnType<typeof service.getCoins> =
							service.getCoins();

						service.checkCollection(
							coins[0].positionX,
							coins[0].positionZ);

						expect(service.coinsCollected())
							.toBe(1);

						service.reset();

						expect(service.coinsCollected())
							.toBe(0);
					});
			});
	});

function createTestSegments(): RoadSegment[]
{
	const segments: RoadSegment[] = [];

	for (let segIndex: number = 0; segIndex < 30; segIndex++)
	{
		segments.push(
			{
				positionX: 0,
				positionZ: segIndex * 30,
				length: 30,
				rotationY: 0,
				isFork: false
			});
	}

	return segments;
}