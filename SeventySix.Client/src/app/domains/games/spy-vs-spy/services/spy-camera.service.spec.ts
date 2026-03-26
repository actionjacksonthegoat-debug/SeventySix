/**
 * Spy Camera Service unit tests.
 * Tests camera creation, tracking, and disposal.
 */

import { provideZonelessChangeDetection } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import "@babylonjs/core/Animations/animatable";
import { Animatable } from "@babylonjs/core/Animations/animatable";
import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import { NullEngine } from "@babylonjs/core/Engines/nullEngine";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { Scene } from "@babylonjs/core/scene";
import {
	CAMERA_HEIGHT,
	CAMERA_PITCH_DEGREES,
	CAMERA_TARGET_Y_OFFSET
} from "@games/spy-vs-spy/constants/spy-vs-spy.constants";
import { SpyCameraService } from "./spy-camera.service";

describe("SpyCameraService",
	() =>
	{
		let service: SpyCameraService;
		let engine: NullEngine;
		let scene: Scene;

		beforeEach(
			() =>
			{
				TestBed.configureTestingModule(
					{
						providers: [
							provideZonelessChangeDetection(),
							SpyCameraService
						]
					});

				service =
					TestBed.inject(SpyCameraService);
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

		it("should create without throwing",
			() =>
			{
				expect(service)
					.toBeTruthy();
			});

		it("initialize should create a camera in the scene",
			() =>
			{
				service.initialize(scene);

				expect(scene.activeCamera)
					.toBeTruthy();
			});

		it("camera should be an ArcRotateCamera",
			() =>
			{
				service.initialize(scene);

				expect(scene.activeCamera)
					.toBeInstanceOf(ArcRotateCamera);
			});

		it("camera radius should equal CAMERA_HEIGHT",
			() =>
			{
				service.initialize(scene);

				const camera: ArcRotateCamera =
					scene.activeCamera as ArcRotateCamera;

				expect(camera.radius)
					.toBe(CAMERA_HEIGHT);
			});

		it("camera beta should match CAMERA_PITCH_DEGREES",
			() =>
			{
				service.initialize(scene);

				const expectedBeta: number =
					CAMERA_PITCH_DEGREES * Math.PI / 180;
				const camera: ArcRotateCamera =
					scene.activeCamera as ArcRotateCamera;

				expect(camera.beta)
					.toBeCloseTo(expectedBeta, 5);
			});

		it("camera position.y should reflect radius and beta plus target offset",
			() =>
			{
				service.initialize(scene);

				const expectedBeta: number =
					CAMERA_PITCH_DEGREES * Math.PI / 180;
				const expectedY: number =
					CAMERA_HEIGHT * Math.cos(expectedBeta) + CAMERA_TARGET_Y_OFFSET;

				expect(scene.activeCamera!.position.y)
					.toBeCloseTo(expectedY, 1);
			});

		it("initialize with target should set camera target to target position",
			() =>
			{
				const targetNode: TransformNode =
					new TransformNode("spy", scene);
				targetNode.position =
					new Vector3(10, 0, -20);

				service.initialize(scene, targetNode);

				const camera: ArcRotateCamera =
					scene.activeCamera as ArcRotateCamera;

				expect(camera.target.x)
					.toBeCloseTo(10, 1);
				expect(camera.target.z)
					.toBeCloseTo(-20, 1);
			});

		it("initialize without target should default to zero",
			() =>
			{
				service.initialize(scene);

				const camera: ArcRotateCamera =
					scene.activeCamera as ArcRotateCamera;

				expect(camera.target.x)
					.toBe(0);
				expect(camera.target.z)
					.toBe(0);
			});

		it("updateTarget should move camera target to spy position",
			() =>
			{
				service.initialize(scene);

				const spyNode: TransformNode =
					new TransformNode("spy-move", scene);
				spyNode.position =
					new Vector3(15, 0, -10);

				service.updateTarget(spyNode);

				const camera: ArcRotateCamera =
					scene.activeCamera as ArcRotateCamera;

				expect(camera.target.x)
					.toBeCloseTo(15, 1);
				expect(camera.target.z)
					.toBeCloseTo(-10, 1);
			});

		it("updateTarget should not throw when called before initialize",
			() =>
			{
				const spyNode: TransformNode =
					new TransformNode("spy-safe", scene);

				expect(
					() => service.updateTarget(spyNode))
					.not
					.toThrow();
			});

		it("dispose should not throw",
			() =>
			{
				service.initialize(scene);

				expect(() => service.dispose())
					.not
					.toThrow();
			});

		it("dispose should clear the active camera",
			() =>
			{
				service.initialize(scene);
				service.dispose();

				expect(scene.activeCamera)
					.toBeNull();
			});

		describe("focusOnAirplane",
			() =>
			{
				it("should set camera target to airplane position",
					() =>
					{
						service.initialize(scene);

						const airplane: TransformNode =
							new TransformNode("airplane", scene);
						airplane.position =
							new Vector3(5, 2, 38);

						vi
							.spyOn(scene, "beginDirectAnimation")
							.mockImplementation(
								(_target, _animations, _from, _to, _loop, _speed, onEnd) =>
								{
									if (onEnd != null)
									{
										onEnd();
									}

									return null as unknown as Animatable;
								});

						service.focusOnAirplane(airplane);

						const camera: ArcRotateCamera =
							scene.activeCamera as ArcRotateCamera;

						expect(camera.target.x)
							.toBeCloseTo(5, 1);
						expect(camera.target.z)
							.toBeCloseTo(38, 1);
					});

				it("should position camera behind and above airplane",
					() =>
					{
						service.initialize(scene);

						const airplane: TransformNode =
							new TransformNode("airplane", scene);
						airplane.position =
							new Vector3(5, 2, 38);

						vi
							.spyOn(scene, "beginDirectAnimation")
							.mockImplementation(
								(_target, _animations, _from, _to, _loop, _speed, onEnd) =>
								{
									if (onEnd != null)
									{
										onEnd();
									}

									return null as unknown as Animatable;
								});

						service.focusOnAirplane(airplane);

						const camera: ArcRotateCamera =
							scene.activeCamera as ArcRotateCamera;

						expect(camera.position.y)
							.toBeGreaterThan(airplane.position.y);
					});

				it("should not throw when called before initialize",
					() =>
					{
						const airplane: TransformNode =
							new TransformNode("airplane", scene);

						expect(
							() => service.focusOnAirplane(airplane))
							.not
							.toThrow();
					});
			});

		describe("panToIsland",
			() =>
			{
				it("should call onComplete callback when pan finishes",
					() =>
					{
						service.initialize(scene);

						vi
							.spyOn(scene, "beginDirectAnimation")
							.mockImplementation(
								(_target, _animations, _from, _to, _loop, _speed, onEnd) =>
								{
									if (onEnd != null)
									{
										onEnd();
									}

									return null as unknown as Animatable;
								});

						const onComplete: ReturnType<typeof vi.fn> =
							vi.fn();

						service.panToIsland(
							Vector3.Zero(),
							onComplete);

						expect(onComplete)
							.toHaveBeenCalledOnce();
					});

				it("should set camera target toward island center",
					() =>
					{
						service.initialize(scene);

						const islandCenter: Vector3 =
							new Vector3(0, 0, 0);

						vi
							.spyOn(scene, "beginDirectAnimation")
							.mockImplementation(
								(_target, _animations, _from, _to, _loop, _speed, onEnd) =>
								{
									if (onEnd != null)
									{
										onEnd();
									}

									return null as unknown as Animatable;
								});

						service.panToIsland(
							islandCenter,
							vi.fn());

						const camera: ArcRotateCamera =
							scene.activeCamera as ArcRotateCamera;

						expect(camera.target.x)
							.toBeCloseTo(0, 1);
						expect(camera.target.z)
							.toBeCloseTo(0, 1);
					});

				it("should not throw when called before initialize",
					() =>
					{
						expect(
							() =>
								service.panToIsland(
									Vector3.Zero(),
									vi.fn()))
							.not
							.toThrow();
					});
			});

		describe("zoomOutToIslandView",
			() =>
			{
				it("should call onComplete callback when animation finishes",
					() =>
					{
						service.initialize(scene);

						vi
							.spyOn(scene, "beginDirectAnimation")
							.mockImplementation(
								(_target, _animations, _from, _to, _loop, _speed, onEnd) =>
								{
									if (onEnd != null)
									{
										onEnd();
									}

									return null as unknown as Animatable;
								});

						const onComplete: ReturnType<typeof vi.fn> =
							vi.fn();

						service.zoomOutToIslandView(
							Vector3.Zero(),
							onComplete);

						expect(onComplete)
							.toHaveBeenCalledOnce();
					});

				it("should not throw when called before initialize",
					() =>
					{
						expect(
							() =>
								service.zoomOutToIslandView(
									Vector3.Zero(),
									vi.fn()))
							.not
							.toThrow();
					});
			});
	});