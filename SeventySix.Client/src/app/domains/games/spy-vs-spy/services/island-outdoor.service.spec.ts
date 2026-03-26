// <copyright file="island-outdoor.service.spec.ts" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

import { provideZonelessChangeDetection } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { NullEngine } from "@babylonjs/core/Engines/nullEngine";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { Scene } from "@babylonjs/core/scene";
import { OUTSIDE_TREE_COUNT } from "@games/spy-vs-spy/constants/spy-vs-spy.constants";
import { IslandOutdoorService } from "./island-outdoor.service";

describe("IslandOutdoorService",
	() =>
	{
		let service: IslandOutdoorService;
		let engine: NullEngine;
		let scene: Scene;

		beforeEach(
			() =>
			{
				TestBed.configureTestingModule(
					{
						providers: [
							provideZonelessChangeDetection(),
							IslandOutdoorService
						]
					});

				service =
					TestBed.inject(IslandOutdoorService);
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

		describe("trees",
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
			});

		describe("rocks",
			() =>
			{
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
			});
	});