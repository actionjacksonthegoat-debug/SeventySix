/**
 * Race Camera Service unit tests.
 * Tests camera creation, smooth following, and heading tracking.
 */

import { provideZonelessChangeDetection } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { NullEngine } from "@babylonjs/core/Engines/nullEngine";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Scene } from "@babylonjs/core/scene";
import { RaceCameraService } from "@games/car-a-lot/services/race-camera.service";

describe("RaceCameraService",
	() =>
	{
		let service: RaceCameraService;
		let engine: NullEngine;
		let scene: Scene;

		beforeEach(
			() =>
			{
				TestBed.configureTestingModule(
					{
						providers: [
							provideZonelessChangeDetection(),
							RaceCameraService
						]
					});

				service =
					TestBed.inject(RaceCameraService);
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

		it("should create a camera in the scene",
			() =>
			{
				service.initialize(scene);

				expect(scene.activeCamera)
					.toBeTruthy();
			});

		it("should position camera behind and above origin",
			() =>
			{
				service.initialize(scene);

				expect(scene.activeCamera!.position.y)
					.toBeGreaterThan(0);
			});

		it("should update camera position toward kart",
			() =>
			{
				service.initialize(scene);

				const kartPos: Vector3 =
					new Vector3(5, 0, 10);

				service.updateCamera(kartPos, 0, 0.5);

				expect(scene.activeCamera!.position.x)
					.not
					.toBe(0);
			});

		it("should follow kart heading changes",
			() =>
			{
				service.initialize(scene);

				service.updateCamera(
					Vector3.Zero(),
					Math.PI / 2,
					1.0);

				expect(scene.activeCamera!.position.x)
					.not
					.toBe(0);
			});

		it("should dispose camera on cleanup",
			() =>
			{
				service.initialize(scene);
				service.dispose();

				expect(scene.activeCamera)
					.toBeNull();
			});
	});