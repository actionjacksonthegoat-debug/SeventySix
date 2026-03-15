/**
 * Boost Service unit tests.
 * Tests boost pad placement, trigger detection, count-based stacking, and deactivation.
 */

import { provideZonelessChangeDetection } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { NullEngine } from "@babylonjs/core/Engines/nullEngine";
import { Scene } from "@babylonjs/core/scene";
import {
	BOOST_INCREMENT_MPH,
	BOOST_PAD_COUNT,
	MAX_SPEED_MPH
} from "@games/car-a-lot/constants/car-a-lot.constants";
import { RoadSegment } from "@games/car-a-lot/models/car-a-lot.models";
import { BoostService } from "./boost.service";

describe("BoostService",
	() =>
	{
		let service: BoostService;
		let scene: Scene;
		let engine: NullEngine;

		beforeEach(
			() =>
			{
				TestBed.configureTestingModule(
					{
						providers: [
							provideZonelessChangeDetection(),
							BoostService
						]
					});

				service =
					TestBed.inject(BoostService);
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

		describe("Boost Pad Placement",
			() =>
			{
				it("should place boost pads on track segments",
					() =>
					{
						const segments: RoadSegment[] =
							createTestSegments();

						service.placeBoostPads(
							scene,
							segments);

						expect(service.getPads().length)
							.toBe(BOOST_PAD_COUNT);
					});
			});

		describe("Boost Trigger — Count-Based Stacking",
			() =>
			{
				it("should add 10 mph on first boost",
					() =>
					{
						const segments: RoadSegment[] =
							createTestSegments();

						service.placeBoostPads(
							scene,
							segments);

						const pads: ReturnType<typeof service.getPads> =
							service.getPads();

						service.checkBoostTrigger(
							pads[0].positionX,
							pads[0].positionZ);

						expect(service.isBoostActive())
							.toBe(true);
						expect(service.getEffectiveMaxSpeedMph())
							.toBe(MAX_SPEED_MPH + BOOST_INCREMENT_MPH);
					});

				it("should add 20 mph on second boost",
					() =>
					{
						const segments: RoadSegment[] =
							createTestSegments();

						service.placeBoostPads(
							scene,
							segments);

						const pads: ReturnType<typeof service.getPads> =
							service.getPads();

						service.checkBoostTrigger(
							pads[0].positionX,
							pads[0].positionZ);
						service.checkBoostTrigger(
							pads[1].positionX,
							pads[1].positionZ);

						expect(service.getEffectiveMaxSpeedMph())
							.toBe(MAX_SPEED_MPH + 2 * BOOST_INCREMENT_MPH);
					});

				it("should add 50 mph on fifth boost",
					() =>
					{
						const segments: RoadSegment[] =
							createTestSegments();

						service.placeBoostPads(
							scene,
							segments);

						const pads: ReturnType<typeof service.getPads> =
							service.getPads();

						for (let idx: number = 0; idx < 5; idx++)
						{
							service.checkBoostTrigger(
								pads[idx].positionX,
								pads[idx].positionZ);
						}

						expect(service.getEffectiveMaxSpeedMph())
							.toBe(MAX_SPEED_MPH + 5 * BOOST_INCREMENT_MPH);
					});

				it("should return normal max speed when no boost active",
					() =>
					{
						expect(service.getEffectiveMaxSpeedMph())
							.toBe(MAX_SPEED_MPH);
					});

				it("should calculate boost independent of current speed",
					() =>
					{
						const segments: RoadSegment[] =
							createTestSegments();

						service.placeBoostPads(
							scene,
							segments);

						const pads: ReturnType<typeof service.getPads> =
							service.getPads();

						service.checkBoostTrigger(
							pads[0].positionX,
							pads[0].positionZ);

						expect(service.getEffectiveMaxSpeedMph())
							.toBe(MAX_SPEED_MPH + BOOST_INCREMENT_MPH);
					});

				it("should not re-trigger same pad twice",
					() =>
					{
						const segments: RoadSegment[] =
							createTestSegments();

						service.placeBoostPads(
							scene,
							segments);

						const pads: ReturnType<typeof service.getPads> =
							service.getPads();

						const firstTrigger: boolean =
							service.checkBoostTrigger(
								pads[0].positionX,
								pads[0].positionZ);
						const secondTrigger: boolean =
							service.checkBoostTrigger(
								pads[0].positionX,
								pads[0].positionZ);

						expect(firstTrigger)
							.toBe(true);
						expect(secondTrigger)
							.toBe(false);
						expect(service.getEffectiveMaxSpeedMph())
							.toBe(MAX_SPEED_MPH + BOOST_INCREMENT_MPH);
					});
			});

		describe("Boost Deactivation",
			() =>
			{
				it("should reset to normal max speed on bumper hit",
					() =>
					{
						const segments: RoadSegment[] =
							createTestSegments();

						service.placeBoostPads(
							scene,
							segments);

						const pads: ReturnType<typeof service.getPads> =
							service.getPads();

						service.checkBoostTrigger(
							pads[0].positionX,
							pads[0].positionZ);
						service.checkBoostTrigger(
							pads[1].positionX,
							pads[1].positionZ);

						expect(service.isBoostActive())
							.toBe(true);

						service.deactivateBoost();

						expect(service.isBoostActive())
							.toBe(false);
						expect(service.getEffectiveMaxSpeedMph())
							.toBe(MAX_SPEED_MPH);
					});

				it("should restart boost count after bumper reset",
					() =>
					{
						const segments: RoadSegment[] =
							createTestSegments();

						service.placeBoostPads(
							scene,
							segments);

						const pads: ReturnType<typeof service.getPads> =
							service.getPads();

						service.checkBoostTrigger(
							pads[0].positionX,
							pads[0].positionZ);
						service.checkBoostTrigger(
							pads[1].positionX,
							pads[1].positionZ);

						service.deactivateBoost();

						service.checkBoostTrigger(
							pads[2].positionX,
							pads[2].positionZ);

						expect(service.isBoostActive())
							.toBe(true);
						expect(service.getEffectiveMaxSpeedMph())
							.toBe(MAX_SPEED_MPH + BOOST_INCREMENT_MPH);
					});

				it("should persist boost through updateBoost calls",
					() =>
					{
						const segments: RoadSegment[] =
							createTestSegments();

						service.placeBoostPads(
							scene,
							segments);

						const pads: ReturnType<typeof service.getPads> =
							service.getPads();

						service.checkBoostTrigger(
							pads[0].positionX,
							pads[0].positionZ);

						service.updateBoost(10);

						expect(service.isBoostActive())
							.toBe(true);
					});
			});

		describe("Reset",
			() =>
			{
				it("should reset boost state on race restart",
					() =>
					{
						const segments: RoadSegment[] =
							createTestSegments();

						service.placeBoostPads(
							scene,
							segments);

						const pads: ReturnType<typeof service.getPads> =
							service.getPads();

						service.checkBoostTrigger(
							pads[0].positionX,
							pads[0].positionZ);

						expect(service.isBoostActive())
							.toBe(true);

						service.reset();

						expect(service.isBoostActive())
							.toBe(false);
						expect(service.getEffectiveMaxSpeedMph())
							.toBe(MAX_SPEED_MPH);
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
				isFork: false,
				elevation: 0
			});
	}

	return segments;
}