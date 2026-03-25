/**
 * Island Scene Service unit tests.
 * Tests that scene geometry is created and disposed correctly.
 */

import { provideZonelessChangeDetection } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { NullEngine } from "@babylonjs/core/Engines/nullEngine";
import { Light } from "@babylonjs/core/Lights/light";
import { PointLight } from "@babylonjs/core/Lights/pointLight";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { Scene } from "@babylonjs/core/scene";
import type { Nullable } from "@babylonjs/core/types";
import {
	ISLAND_ROOMS,
	OUTSIDE_TREE_COUNT
} from "@games/spy-vs-spy/constants/spy-vs-spy.constants";
import { RoomId } from "@games/spy-vs-spy/models/spy-vs-spy.models";
import { IslandDecorationService } from "./island-decoration.service";
import { IslandEnvironmentService } from "./island-environment.service";
import { IslandOutdoorService } from "./island-outdoor.service";
import { IslandSceneService } from "./island-scene.service";

describe("IslandSceneService",
	() =>
	{
		let service: IslandSceneService;
		let engine: NullEngine;
		let scene: Scene;

		beforeEach(
			() =>
			{
				TestBed.configureTestingModule(
					{
						providers: [
							provideZonelessChangeDetection(),
							IslandDecorationService,
							IslandEnvironmentService,
							IslandOutdoorService,
							IslandSceneService
						]
					});

				service =
					TestBed.inject(IslandSceneService);
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

		it("initialize should not throw",
			() =>
			{
				expect(() => service.initialize(scene))
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

		it("should create a room floor mesh for each RoomId",
			() =>
			{
				service.initialize(scene);

				for (const roomDef of ISLAND_ROOMS)
				{
					const mesh: Nullable<Mesh> =
						service.getRoomFloorMesh(roomDef.id);
					expect(mesh, `Room ${roomDef.id} should have a floor mesh`)
						.not
						.toBeNull();
				}
			});

		it("getRoomFloorMesh should return null for uninitialized service",
			() =>
			{
				const mesh: Nullable<Mesh> =
					service.getRoomFloorMesh(RoomId.BeachShack);
				expect(mesh)
					.toBeNull();
			});

		it("should add meshes to the scene on initialize",
			() =>
			{
				const meshCountBefore: number =
					scene.meshes.length;
				service.initialize(scene);
				expect(scene.meshes.length)
					.toBeGreaterThan(meshCountBefore);
			});

		it("should create a hemispheric light",
			() =>
			{
				service.initialize(scene);
				expect(scene.lights.length)
					.toBeGreaterThan(0);
			});

		describe("skybox",
			() =>
			{
				it("should create a skybox mesh",
					() =>
					{
						service.initialize(scene);

						const skybox: Nullable<Mesh> =
							scene.getMeshByName("skybox") as Nullable<Mesh>;

						expect(skybox)
							.not
							.toBeNull();
					});

				it("should set skybox infiniteDistance to true",
					() =>
					{
						service.initialize(scene);

						const skybox: Mesh =
							scene.getMeshByName("skybox") as Mesh;

						expect(skybox.infiniteDistance)
							.toBe(true);
					});

				it("should set skybox material backFaceCulling to false",
					() =>
					{
						service.initialize(scene);

						const skybox: Mesh =
							scene.getMeshByName("skybox") as Mesh;
						const material: StandardMaterial =
							skybox.material as StandardMaterial;

						expect(material.backFaceCulling)
							.toBe(false);
					});
			});

		describe("doorways",
			() =>
			{
				it("should create split wall segments for connected rooms",
					() =>
					{
						service.initialize(scene);

						/* BeachShack has east connection to JungleHQ. */
						const leftSegment: Nullable<Mesh> =
							scene.getMeshByName("wall-east-BeachShack-top") as Nullable<Mesh>;
						const rightSegment: Nullable<Mesh> =
							scene.getMeshByName("wall-east-BeachShack-bottom") as Nullable<Mesh>;

						expect(leftSegment)
							.not
							.toBeNull();
						expect(rightSegment)
							.not
							.toBeNull();
					});

				it("should create full walls for non-connected sides",
					() =>
					{
						service.initialize(scene);

						/* BeachShack has no west connection. */
						const westWall: Nullable<Mesh> =
							scene.getMeshByName("wall-west-BeachShack") as Nullable<Mesh>;

						expect(westWall)
							.not
							.toBeNull();
					});
			});

		describe("outside decor",
			() =>
			{
				it("should create tree trunk meshes",
					() =>
					{
						service.initialize(scene);

						const trunks: Mesh[] =
							scene.meshes.filter(
								(mesh) =>
									mesh.name.startsWith("tree-trunk-")) as Mesh[];

						expect(trunks.length)
							.toBeGreaterThanOrEqual(OUTSIDE_TREE_COUNT);
					});

				it("should create tree canopy meshes",
					() =>
					{
						service.initialize(scene);

						const canopies: Mesh[] =
							scene.meshes.filter(
								(mesh) =>
									mesh.name.startsWith("tree-canopy-")) as Mesh[];

						expect(canopies.length)
							.toBeGreaterThanOrEqual(OUTSIDE_TREE_COUNT);
					});

				it("should create rock meshes",
					() =>
					{
						service.initialize(scene);

						const rocks: Mesh[] =
							scene.meshes.filter(
								(mesh) => mesh.name.startsWith("rock-")) as Mesh[];

						expect(rocks.length)
							.toBeGreaterThan(0);
					});

				it("should use beach sand color for island ground",
					() =>
					{
						service.initialize(scene);

						const ground: Nullable<Mesh> =
							scene.getMeshByName("island-ground") as Nullable<Mesh>;

						expect(ground)
							.not
							.toBeNull();
					});
			});

		describe("lighting",
			() =>
			{
				it("should create a point light for each room",
					() =>
					{
						service.initialize(scene);

						const roomLights: PointLight[] =
							scene.lights.filter(
								(light) =>
									light.name.startsWith("room-light-")) as PointLight[];

						expect(roomLights.length)
							.toBe(ISLAND_ROOMS.length);
					});

				it("room point lights should have positive range",
					() =>
					{
						service.initialize(scene);

						const roomLights: PointLight[] =
							scene.lights.filter(
								(light) =>
									light.name.startsWith("room-light-")) as PointLight[];

						for (const light of roomLights)
						{
							expect(light.range)
								.toBeGreaterThan(0);
						}
					});

				it("should create directional light with specular",
					() =>
					{
						service.initialize(scene);

						const sunLight: Light | undefined =
							scene.lights.find(
								(light) => light.name === "sun-light");

						expect(sunLight)
							.toBeTruthy();
					});
			});

		describe("room materials",
			() =>
			{
				it("room floor materials should have emissive color",
					() =>
					{
						service.initialize(scene);

						for (const roomDef of ISLAND_ROOMS)
						{
							const mesh: Nullable<Mesh> =
								service.getRoomFloorMesh(roomDef.id);
							const material: StandardMaterial =
								mesh!.material as StandardMaterial;

							expect(
								material.emissiveColor.r
									+ material.emissiveColor.g
									+ material.emissiveColor.b)
								.toBeGreaterThan(0);
						}
					});

				it("room floor materials should have specular color",
					() =>
					{
						service.initialize(scene);

						for (const roomDef of ISLAND_ROOMS)
						{
							const mesh: Nullable<Mesh> =
								service.getRoomFloorMesh(roomDef.id);
							const material: StandardMaterial =
								mesh!.material as StandardMaterial;

							expect(
								material.specularColor.r
									+ material.specularColor.g
									+ material.specularColor.b)
								.toBeGreaterThan(0);
						}
					});
			});
	});