/**
 * Driving Physics Service unit tests.
 * Tests acceleration, steering, gravity, jumps, and frame updates.
 */

import { provideZonelessChangeDetection } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { KART_GROUND_OFFSET } from "@games/car-a-lot/constants/car-a-lot.constants";
import { DrivingState } from "@games/car-a-lot/models/car-a-lot.models";
import { DrivingPhysicsService } from "@games/car-a-lot/services/driving-physics.service";

describe("DrivingPhysicsService",
	() =>
	{
		let service: DrivingPhysicsService;

		beforeEach(
			() =>
			{
				TestBed.configureTestingModule(
					{
						providers: [
							provideZonelessChangeDetection(),
							DrivingPhysicsService
						]
					});

				service =
					TestBed.inject(DrivingPhysicsService);
			});

		describe("Acceleration",
			() =>
			{
				it("should start at 0 speed",
					() =>
					{
						const state: DrivingState =
							service.update({}, 0.016, 0);

						expect(state.speedMph)
							.toBe(0);
					});

				it("should accelerate when forward key is pressed",
					() =>
					{
						const state: DrivingState =
							service.update(
								{ w: true },
								0.5,
								0);

						expect(state.speedMph)
							.toBeGreaterThan(0);
					});

				it("should reach max speed in approximately 2 seconds",
					() =>
					{
						let state: DrivingState =
							{
								speedMph: 0,
								positionX: 0,
								positionY: 0,
								positionZ: 0,
								rotationY: 0,
								isGrounded: true,
								isOnRoad: true,
								currentLap: 1
							};

						for (let step: number = 0; step < 40; step++)
						{
							state =
								service.update(
									{ w: true },
									0.05,
									0);
						}

						expect(state.speedMph)
							.toBeGreaterThanOrEqual(24);
					});

				it("should NOT exceed max speed",
					() =>
					{
						for (let step: number = 0; step < 100; step++)
						{
							service.update(
								{ w: true },
								0.05,
								0);
						}

						const state: DrivingState =
							service.update(
								{ w: true },
								0.05,
								0);

						expect(state.speedMph)
							.toBeLessThanOrEqual(75);
					});

				it("should decelerate when no keys pressed",
					() =>
					{
						service.update(
							{ w: true },
							1.0,
							0);

						const state: DrivingState =
							service.update({}, 0.5, 0);

						expect(state.speedMph)
							.toBeLessThan(25);
					});

				it("should decelerate faster when brake pressed",
					() =>
					{
						service.update(
							{ w: true },
							2.0,
							0);

						const braking: DrivingState =
							service.update(
								{ s: true },
								0.5,
								0);

						service.reset();
						service.update(
							{ w: true },
							2.0,
							0);

						const coastOnly: DrivingState =
							service.update({}, 0.5, 0);

						expect(braking.speedMph)
							.toBeLessThanOrEqual(coastOnly.speedMph);
					});

				it("should NOT go below 0 speed",
					() =>
					{
						const state: DrivingState =
							service.update(
								{ s: true },
								1.0,
								0);

						expect(state.speedMph)
							.toBeGreaterThanOrEqual(0);
					});
			});

		describe("Steering",
			() =>
			{
				it("should not turn when stationary",
					() =>
					{
						const state: DrivingState =
							service.update(
								{ a: true },
								0.5,
								0);

						expect(state.rotationY)
							.toBe(0);
					});

				it("should turn left when moving",
					() =>
					{
						service.update(
							{ w: true },
							1.0,
							0);

						const state: DrivingState =
							service.update(
								{ a: true },
								0.5,
								0);

						expect(state.rotationY)
							.toBeLessThan(0);
					});

				it("should turn right when moving",
					() =>
					{
						service.update(
							{ w: true },
							1.0,
							0);

						const state: DrivingState =
							service.update(
								{ d: true },
								0.5,
								0);

						expect(state.rotationY)
							.toBeGreaterThan(0);
					});

				it("should handle ArrowUp key for acceleration",
					() =>
					{
						const state: DrivingState =
							service.update(
								{ ArrowUp: true },
								0.5,
								0);

						expect(state.speedMph)
							.toBeGreaterThan(0);
					});

				it("should handle ArrowLeft for turning",
					() =>
					{
						service.update(
							{ ArrowUp: true },
							1.0,
							0);

						const state: DrivingState =
							service.update(
								{ ArrowLeft: true },
								0.5,
								0);

						expect(state.rotationY)
							.toBeLessThan(0);
					});

				it("should update position based on heading",
					() =>
					{
						service.update(
							{ w: true },
							1.0,
							0);

						const state: DrivingState =
							service.update(
								{ w: true },
								0.5,
								0);

						expect(state.positionZ)
							.toBeGreaterThan(0);
					});
			});

		describe("Gravity and Ground",
			() =>
			{
				it("should maintain ground position on flat terrain",
					() =>
					{
						const state: DrivingState =
							service.update(
								{ w: true },
								0.5,
								0);

						expect(state.positionY)
							.toBeCloseTo(KART_GROUND_OFFSET, 4);
						expect(state.isGrounded)
							.toBe(true);
					});

				it("should apply gravity when airborne",
					() =>
					{
						service.applyJump(15);

						const state: DrivingState =
							service.update({}, 0.1, 0);

						expect(state.isGrounded)
							.toBe(false);
						expect(state.positionY)
							.toBeGreaterThan(0);
					});

				it("should land and resume ground driving",
					() =>
					{
						service.applyJump(5);

						for (let step: number = 0; step < 40; step++)
						{
							service.update({}, 0.05, 0);
						}

						const state: DrivingState =
							service.update({}, 0.05, 0);

						expect(state.isGrounded)
							.toBe(true);
						expect(state.positionY)
							.toBeCloseTo(KART_GROUND_OFFSET, 4);
					});
			});

		describe("Jump Physics",
			() =>
			{
				it("should apply upward velocity on jump",
					() =>
					{
						service.applyJump(15);

						const state: DrivingState =
							service.update({}, 0.016, 0);

						expect(state.positionY)
							.toBeGreaterThan(0);
					});

				it("should maintain horizontal momentum during jump",
					() =>
					{
						service.update(
							{ w: true },
							1.0,
							0);
						service.applyJump(15);

						const state: DrivingState =
							service.update(
								{ w: true },
								0.1,
								0);

						expect(state.positionZ)
							.toBeGreaterThan(0);
						expect(state.positionY)
							.toBeGreaterThan(0);
					});
			});

		describe("Frame Update Integration",
			() =>
			{
				it("should return complete DrivingState snapshot",
					() =>
					{
						const state: DrivingState =
							service.update(
								{ w: true },
								0.5,
								0);

						expect(state)
							.toHaveProperty("speedMph");
						expect(state)
							.toHaveProperty("positionX");
						expect(state)
							.toHaveProperty("positionY");
						expect(state)
							.toHaveProperty("positionZ");
						expect(state)
							.toHaveProperty("rotationY");
						expect(state)
							.toHaveProperty("isGrounded");
						expect(state)
							.toHaveProperty("isOnRoad");
						expect(state)
							.toHaveProperty("currentLap");
					});

				it("should handle very small deltaTime",
					() =>
					{
						const state: DrivingState =
							service.update(
								{ w: true },
								0.001,
								0);

						expect(state.speedMph)
							.toBeGreaterThanOrEqual(0);
					});

				it("should cap large deltaTime",
					() =>
					{
						const state: DrivingState =
							service.update(
								{ w: true },
								5.0,
								0);

						expect(state.speedMph)
							.toBeLessThanOrEqual(25);
					});
			});

		describe("Heading Control",
			() =>
			{
				it("should set heading directly via setHeading",
					() =>
					{
						service.update(
							{ w: true },
							1.0,
							0);

						service.setHeading(Math.PI / 4);

						const state: DrivingState =
							service.update({}, 0.016, 0);

						expect(state.rotationY)
							.toBeCloseTo(Math.PI / 4, 1);
					});
			});

		describe("Ensure Minimum Speed",
			() =>
			{
				it("should boost speed when below minimum",
					() =>
					{
						service.ensureMinSpeed(10);

						const state: DrivingState =
							service.update({}, 0.016, 0);

						expect(state.speedMph)
							.toBeGreaterThan(0);
					});

				it("should NOT reduce speed when above minimum",
					() =>
					{
						service.update(
							{ w: true },
							2.0,
							0);

						service.update({}, 0.016, 0);

						service.ensureMinSpeed(1);

						const after: DrivingState =
							service.update({}, 0.016, 0);

						expect(after.speedMph)
							.toBeGreaterThan(0);
					});
			});

		describe("Ground offset",
			() =>
			{
				it("should initialize positionY to KART_GROUND_OFFSET",
					() =>
					{
						const state: DrivingState =
							service.update({}, 0.016, 0);

						expect(state.positionY)
							.toBeCloseTo(KART_GROUND_OFFSET, 4);
					});

				it("should clamp grounded positionY to groundHeight + KART_GROUND_OFFSET",
					() =>
					{
						const hillHeight: number = 3;

						for (let frame: number = 0; frame < 5; frame++)
						{
							service.update({}, 0.016, hillHeight);
						}

						const state: DrivingState =
							service.update({}, 0.016, hillHeight);

						expect(state.positionY)
							.toBeCloseTo(hillHeight + KART_GROUND_OFFSET, 4);
					});

				it("should land at groundHeight + KART_GROUND_OFFSET after a jump",
					() =>
					{
						service.applyJump(15);

						for (let frame: number = 0; frame < 120; frame++)
						{
							service.update({}, 0.016, 0);
						}

						const state: DrivingState =
							service.update({}, 0.016, 0);

						expect(state.positionY)
							.toBeCloseTo(KART_GROUND_OFFSET, 4);
						expect(state.isGrounded)
							.toBe(true);
					});

				it("should reset positionY to KART_GROUND_OFFSET on reset()",
					() =>
					{
						service.applyJump(15);
						service.update({}, 0.5, 0);
						service.reset();

						const state: DrivingState =
							service.update({}, 0.016, 0);

						expect(state.positionY)
							.toBeCloseTo(KART_GROUND_OFFSET, 4);
					});
			});
	});