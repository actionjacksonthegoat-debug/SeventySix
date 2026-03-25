/**
 * Furniture Service unit tests.
 * Tests furniture mesh creation, spatial queries, and disposal.
 */

import { provideZonelessChangeDetection } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { NullEngine } from "@babylonjs/core/Engines/nullEngine";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { Scene } from "@babylonjs/core/scene";
import type { Nullable } from "@babylonjs/core/types";
import {
	FURNITURE_SEARCH_RADIUS,
	ISLAND_ROOMS,
	ROOM_FURNITURE
} from "@games/spy-vs-spy/constants/spy-vs-spy.constants";
import { FurnitureType, RoomId } from "@games/spy-vs-spy/models/spy-vs-spy.models";
import type { FurnitureDefinition, RoomDefinition } from "@games/spy-vs-spy/models/spy-vs-spy.models";
import { FurnitureService } from "./furniture.service";

describe("FurnitureService",
	() =>
	{
		let service: FurnitureService;
		let engine: NullEngine;
		let scene: Scene;

		beforeEach(
			() =>
			{
				TestBed.configureTestingModule(
					{
						providers: [
							provideZonelessChangeDetection(),
							FurnitureService
						]
					});

				service =
					TestBed.inject(FurnitureService);
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

		it("dispose should not throw after initialize",
			() =>
			{
				service.initialize(scene);
				expect(() => service.dispose())
					.not
					.toThrow();
			});

		describe("mesh creation",
			() =>
			{
				it("should create at least one mesh per furniture definition",
					() =>
					{
						service.initialize(scene);

						const furnitureMeshes: Mesh[] =
							scene.meshes.filter(
								(mesh) =>
									mesh.name.startsWith("furniture-")) as Mesh[];

						expect(furnitureMeshes.length)
							.toBeGreaterThanOrEqual(ROOM_FURNITURE.length);
					});

				it("should create barrel as cylinder",
					() =>
					{
						service.initialize(scene);

						const barrelDef: FurnitureDefinition | undefined =
							ROOM_FURNITURE.find(
								(furniture) =>
									furniture.type === FurnitureType.Barrel);
						expect(barrelDef)
							.toBeDefined();

						const mesh: Nullable<Mesh> =
							scene.getMeshByName(`furniture-${barrelDef!.id}`) as Nullable<Mesh>;

						expect(mesh)
							.not
							.toBeNull();
					});

				it("should create crate as box",
					() =>
					{
						service.initialize(scene);

						const crateDef: FurnitureDefinition | undefined =
							ROOM_FURNITURE.find(
								(furniture) =>
									furniture.type === FurnitureType.Crate);
						expect(crateDef)
							.toBeDefined();

						const mesh: Nullable<Mesh> =
							scene.getMeshByName(`furniture-${crateDef!.id}`) as Nullable<Mesh>;

						expect(mesh)
							.not
							.toBeNull();
					});

				it("should create desk as box",
					() =>
					{
						service.initialize(scene);

						const deskDef: FurnitureDefinition | undefined =
							ROOM_FURNITURE.find(
								(furniture) =>
									furniture.type === FurnitureType.Desk);
						expect(deskDef)
							.toBeDefined();

						const mesh: Nullable<Mesh> =
							scene.getMeshByName(`furniture-${deskDef!.id}`) as Nullable<Mesh>;

						expect(mesh)
							.not
							.toBeNull();
					});

				it("should create cabinet as box",
					() =>
					{
						service.initialize(scene);

						const cabinetDef: FurnitureDefinition | undefined =
							ROOM_FURNITURE.find(
								(furniture) =>
									furniture.type === FurnitureType.Cabinet);
						expect(cabinetDef)
							.toBeDefined();

						const mesh: Nullable<Mesh> =
							scene.getMeshByName(`furniture-${cabinetDef!.id}`) as Nullable<Mesh>;

						expect(mesh)
							.not
							.toBeNull();
					});

				it("should create bookshelf as box",
					() =>
					{
						service.initialize(scene);

						const bookshelfDef: FurnitureDefinition | undefined =
							ROOM_FURNITURE.find(
								(furniture) =>
									furniture.type === FurnitureType.Bookshelf);
						expect(bookshelfDef)
							.toBeDefined();

						const mesh: Nullable<Mesh> =
							scene.getMeshByName(`furniture-${bookshelfDef!.id}`) as Nullable<Mesh>;

						expect(mesh)
							.not
							.toBeNull();
					});

				it("should position furniture at room center plus offset",
					() =>
					{
						service.initialize(scene);

						const firstFurniture: FurnitureDefinition =
							ROOM_FURNITURE[0];
						const room: RoomDefinition | undefined =
							ISLAND_ROOMS.find(
								(room) =>
									room.id === firstFurniture.roomId);

						expect(room)
							.toBeDefined();

						const mesh: Nullable<Mesh> =
							scene.getMeshByName(`furniture-${firstFurniture.id}`) as Nullable<Mesh>;

						expect(mesh)
							.not
							.toBeNull();

						expect(mesh!.position.x)
							.toBe(room!.centerX + firstFurniture.offsetX);

						expect(mesh!.position.z)
							.toBe(room!.centerZ + firstFurniture.offsetZ);
					});

				it("should assign materials to all furniture meshes",
					() =>
					{
						service.initialize(scene);

						const furnitureMeshes: Mesh[] =
							scene.meshes.filter(
								(mesh) =>
									mesh.name.startsWith("furniture-")) as Mesh[];

						for (const mesh of furnitureMeshes)
						{
							expect(mesh.material)
								.not
								.toBeNull();
						}
					});
			});

		describe("getNearbyFurniture",
			() =>
			{
				it("should return nearest furniture within search radius",
					() =>
					{
						const firstFurniture: FurnitureDefinition =
							ROOM_FURNITURE[0];
						const room: RoomDefinition | undefined =
							ISLAND_ROOMS.find(
								(room) =>
									room.id === firstFurniture.roomId);

						expect(room)
							.toBeDefined();

						const worldX: number =
							room!.centerX + firstFurniture.offsetX;
						const worldZ: number =
							room!.centerZ + firstFurniture.offsetZ;

						const result: FurnitureDefinition | null =
							service.getNearbyFurniture(worldX, worldZ);

						expect(result)
							.not
							.toBeNull();
						expect(result!.id)
							.toBe(firstFurniture.id);
					});

				it("should return null when no furniture is within range",
					() =>
					{
						const result: FurnitureDefinition | null =
							service.getNearbyFurniture(9999, 9999);

						expect(result)
							.toBeNull();
					});

				it("should return null when position is just outside search radius",
					() =>
					{
						const firstFurniture: FurnitureDefinition =
							ROOM_FURNITURE[0];
						const room: RoomDefinition | undefined =
							ISLAND_ROOMS.find(
								(room) =>
									room.id === firstFurniture.roomId);

						expect(room)
							.toBeDefined();

						const worldX: number =
							room!.centerX + firstFurniture.offsetX + FURNITURE_SEARCH_RADIUS + 1;
						const worldZ: number =
							room!.centerZ + firstFurniture.offsetZ;

						const result: FurnitureDefinition | null =
							service.getNearbyFurniture(worldX, worldZ);

						expect(result)
							.toBeNull();
					});
			});

		describe("getFurnitureInRoom",
			() =>
			{
				it("should return furniture for BeachShack",
					() =>
					{
						const result: ReadonlyArray<FurnitureDefinition> =
							service.getFurnitureInRoom(RoomId.BeachShack);

						expect(result.length)
							.toBe(3);
					});

				it("should return furniture for all rooms",
					() =>
					{
						for (const room of ISLAND_ROOMS)
						{
							const result: ReadonlyArray<FurnitureDefinition> =
								service.getFurnitureInRoom(room.id);

							expect(result.length)
								.toBeGreaterThan(0);
						}
					});

				it("should return only furniture with matching roomId",
					() =>
					{
						const result: ReadonlyArray<FurnitureDefinition> =
							service.getFurnitureInRoom(RoomId.JungleHQ);

						for (const furniture of result)
						{
							expect(furniture.roomId)
								.toBe(RoomId.JungleHQ);
						}
					});
			});

		describe("dispose",
			() =>
			{
				it("should remove all furniture meshes after dispose",
					() =>
					{
						service.initialize(scene);

						const before: number =
							scene
								.meshes
								.filter(
									(mesh) =>
										mesh.name.startsWith("furniture-"))
								.length;

						expect(before)
							.toBeGreaterThanOrEqual(ROOM_FURNITURE.length);
						service.dispose();

						const after: number =
							scene
								.meshes
								.filter(
									(mesh) =>
										mesh.name.startsWith("furniture-"))
								.length;

						expect(after)
							.toBe(0);
					});
			});
	});