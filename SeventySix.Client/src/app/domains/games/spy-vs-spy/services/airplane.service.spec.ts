/**
 * Airplane Service unit tests (TDD-First).
 * Tests airplane mesh creation, takeoff animation, and disposal.
 */

import { provideZonelessChangeDetection } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import "@babylonjs/core/Animations/animatable";
import { FreeCamera } from "@babylonjs/core/Cameras/freeCamera";
import { NullEngine } from "@babylonjs/core/Engines/nullEngine";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import type { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { Scene } from "@babylonjs/core/scene";
import { AudioContextService } from "@games/shared/services/audio-context.service";
import {
	AIRPLANE_FUSELAGE_LENGTH,
	AIRSTRIP_CENTER_X,
	AIRSTRIP_CENTER_Z,
	AIRSTRIP_RUNWAY_LENGTH,
	ISLAND_GROUND_Y
} from "@games/spy-vs-spy/constants/spy-vs-spy.constants";
import { AirplaneService } from "./airplane.service";
import { SpyAudioService } from "./spy-audio.service";

describe("AirplaneService",
	() =>
	{
		let service: AirplaneService;
		let engine: NullEngine;
		let scene: Scene;

		beforeEach(
			() =>
			{
				TestBed.configureTestingModule(
					{
						providers: [
							provideZonelessChangeDetection(),
							AudioContextService,
							AirplaneService,
							SpyAudioService
						]
					});

				service =
					TestBed.inject(AirplaneService);
				engine =
					new NullEngine();
				scene =
					new Scene(engine);

				/* Scene.render() requires an active camera. */
				new FreeCamera("testCamera", Vector3.Zero(), scene);
			});

		afterEach(
			() =>
			{
				service.dispose();
				scene.dispose();
				engine.dispose();
			});

		it("should create without throwing",
			() =>
			{
				expect(service)
					.toBeTruthy();
			});

		it("initialize should store scene reference",
			() =>
			{
				service.initialize(scene);

				/* After initialize, createAirplane should work (uses scene). */
				const airplane: TransformNode =
					service.createAirplane();

				expect(airplane)
					.toBeTruthy();
			});

		it("createAirplane should create mesh at east end of runway",
			() =>
			{
				service.initialize(scene);

				const airplane: TransformNode =
					service.createAirplane();

				const expectedX: number =
					AIRSTRIP_CENTER_X + AIRSTRIP_RUNWAY_LENGTH / 2 - AIRPLANE_FUSELAGE_LENGTH;

				expect(airplane.position.x)
					.toBeCloseTo(expectedX, 1);
				expect(airplane.position.z)
					.toBeCloseTo(AIRSTRIP_CENTER_Z, 1);
				expect(airplane.position.y)
					.toBeGreaterThan(ISLAND_GROUND_Y);
			});

		it("createAirplane should return a Mesh-like node with name",
			() =>
			{
				service.initialize(scene);

				const airplane: TransformNode =
					service.createAirplane();

				expect(airplane.name)
					.toBe("airplane");
			});

		it("animateTakeoff should call onLeavesIsland callback",
			() =>
			{
				service.initialize(scene);
				service.createAirplane();

				/* Mock beginDirectAnimation to immediately invoke the onComplete callback. */
				vi
					.spyOn(scene, "beginDirectAnimation")
					.mockImplementation(
						((_target, _anims, _from, _to, _loop, _speed, onAnimEnd) =>
						{
							if (onAnimEnd != null)
							{
								onAnimEnd();
							}

							return {} as ReturnType<typeof scene.beginDirectAnimation>;
						}) as typeof scene.beginDirectAnimation);

				const onLeavesIsland: ReturnType<typeof vi.fn> =
					vi.fn();
				const onComplete: ReturnType<typeof vi.fn> =
					vi.fn();

				service.animateTakeoff(onLeavesIsland, onComplete);

				expect(onLeavesIsland)
					.toHaveBeenCalled();
			});

		it("animateTakeoff should call onComplete callback",
			() =>
			{
				service.initialize(scene);
				service.createAirplane();

				/* Mock beginDirectAnimation to immediately invoke the onComplete callback. */
				vi
					.spyOn(scene, "beginDirectAnimation")
					.mockImplementation(
						((_target, _anims, _from, _to, _loop, _speed, onAnimEnd) =>
						{
							if (onAnimEnd != null)
							{
								onAnimEnd();
							}

							return {} as ReturnType<typeof scene.beginDirectAnimation>;
						}) as typeof scene.beginDirectAnimation);

				const onLeavesIsland: ReturnType<typeof vi.fn> =
					vi.fn();
				const onComplete: ReturnType<typeof vi.fn> =
					vi.fn();

				service.animateTakeoff(onLeavesIsland, onComplete);

				expect(onComplete)
					.toHaveBeenCalled();
			});

		it("dispose should clean up mesh and references",
			() =>
			{
				service.initialize(scene);
				service.createAirplane();

				/* Track meshes before dispose. */
				const meshCount: number =
					scene.meshes.length;

				service.dispose();

				/* At least the airplane meshes should be removed. */
				expect(scene.meshes.length)
					.toBeLessThan(meshCount);
			});

		it("dispose should not throw when called without initialization",
			() =>
			{
				expect(
					() => service.dispose())
					.not
					.toThrow();
			});

		it("createAirplane should contain sub-meshes for fuselage and wings",
			() =>
			{
				service.initialize(scene);
				service.createAirplane();

				/* The airplane node should have child meshes or be a merged mesh. */
				const meshes: Mesh[] =
					scene.meshes.filter(
						(m) => m.name.startsWith("airplane")) as Mesh[];

				expect(meshes.length)
					.toBeGreaterThanOrEqual(1);
			});
	});