/**
 * Track Features Service unit tests.
 * Tests jump ramps, tunnel construction, and road fork detection.
 */

import { provideZonelessChangeDetection } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { NullEngine } from "@babylonjs/core/Engines/nullEngine";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { Scene } from "@babylonjs/core/scene";
import {
	JUMP_LARGE_VELOCITY,
	JUMP_MEDIUM_VELOCITY,
	JUMP_MIN_SPEED_MPH,
	JUMP_SMALL_VELOCITY,
	TUNNEL_LENGTH,
	TUNNEL_LIGHT_SPACING
} from "@sandbox/car-a-lot/constants/car-a-lot.constants";
import { JumpRamp, JumpResult, RoadSegment } from "@sandbox/car-a-lot/models/car-a-lot.models";
import { TrackFeaturesService } from "./track-features.service";

describe("TrackFeaturesService",
	() =>
	{
		let service: TrackFeaturesService;
		let scene: Scene;
		let engine: NullEngine;

		beforeEach(
			() =>
			{
				TestBed.configureTestingModule(
					{
						providers: [
							provideZonelessChangeDetection(),
							TrackFeaturesService
						]
					});

				service =
					TestBed.inject(TrackFeaturesService);
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

		describe("Jump Ramps",
			() =>
			{
				it("should create 9 jump ramps evenly spaced across track",
					() =>
					{
						const segments: RoadSegment[] =
							createTestSegments();

						service.createJumps(
							scene,
							segments);

						const ramps: readonly JumpRamp[] =
							service.getJumpRamps();

						expect(ramps.length)
							.toBe(9);
					});

				it("should create jump 1 as small ramp (lowest height)",
					() =>
					{
						const segments: RoadSegment[] =
							createTestSegments();

						service.createJumps(
							scene,
							segments);

						const ramps: readonly JumpRamp[] =
							service.getJumpRamps();

						expect(ramps[0].size)
							.toBe("small");
						expect(ramps[0].jumpVelocity)
							.toBe(JUMP_SMALL_VELOCITY);
					});

				it("should create jump 2 as medium ramp",
					() =>
					{
						const segments: RoadSegment[] =
							createTestSegments();

						service.createJumps(
							scene,
							segments);

						const ramps: readonly JumpRamp[] =
							service.getJumpRamps();

						expect(ramps[1].size)
							.toBe("medium");
						expect(ramps[1].jumpVelocity)
							.toBe(JUMP_MEDIUM_VELOCITY);
					});

				it("should create jump 3 as large ramp (highest)",
					() =>
					{
						const segments: RoadSegment[] =
							createTestSegments();

						service.createJumps(
							scene,
							segments);

						const ramps: readonly JumpRamp[] =
							service.getJumpRamps();

						expect(ramps[2].size)
							.toBe("large");
						expect(ramps[2].jumpVelocity)
							.toBe(JUMP_LARGE_VELOCITY);
					});

				it("should detect kart entering a jump ramp zone",
					() =>
					{
						const segments: RoadSegment[] =
							createTestSegments();

						service.createJumps(
							scene,
							segments);

						const ramps: readonly JumpRamp[] =
							service.getJumpRamps();

						const result: JumpResult | null =
							service.checkJumpTrigger(
								ramps[0].positionX,
								ramps[0].positionZ,
								15);

						expect(result)
							.not
							.toBeNull();
						expect(result!.jumpVelocity)
							.toBe(JUMP_SMALL_VELOCITY);
					});

				it("should calculate jump velocity based on ramp size and kart speed",
					() =>
					{
						const segments: RoadSegment[] =
							createTestSegments();

						service.createJumps(
							scene,
							segments);

						const ramps: readonly JumpRamp[] =
							service.getJumpRamps();

						const smallResult: JumpResult | null =
							service.checkJumpTrigger(
								ramps[0].positionX,
								ramps[0].positionZ,
								15);

						const largeResult: JumpResult | null =
							service.checkJumpTrigger(
								ramps[2].positionX,
								ramps[2].positionZ,
								15);

						expect(smallResult!.jumpVelocity)
							.toBeLessThan(largeResult!.jumpVelocity);
					});

				it("should NOT trigger jump if kart is too slow",
					() =>
					{
						const segments: RoadSegment[] =
							createTestSegments();

						service.createJumps(
							scene,
							segments);

						const ramps: readonly JumpRamp[] =
							service.getJumpRamps();

						const result: JumpResult | null =
							service.checkJumpTrigger(
								ramps[0].positionX,
								ramps[0].positionZ,
								JUMP_MIN_SPEED_MPH - 1);

						expect(result)
							.toBeNull();
					});

				it("should create visible ramp meshes with angled surface",
					() =>
					{
						const segments: RoadSegment[] =
							createTestSegments();

						const meshCountBefore: number =
							scene.meshes.length;

						service.createJumps(
							scene,
							segments);

						expect(scene.meshes.length)
							.toBeGreaterThan(meshCountBefore);

						const rampMeshes: Mesh[] =
							scene.meshes.filter(
								(mesh) => mesh.name.startsWith("ramp-")) as Mesh[];

						expect(rampMeshes.length)
							.toBeGreaterThanOrEqual(3);
					});
			});

		describe("Tunnel",
			() =>
			{
				it("should create a tunnel enclosure mesh",
					() =>
					{
						const meshCountBefore: number =
							scene.meshes.length;

						service.createTunnel(
							scene,
							0,
							0,
							0);

						const tunnelMeshes: Mesh[] =
							scene.meshes.filter(
								(mesh) =>
									mesh.name.startsWith("tunnel-")) as Mesh[];

						expect(tunnelMeshes.length)
							.toBeGreaterThan(0);
						expect(scene.meshes.length)
							.toBeGreaterThan(meshCountBefore);
					});

				it("should create glow spheres every ~6 units inside tunnel",
					() =>
					{
						service.createTunnel(
							scene,
							0,
							0,
							0);

						const expectedGlows: number =
							Math.floor(TUNNEL_LENGTH / TUNNEL_LIGHT_SPACING);

						const glowSpheres: Mesh[] =
							scene.meshes.filter(
								(mesh): mesh is Mesh =>
									mesh.name.startsWith("tunnel-glow-")) as Mesh[];

						expect(glowSpheres.length)
							.toBeGreaterThanOrEqual(expectedGlows);
					});

				it("should create glow spheres with emissive light blue color",
					() =>
					{
						service.createTunnel(
							scene,
							0,
							0,
							0);

						const glowSpheres: Mesh[] =
							scene.meshes.filter(
								(mesh): mesh is Mesh =>
									mesh.name.startsWith("tunnel-glow-")) as Mesh[];

						expect(glowSpheres.length)
							.toBeGreaterThan(0);

						const firstGlowMaterial: StandardMaterial =
							glowSpheres[0].material as StandardMaterial;

						expect(firstGlowMaterial.emissiveColor.r)
							.toBeCloseTo(0.3, 1);
						expect(firstGlowMaterial.emissiveColor.g)
							.toBeCloseTo(0.5, 1);
						expect(firstGlowMaterial.emissiveColor.b)
							.toBeCloseTo(0.9, 1);
					});

				it("should darken the interior with walls and ceiling",
					() =>
					{
						service.createTunnel(
							scene,
							0,
							0,
							0);

						const wallMeshes: Mesh[] =
							scene.meshes.filter(
								(mesh) =>
									mesh.name.startsWith("tunnel-wall-")) as Mesh[];

						const ceilingMeshes: Mesh[] =
							scene.meshes.filter(
								(mesh) =>
									mesh.name.startsWith("tunnel-ceiling")) as Mesh[];

						expect(wallMeshes.length)
							.toBeGreaterThanOrEqual(2);
						expect(ceilingMeshes.length)
							.toBeGreaterThanOrEqual(1);
					});

				it("should have entrance and exit openings",
					() =>
					{
						service.createTunnel(
							scene,
							0,
							0,
							0);

						const tunnelWalls: Mesh[] =
							scene.meshes.filter(
								(mesh) =>
									mesh.name.startsWith("tunnel-wall-")) as Mesh[];

						for (const wall of tunnelWalls)
						{
							const scaling: Vector3 =
								wall.scaling;
							expect(scaling)
								.toBeDefined();
						}

						const doorMeshes: Mesh[] =
							scene.meshes.filter(
								(mesh) => mesh.name.includes("door")) as Mesh[];

						expect(doorMeshes.length)
							.toBe(0);
					});

				it("should detect kart entering tunnel",
					() =>
					{
						service.createTunnel(
							scene,
							0,
							0,
							0);

						const isInTunnel: boolean =
							service.isInsideTunnel(
								0,
								TUNNEL_LENGTH / 4);

						expect(isInTunnel)
							.toBe(true);
					});

				it("should detect kart exiting tunnel",
					() =>
					{
						service.createTunnel(
							scene,
							0,
							0,
							0);

						const isInTunnel: boolean =
							service.isInsideTunnel(
								0,
								TUNNEL_LENGTH * 2);

						expect(isInTunnel)
							.toBe(false);
					});
			});

		describe("Road Forks",
			() =>
			{
				it("should identify fork segments from track data",
					() =>
					{
						const segments: RoadSegment[] =
							createTestSegments();

						const forkIndices: number[] =
							service.findForkSegments(segments);

						expect(forkIndices.length)
							.toBeGreaterThanOrEqual(2);
					});

				it("should offer left and right paths at each fork",
					() =>
					{
						const segments: RoadSegment[] =
							createTestSegments();

						const forkIndices: number[] =
							service.findForkSegments(segments);

						for (const index of forkIndices)
						{
							expect(segments[index].isFork)
								.toBe(true);
						}
					});

				it("should handle kart driving on either fork path",
					() =>
					{
						const segments: RoadSegment[] =
							createTestSegments();

						const forkIndices: number[] =
							service.findForkSegments(segments);

						expect(forkIndices.length)
							.toBeGreaterThan(0);

						const forkSegment: RoadSegment =
							segments[forkIndices[0]];

						expect(forkSegment.isFork)
							.toBe(true);
					});

				it("should dispose all created meshes",
					() =>
					{
						const segments: RoadSegment[] =
							createTestSegments();

						service.createJumps(
							scene,
							segments);
						service.createTunnel(
							scene,
							0,
							0,
							0);

						const meshCountBefore: number =
							scene.meshes.length;

						service.dispose();

						expect(scene.meshes.length)
							.toBeLessThan(meshCountBefore);
					});
			});
	});

/**
 * Create test road segments that include fork segments.
 * @returns
 * Array of test road segments.
 */
function createTestSegments(): RoadSegment[]
{
	return [
		{
			positionX: 0,
			positionZ: 20,
			length: 40,
			rotationY: 0,
			isFork: false
		},
		{
			positionX: -10,
			positionZ: 52,
			length: 30,
			rotationY: -Math.PI / 4,
			isFork: true
		},
		{
			positionX: 10,
			positionZ: 82,
			length: 35,
			rotationY: Math.PI / 4,
			isFork: true
		},
		{
			positionX: 10,
			positionZ: 102,
			length: 20,
			rotationY: 0,
			isFork: false
		},
		{
			positionX: -5,
			positionZ: 117,
			length: 25,
			rotationY: -Math.PI / 6,
			isFork: true
		},
		{
			positionX: 5,
			positionZ: 142,
			length: 25,
			rotationY: Math.PI / 6,
			isFork: true
		},
		{
			positionX: 15,
			positionZ: 172,
			length: 40,
			rotationY: Math.PI / 2,
			isFork: false
		},
		{
			positionX: 15,
			positionZ: 187,
			length: 15,
			rotationY: 0,
			isFork: false
		},
		{
			positionX: 15,
			positionZ: 207,
			length: 20,
			rotationY: 0,
			isFork: false
		},
		{
			positionX: 15,
			positionZ: 237,
			length: 30,
			rotationY: 0,
			isFork: false
		},
		{
			positionX: 15,
			positionZ: 262,
			length: 50,
			rotationY: 0,
			isFork: false
		},
		{
			positionX: 15,
			positionZ: 282,
			length: 20,
			rotationY: 0,
			isFork: false
		}
	];
}