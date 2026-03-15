import { provideZonelessChangeDetection } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { FreeCamera } from "@babylonjs/core/Cameras/freeCamera";
import { NullEngine } from "@babylonjs/core/Engines/nullEngine";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Scene } from "@babylonjs/core/scene";
import { GameLifecycleState } from "@games/shared/models/game.models";
import { GameLoopService } from "@games/shared/services/game-loop.service";

describe("GameLoopService",
	() =>
	{
		let service: GameLoopService;
		let engine: NullEngine;
		let scene: Scene;

		beforeEach(
			() =>
			{
				TestBed.configureTestingModule(
					{
						providers: [
							provideZonelessChangeDetection(),
							GameLoopService
						]
					});

				service =
					TestBed.inject(GameLoopService);

				engine =
					new NullEngine();
				scene =
					new Scene(engine);

				const camera: FreeCamera =
					new FreeCamera("testCam", Vector3.Zero(), scene);
				scene.activeCamera = camera;
			});

		afterEach(
			() =>
			{
				scene.dispose();
				engine.dispose();
			});

		it("should create",
			() =>
			{
				expect(service)
					.toBeTruthy();
			});

		it("should start in Initializing state",
			() =>
			{
				expect(service.state())
					.toBe(GameLifecycleState.Initializing);
			});

		it("should transition to Ready after initialize",
			() =>
			{
				service.initialize(scene);

				expect(service.state())
					.toBe(GameLifecycleState.Ready);
			});

		it("should transition to Running after start",
			() =>
			{
				service.initialize(scene);
				service.start();

				expect(service.state())
					.toBe(GameLifecycleState.Running);
			});

		it("should transition to Paused after pause",
			() =>
			{
				service.initialize(scene);
				service.start();
				service.pause();

				expect(service.state())
					.toBe(GameLifecycleState.Paused);
			});

		it("should resume to Running from Paused",
			() =>
			{
				service.initialize(scene);
				service.start();
				service.pause();
				service.start();

				expect(service.state())
					.toBe(GameLifecycleState.Running);
			});

		it("should transition to Disposed after dispose",
			() =>
			{
				service.initialize(scene);
				service.start();
				service.dispose();

				expect(service.state())
					.toBe(GameLifecycleState.Disposed);
			});

		it("should call onUpdate callback each frame when running",
			() =>
			{
				const updateSpy: ReturnType<typeof vi.fn> =
					vi.fn();

				service.onUpdate = updateSpy;
				service.initialize(scene);
				service.start();

				scene.render();

				expect(updateSpy)
					.toHaveBeenCalled();
			});

		it("should not call onUpdate when paused",
			() =>
			{
				const updateSpy: ReturnType<typeof vi.fn> =
					vi.fn();

				service.onUpdate = updateSpy;
				service.initialize(scene);
				service.start();
				service.pause();

				scene.render();

				expect(updateSpy)
					.not
					.toHaveBeenCalled();
			});

		it("should clean up observer on dispose",
			() =>
			{
				service.initialize(scene);
				service.start();

				const updateSpy: ReturnType<typeof vi.fn> =
					vi.fn();
				service.onUpdate = updateSpy;

				service.dispose();

				scene.render();

				expect(updateSpy)
					.not
					.toHaveBeenCalled();
			});

		it("should not throw when disposing without initialization",
			() =>
			{
				expect(() => service.dispose())
					.not
					.toThrow();
			});

		it("should not allow start without initialization",
			() =>
			{
				expect(() => service.start())
					.toThrow();
			});
	});