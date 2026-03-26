/**
 * Spy Physics Service unit tests.
 * Tests movement, rotation, boundary clamping, stun mechanics, and state.
 */

import { provideZonelessChangeDetection } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { NullEngine } from "@babylonjs/core/Engines/nullEngine";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { Scene } from "@babylonjs/core/scene";
import {
	BLACK_SPY_SPAWN_X,
	BLACK_SPY_SPAWN_Z,
	BOMB_STUN_SECONDS,
	ISLAND_SIZE
} from "@games/spy-vs-spy/constants/spy-vs-spy.constants";
import { StunState } from "@games/spy-vs-spy/models/spy-vs-spy.models";
import type { SpyPhysicsState } from "@games/spy-vs-spy/models/spy-vs-spy.models";
import { SpyPhysicsService } from "./spy-physics.service";

describe("SpyPhysicsService",
	() =>
	{
		let service: SpyPhysicsService;
		let engine: NullEngine;
		let scene: Scene;
		let spyNode: TransformNode;

		beforeEach(
			() =>
			{
				TestBed.configureTestingModule(
					{
						providers: [
							provideZonelessChangeDetection(),
							SpyPhysicsService
						]
					});

				service =
					TestBed.inject(SpyPhysicsService);
				engine =
					new NullEngine();
				scene =
					new Scene(engine);
				spyNode =
					new TransformNode("test-spy", scene);
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

		it("initialize should set position to spawn coordinates",
			() =>
			{
				service.initialize(
					spyNode,
					BLACK_SPY_SPAWN_X,
					BLACK_SPY_SPAWN_Z);

				expect(spyNode.position.x)
					.toBeCloseTo(BLACK_SPY_SPAWN_X, 1);
				expect(spyNode.position.z)
					.toBeCloseTo(BLACK_SPY_SPAWN_Z, 1);
			});

		it("update should move spy forward when ArrowUp pressed",
			() =>
			{
				service.initialize(spyNode, 0, 0);

				const initialZ: number =
					spyNode.position.z;
				const keys: Record<string, boolean> =
					{ ArrowUp: true };
				const deltaTime: number = 0.016;

				service.update(keys, deltaTime);

				/* Forward movement changes Z (given default rotation). */
				expect(spyNode.position.z)
					.not
					.toBeCloseTo(initialZ, 2);
			});

		it("update should rotate spy when ArrowLeft pressed",
			() =>
			{
				service.initialize(spyNode, 0, 0);

				const initialRotation: number =
					spyNode.rotation.y;
				const keys: Record<string, boolean> =
					{ ArrowLeft: true };
				const deltaTime: number = 0.016;

				service.update(keys, deltaTime);

				expect(spyNode.rotation.y)
					.not
					.toBeCloseTo(initialRotation, 4);
			});

		it("update should not move when no keys pressed",
			() =>
			{
				service.initialize(spyNode, 0, 0);

				const initialX: number =
					spyNode.position.x;
				const initialZ: number =
					spyNode.position.z;
				const keys: Record<string, boolean> = {};
				const deltaTime: number = 0.016;

				service.update(keys, deltaTime);

				expect(spyNode.position.x)
					.toBeCloseTo(initialX, 4);
				expect(spyNode.position.z)
					.toBeCloseTo(initialZ, 4);
			});

		it("update should clamp spy to island bounds",
			() =>
			{
				const boundary: number =
					ISLAND_SIZE / 2;

				service.initialize(spyNode, boundary + 10, 0);

				const keys: Record<string, boolean> = {};
				const deltaTime: number = 0.016;

				service.update(keys, deltaTime);

				expect(spyNode.position.x)
					.toBeLessThanOrEqual(boundary);
			});

		it("setStunned should prevent movement during stun",
			() =>
			{
				service.initialize(spyNode, 0, 0);
				service.setStunned(
					StunState.BombStunned,
					BOMB_STUN_SECONDS);

				const initialZ: number =
					spyNode.position.z;
				const keys: Record<string, boolean> =
					{ ArrowUp: true };
				const deltaTime: number = 0.016;

				service.update(keys, deltaTime);

				expect(spyNode.position.z)
					.toBeCloseTo(initialZ, 4);
			});

		it("stun timer should decrement with deltaTime",
			() =>
			{
				service.initialize(spyNode, 0, 0);
				service.setStunned(
					StunState.BombStunned,
					BOMB_STUN_SECONDS);

				const keys: Record<string, boolean> = {};
				const deltaTime: number = 1.0;

				service.update(keys, deltaTime);

				const state: SpyPhysicsState =
					service.getState();

				expect(state.stunRemainingSeconds)
					.toBeCloseTo(BOMB_STUN_SECONDS - 1, 1);
			});

		it("getState should return current spy state snapshot",
			() =>
			{
				service.initialize(
					spyNode,
					BLACK_SPY_SPAWN_X,
					BLACK_SPY_SPAWN_Z);

				const state: SpyPhysicsState =
					service.getState();

				expect(state.positionX)
					.toBeCloseTo(BLACK_SPY_SPAWN_X, 1);
				expect(state.positionZ)
					.toBeCloseTo(BLACK_SPY_SPAWN_Z, 1);
				expect(state.stunState)
					.toBe(StunState.None);
				expect(state.stunRemainingSeconds)
					.toBe(0);
			});

		it("resetPosition should move spy to given coordinates and clear rotation",
			() =>
			{
				service.initialize(
					spyNode,
					BLACK_SPY_SPAWN_X,
					BLACK_SPY_SPAWN_Z);

				service.update(
					{
						w: true,
						a: false,
						s: false,
						d: false,
						ArrowUp: true,
						ArrowDown: false,
						ArrowLeft: false,
						ArrowRight: false
					},
					0.5);

				service.resetPosition(5, 10);

				const state: SpyPhysicsState =
					service.getState();

				expect(state.positionX)
					.toBeCloseTo(5, 1);
				expect(state.positionZ)
					.toBeCloseTo(10, 1);
				expect(state.rotationY)
					.toBe(0);
			});

		it("dispose should not throw",
			() =>
			{
				service.initialize(spyNode, 0, 0);

				expect(() => service.dispose())
					.not
					.toThrow();
			});
	});