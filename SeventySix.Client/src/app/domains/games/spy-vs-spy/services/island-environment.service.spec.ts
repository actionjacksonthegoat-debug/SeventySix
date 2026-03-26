// <copyright file="island-environment.service.spec.ts" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

import { provideZonelessChangeDetection } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { NullEngine } from "@babylonjs/core/Engines/nullEngine";
import { Light } from "@babylonjs/core/Lights/light";
import { PointLight } from "@babylonjs/core/Lights/pointLight";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { Scene } from "@babylonjs/core/scene";
import type { Nullable } from "@babylonjs/core/types";
import { ISLAND_ROOMS } from "@games/spy-vs-spy/constants/spy-vs-spy.constants";
import { IslandEnvironmentService } from "./island-environment.service";

describe("IslandEnvironmentService",
	() =>
	{
		let service: IslandEnvironmentService;
		let engine: NullEngine;
		let scene: Scene;

		beforeEach(
			() =>
			{
				TestBed.configureTestingModule(
					{
						providers: [
							provideZonelessChangeDetection(),
							IslandEnvironmentService
						]
					});

				service =
					TestBed.inject(IslandEnvironmentService);
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

		describe("lighting",
			() =>
			{
				it("should create a hemispheric light",
					() =>
					{
						service.initialize(scene);
						expect(scene.lights.length)
							.toBeGreaterThan(0);
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
			});

		describe("terrain",
			() =>
			{
				it("should create island ground mesh",
					() =>
					{
						service.initialize(scene);

						const ground: Nullable<Mesh> =
							scene.getMeshByName("island-ground") as Nullable<Mesh>;

						expect(ground)
							.not
							.toBeNull();
					});

				it("should create water mesh",
					() =>
					{
						service.initialize(scene);

						const water: Nullable<Mesh> =
							scene.getMeshByName("water-plane") as Nullable<Mesh>;

						expect(water)
							.not
							.toBeNull();
					});

				it("should create airstrip surface mesh",
					() =>
					{
						service.initialize(scene);

						const airstrip: Nullable<Mesh> =
							scene.getMeshByName("airstrip-runway") as Nullable<Mesh>;

						expect(airstrip)
							.not
							.toBeNull();
					});
			});
	});