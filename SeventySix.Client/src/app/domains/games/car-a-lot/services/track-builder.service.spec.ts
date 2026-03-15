/**
 * Track Builder Service unit tests.
 * Tests ground, road, tree, and rock creation for the Car-a-Lot track.
 */

import { provideZonelessChangeDetection } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { NullEngine } from "@babylonjs/core/Engines/nullEngine";
import { Scene } from "@babylonjs/core/scene";
import { HILL_MIN_HEIGHT, ROCK_COUNT, TREE_COUNT } from "@games/car-a-lot/constants/car-a-lot.constants";
import { RoadSegment } from "@games/car-a-lot/models/car-a-lot.models";
import { TrackBuilderService } from "@games/car-a-lot/services/track-builder.service";

describe("TrackBuilderService",
	() =>
	{
		let service: TrackBuilderService;
		let engine: NullEngine;
		let scene: Scene;

		beforeEach(
			() =>
			{
				TestBed.configureTestingModule(
					{
						providers: [
							provideZonelessChangeDetection(),
							TrackBuilderService
						]
					});

				service =
					TestBed.inject(TrackBuilderService);
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

		it("should create junction fill discs between angled road segments",
			() =>
			{
				service.buildTrack(scene);

				const junctionFills: number =
					scene
						.meshes
						.filter(
							(mesh) =>
								mesh.name.startsWith("junction-fill"))
						.length;

				expect(junctionFills)
					.toBeGreaterThan(0);
			});

		it("should create the specified number of trees",
			() =>
			{
				service.buildTrack(scene);

				const treeTops: number =
					scene
						.meshes
						.filter(
							(mesh) =>
								mesh.name.startsWith("tree-top"))
						.length;

				expect(treeTops)
					.toBe(TREE_COUNT);
			});

		it("should create trees with trunks",
			() =>
			{
				service.buildTrack(scene);

				const treeTrunks: number =
					scene
						.meshes
						.filter(
							(mesh) =>
								mesh.name.startsWith("tree-trunk"))
						.length;

				expect(treeTrunks)
					.toBe(TREE_COUNT);
			});

		it("should create the specified number of rocks",
			() =>
			{
				service.buildTrack(scene);

				const rocks: number =
					scene
						.meshes
						.filter(
							(mesh) => mesh.name.startsWith("rock"))
						.length;

				expect(rocks)
					.toBe(ROCK_COUNT);
			});

		it("should build road segments forming a complete track",
			() =>
			{
				service.buildTrack(scene);

				const roadSegments: number =
					scene
						.meshes
						.filter(
							(mesh) => mesh.name.startsWith("road"))
						.length;

				expect(roadSegments)
					.toBeGreaterThan(0);
			});

		it("should create white dashed center line on road",
			() =>
			{
				service.buildTrack(scene);

				const centerLines: number =
					scene
						.meshes
						.filter(
							(mesh) =>
								mesh.name.startsWith("center-line"))
						.length;

				expect(centerLines)
					.toBeGreaterThan(0);
			});

		it("should dispose all meshes on cleanup",
			() =>
			{
				service.buildTrack(scene);

				const meshCountBefore: number =
					scene.meshes.length;

				expect(meshCountBefore)
					.toBeGreaterThan(0);

				service.dispose();

				const trackMeshes: number =
					scene
						.meshes
						.filter(
							(mesh) =>
								mesh.name.startsWith("road")
									|| mesh.name.startsWith("tree")
									|| mesh.name.startsWith("rock")
									|| mesh.name.startsWith("center-line"))
						.length;

				expect(trackMeshes)
					.toBe(0);
			});

		describe("Hill Elevation",
			() =>
			{
				it("should set elevation on all road segments",
					() =>
					{
						service.buildTrack(scene);

						const segments: readonly RoadSegment[] =
							service.getSegments();

						for (const segment of segments)
						{
							expect(segment.elevation)
								.toBeDefined();
							expect(typeof segment.elevation)
								.toBe("number");
						}
					});

				it("should create at least 3 hills with elevation above HILL_MIN_HEIGHT",
					() =>
					{
						service.buildTrack(scene);

						const segments: readonly RoadSegment[] =
							service.getSegments();

						let hillCount: number = 0;
						let wasOnHill: boolean = false;

						for (const segment of segments)
						{
							if (segment.elevation >= HILL_MIN_HEIGHT)
							{
								if (!wasOnHill)
								{
									hillCount++;
								}
								wasOnHill = true;
							}
							else
							{
								wasOnHill = false;
							}
						}

						expect(hillCount)
							.toBeGreaterThanOrEqual(3);
					});

				it("should have smooth hill transitions with no sharp jumps",
					() =>
					{
						service.buildTrack(scene);

						const segments: readonly RoadSegment[] =
							service.getSegments();

						const maxDelta: number = 3;

						for (let idx: number = 1; idx < segments.length; idx++)
						{
							const delta: number =
								Math.abs(segments[idx].elevation - segments[idx - 1].elevation);

							expect(delta)
								.toBeLessThan(maxDelta);
						}
					});
			});
	});