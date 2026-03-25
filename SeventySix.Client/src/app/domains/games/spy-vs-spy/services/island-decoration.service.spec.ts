// <copyright file="island-decoration.service.spec.ts" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

import { provideZonelessChangeDetection } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { NullEngine } from "@babylonjs/core/Engines/nullEngine";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { Scene } from "@babylonjs/core/scene";
import type { Nullable } from "@babylonjs/core/types";
import { ISLAND_ROOMS } from "@games/spy-vs-spy/constants/spy-vs-spy.constants";
import { IslandDecorationService } from "./island-decoration.service";

describe("IslandDecorationService",
	() =>
	{
		let service: IslandDecorationService;
		let engine: NullEngine;
		let scene: Scene;

		beforeEach(
			() =>
			{
				TestBed.configureTestingModule(
					{
						providers: [
							provideZonelessChangeDetection(),
							IslandDecorationService
						]
					});

				service =
					TestBed.inject(IslandDecorationService);
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

		describe("ceilings",
			() =>
			{
				it("should create a ceiling mesh for each room",
					() =>
					{
						service.initialize(scene);

						for (const roomDef of ISLAND_ROOMS)
						{
							const ceiling: Nullable<Mesh> =
								scene.getMeshByName(`room-ceiling-${roomDef.id}`) as Nullable<Mesh>;

							expect(ceiling, `Room ${roomDef.id} should have a ceiling mesh`)
								.not
								.toBeNull();
						}
					});
			});

		describe("labels",
			() =>
			{
				it("should create a label mesh for each room",
					() =>
					{
						service.initialize(scene);

						for (const roomDef of ISLAND_ROOMS)
						{
							const label: Nullable<Mesh> =
								scene.getMeshByName(`room-label-${roomDef.id}`) as Nullable<Mesh>;

							expect(label, `Room ${roomDef.id} should have a label mesh`)
								.not
								.toBeNull();
						}
					});
			});

		it("should add decoration meshes to the scene",
			() =>
			{
				const meshCountBefore: number =
					scene.meshes.length;
				service.initialize(scene);

				expect(scene.meshes.length)
					.toBeGreaterThan(meshCountBefore);
			});
	});