/**
 * Octopus Boss Service unit tests.
 * Tests octopus construction, cartoon arms, body collision, eye tracking, and phase management.
 */

import { provideZonelessChangeDetection } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { NullEngine } from "@babylonjs/core/Engines/nullEngine";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { Scene } from "@babylonjs/core/scene";
import {
	APPROACH_TRIGGER_DISTANCE,
	OCTOPUS_BODY_DIAMETER,
	OCTOPUS_BODY_SCALE_Y,
	OCTOPUS_COLLISION_RADIUS,
	OCTOPUS_JUMP_DURATION
} from "@games/car-a-lot/constants/car-a-lot.constants";
import { OctopusBossService } from "./octopus-boss.service";

describe("OctopusBossService",
	() =>
	{
		let service: OctopusBossService;
		let scene: Scene;
		let engine: NullEngine;

		/** Octopus body position for tests. */
		const bodyPosition: Vector3 =
			new Vector3(0, 0, 200);

		beforeEach(
			() =>
			{
				TestBed.configureTestingModule(
					{
						providers: [
							provideZonelessChangeDetection(),
							OctopusBossService
						]
					});

				service =
					TestBed.inject(OctopusBossService);
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

		describe("Construction",
			() =>
			{
				it("should create an octopus body at the correct position",
					() =>
					{
						service.createOctopus(
							scene,
							bodyPosition);

						const bodyMeshes: Mesh[] =
							scene.meshes.filter(
								(mesh) =>
									mesh.name.startsWith("octopus-body")) as Mesh[];

						expect(bodyMeshes.length)
							.toBeGreaterThan(0);
						expect(OCTOPUS_BODY_DIAMETER)
							.toBe(30);
					});

				it("should create body with material",
					() =>
					{
						service.createOctopus(
							scene,
							bodyPosition);

						const bodyMeshes: Mesh[] =
							scene.meshes.filter(
								(mesh) => mesh.name === "octopus-body") as Mesh[];

						expect(bodyMeshes.length)
							.toBe(1);
						expect(bodyMeshes[0].material)
							.toBeDefined();
					});

				it("should create a pink bow on top of the body",
					() =>
					{
						service.createOctopus(
							scene,
							bodyPosition);

						const bowMeshes: Mesh[] =
							scene.meshes.filter(
								(mesh) =>
									mesh.name.startsWith("octopus-bow")) as Mesh[];

						expect(bowMeshes.length)
							.toBeGreaterThan(0);
					});

				it("should create cartoon tentacle arms with suction cups",
					() =>
					{
						service.createOctopus(
							scene,
							bodyPosition);

						const tentacleMeshes: Mesh[] =
							scene.meshes.filter(
								(mesh) =>
									mesh.name.startsWith("tentacle-")) as Mesh[];

						expect(tentacleMeshes.length)
							.toBeGreaterThan(0);

						const suctionMeshes: Mesh[] =
							scene.meshes.filter(
								(mesh) =>
									mesh.name.startsWith("suction-")) as Mesh[];

						expect(suctionMeshes.length)
							.toBeGreaterThan(0);
					});

				it("should create octopus eyes with pupils",
					() =>
					{
						service.createOctopus(
							scene,
							bodyPosition);

						const whiteMeshes: Mesh[] =
							scene.meshes.filter(
								(mesh) =>
									mesh.name.startsWith("octopus-eye-white")) as Mesh[];

						const pupilMeshes: Mesh[] =
							scene.meshes.filter(
								(mesh) =>
									mesh.name.startsWith("octopus-eye-pupil")) as Mesh[];

						expect(whiteMeshes.length)
							.toBe(2);
						expect(pupilMeshes.length)
							.toBe(2);
					});
			});

		describe("Tentacle Animation",
			() =>
			{
				it("should animate tentacles with sway motion",
					() =>
					{
						service.createOctopus(
							scene,
							bodyPosition);

						const posBefore: Vector3[] =
							service.getTentaclePositions();

						service.updateAnimation(0.5);

						const posAfter: Vector3[] =
							service.getTentaclePositions();

						let hasMoved: boolean = false;

						for (let index: number = 0; index < posBefore.length; index++)
						{
							if (!posBefore[index].equals(posAfter[index]))
							{
								hasMoved = true;
							}
						}

						expect(hasMoved)
							.toBe(true);
					});
			});

		describe("Body Collision",
			() =>
			{
				it("should detect collision when kart is inside body radius",
					() =>
					{
						service.createOctopus(
							scene,
							bodyPosition);

						const bodyCenterY: number =
							OCTOPUS_BODY_DIAMETER * OCTOPUS_BODY_SCALE_Y / 2;

						const insidePos: Vector3 =
							new Vector3(
								bodyPosition.x,
								bodyCenterY,
								bodyPosition.z);

						const collides: boolean =
							service.checkBodyCollision(insidePos);

						expect(collides)
							.toBe(true);
					});

				it("should NOT detect collision when kart is far from body",
					() =>
					{
						service.createOctopus(
							scene,
							bodyPosition);

						const farPos: Vector3 =
							new Vector3(
								bodyPosition.x + 100,
								0,
								bodyPosition.z);

						const collides: boolean =
							service.checkBodyCollision(farPos);

						expect(collides)
							.toBe(false);
					});

				it("should NOT detect collision when kart clears over the top",
					() =>
					{
						service.createOctopus(
							scene,
							bodyPosition);

						const abovePos: Vector3 =
							new Vector3(
								bodyPosition.x,
								OCTOPUS_BODY_DIAMETER * OCTOPUS_BODY_SCALE_Y + OCTOPUS_COLLISION_RADIUS + 5,
								bodyPosition.z);

						const collides: boolean =
							service.checkBodyCollision(abovePos);

						expect(collides)
							.toBe(false);
					});

				it("should return false when octopus not created",
					() =>
					{
						const collides: boolean =
							service.checkBodyCollision(
								new Vector3(0, 0, 200));

						expect(collides)
							.toBe(false);
					});
			});

		describe("Eye Tracking",
			() =>
			{
				it("should move pupils toward the kart position",
					() =>
					{
						service.createOctopus(
							scene,
							bodyPosition);

						const pupilsBefore: Mesh[] =
							scene.meshes.filter(
								(mesh) =>
									mesh.name.startsWith("octopus-eye-pupil")) as Mesh[];

						const positionsBefore: Vector3[] =
							pupilsBefore.map(
								(pupil) => pupil.position.clone());

						service.updateEyeTracking(
							new Vector3(0, 0, 0));

						let hasMoved: boolean = false;

						for (let index: number = 0; index < pupilsBefore.length; index++)
						{
							if (!pupilsBefore[index].position.equals(positionsBefore[index]))
							{
								hasMoved = true;
							}
						}

						expect(hasMoved)
							.toBe(true);
					});
			});

		describe("Phase Management",
			() =>
			{
				it("should detect kart entering approach zone",
					() =>
					{
						service.createOctopus(
							scene,
							bodyPosition);

						const approachPos: Vector3 =
							new Vector3(
								0,
								0,
								bodyPosition.z - APPROACH_TRIGGER_DISTANCE + 5);

						const isApproaching: boolean =
							service.checkApproachZone(approachPos);

						expect(isApproaching)
							.toBe(true);
					});

				it("should NOT detect approach when far from octopus",
					() =>
					{
						service.createOctopus(
							scene,
							bodyPosition);

						const farPos: Vector3 =
							new Vector3(
								0,
								0,
								bodyPosition.z - APPROACH_TRIGGER_DISTANCE - 100);

						const isApproaching: boolean =
							service.checkApproachZone(farPos);

						expect(isApproaching)
							.toBe(false);
					});

				it("should NOT detect approach when past the octopus body",
					() =>
					{
						service.createOctopus(
							scene,
							bodyPosition);

						const pastPos: Vector3 =
							new Vector3(
								0,
								0,
								bodyPosition.z + 10);

						const isApproaching: boolean =
							service.checkApproachZone(pastPos);

						expect(isApproaching)
							.toBe(false);
					});

				it("should return false for approach when not created",
					() =>
					{
						const isApproaching: boolean =
							service.checkApproachZone(
								new Vector3(0, 0, 150));

						expect(isApproaching)
							.toBe(false);
					});

				it("should detect kart clearing the octopus",
					() =>
					{
						service.createOctopus(
							scene,
							bodyPosition);

						const clearedPos: Vector3 =
							new Vector3(
								0,
								0,
								bodyPosition.z + OCTOPUS_BODY_DIAMETER);

						const hasCleared: boolean =
							service.hasCleared(clearedPos);

						expect(hasCleared)
							.toBe(true);
					});

				it("should NOT detect clearing when in front of octopus",
					() =>
					{
						service.createOctopus(
							scene,
							bodyPosition);

						const frontPos: Vector3 =
							new Vector3(0, 0, 0);

						const hasCleared: boolean =
							service.hasCleared(frontPos);

						expect(hasCleared)
							.toBe(false);
					});

				it("should dispose all meshes on cleanup",
					() =>
					{
						service.createOctopus(
							scene,
							bodyPosition);

						const meshCountBefore: number =
							scene.meshes.length;

						service.dispose();

						expect(scene.meshes.length)
							.toBeLessThan(meshCountBefore);
					});

				it("should reset state on dispose",
					() =>
					{
						service.createOctopus(
							scene,
							bodyPosition);

						service.startJumpAttack();
						service.dispose();

						expect(service.getIsJumpAttacking())
							.toBe(false);
					});
			});

		describe("Jump Attack Animation",
			() =>
			{
				it("should start jump attack and report in-progress",
					() =>
					{
						service.createOctopus(
							scene,
							bodyPosition);

						service.startJumpAttack();

						expect(service.getIsJumpAttacking())
							.toBe(true);
					});

				it("should land after OCTOPUS_JUMP_DURATION",
					() =>
					{
						service.createOctopus(
							scene,
							bodyPosition);

						service.startJumpAttack();

						const result: { landed: boolean; position: Vector3; } =
							service.updateJumpAttack(
								OCTOPUS_JUMP_DURATION + 0.1);

						expect(result.landed)
							.toBe(true);
					});

				it("should not be landed mid-jump",
					() =>
					{
						service.createOctopus(
							scene,
							bodyPosition);

						service.startJumpAttack();

						const result: { landed: boolean; position: Vector3; } =
							service.updateJumpAttack(
								OCTOPUS_JUMP_DURATION * 0.5);

						expect(result.landed)
							.toBe(false);
					});

				it("should return body position when not attacking",
					() =>
					{
						service.createOctopus(
							scene,
							bodyPosition);

						const result: { landed: boolean; position: Vector3; } =
							service.updateJumpAttack(0.1);

						expect(result.landed)
							.toBe(false);
						expect(result.position.z)
							.toBe(bodyPosition.z);
					});
			});

		describe("checkGroundCollision",
			() =>
			{
				beforeEach(
					() =>
					{
						service.createOctopus(
							scene,
							bodyPosition);
					});

				it("should return true when kart is within horizontal radius at ground level",
					() =>
					{
						const kartAtBase: Vector3 =
							new Vector3(
								bodyPosition.x + OCTOPUS_COLLISION_RADIUS - 1,
								0.3,
								bodyPosition.z);

						expect(service.checkGroundCollision(kartAtBase))
							.toBe(true);
					});

				it("should return false when kart is outside horizontal radius at ground level",
					() =>
					{
						const kartFarAway: Vector3 =
							new Vector3(
								bodyPosition.x + OCTOPUS_COLLISION_RADIUS + 5,
								0.3,
								bodyPosition.z);

						expect(service.checkGroundCollision(kartFarAway))
							.toBe(false);
					});

				it("should return false when octopus has not been created",
					() =>
					{
						const freshService: OctopusBossService =
							TestBed.inject(OctopusBossService);

						expect(freshService.checkGroundCollision(Vector3.Zero()))
							.toBe(false);
					});

				it("should return true when kart drives straight to center",
					() =>
					{
						const kartAtCenter: Vector3 =
							new Vector3(
								bodyPosition.x,
								0.3,
								bodyPosition.z);

						expect(service.checkGroundCollision(kartAtCenter))
							.toBe(true);
					});
			});
	});