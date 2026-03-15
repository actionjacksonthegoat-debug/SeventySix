/**
 * Kart Builder Service unit tests.
 * Tests kart mesh creation, color switching, and disposal.
 */

import { provideZonelessChangeDetection } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { NullEngine } from "@babylonjs/core/Engines/nullEngine";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { Scene } from "@babylonjs/core/scene";
import { KartColor } from "@sandbox/car-a-lot/models/car-a-lot.models";
import { KartBuilderService } from "@sandbox/car-a-lot/services/kart-builder.service";

describe("KartBuilderService",
	() =>
	{
		let service: KartBuilderService;
		let engine: NullEngine;
		let scene: Scene;

		beforeEach(
			() =>
			{
				TestBed.configureTestingModule(
					{
						providers: [
							provideZonelessChangeDetection(),
							KartBuilderService
						]
					});

				service =
					TestBed.inject(KartBuilderService);
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

		it("should create a kart with body mesh",
			() =>
			{
				service.createKart(scene);

				const body: boolean =
					scene.meshes.some(
						(mesh) => mesh.name === "kart-body");

				expect(body)
					.toBe(true);
			});

		it("should create 4 round wheel meshes",
			() =>
			{
				service.createKart(scene);

				const wheels: number =
					scene
						.meshes
						.filter(
							(mesh) =>
								mesh.name.startsWith("kart-wheel"))
						.length;

				expect(wheels)
					.toBe(4);
			});

		it("should create wheels with black material",
			() =>
			{
				service.createKart(scene);

				const wheel: AbstractMesh | undefined =
					scene.meshes.find(
						(mesh) =>
							mesh.name.startsWith("kart-wheel"));
				const wheelMaterial: StandardMaterial =
					wheel?.material as StandardMaterial;

				expect(wheelMaterial?.diffuseColor?.r)
					.toBeLessThan(0.2);
			});

		it("should create a center seat mesh",
			() =>
			{
				service.createKart(scene);

				const seat: boolean =
					scene.meshes.some(
						(mesh) => mesh.name === "kart-seat");

				expect(seat)
					.toBe(true);
			});

		it("should default to Pink kart color",
			() =>
			{
				service.createKart(scene);

				const body: AbstractMesh | undefined =
					scene.meshes.find(
						(mesh) => mesh.name === "kart-body");
				const bodyMaterial: StandardMaterial =
					body?.material as StandardMaterial;

				expect(bodyMaterial?.diffuseColor?.r)
					.toBeGreaterThan(0.8);
			});

		it("should change body color when setKartColor called",
			() =>
			{
				service.createKart(scene);
				service.setKartColor(KartColor.TealBlue);

				const body: AbstractMesh | undefined =
					scene.meshes.find(
						(mesh) => mesh.name === "kart-body");
				const bodyMaterial: StandardMaterial =
					body?.material as StandardMaterial;

				expect(bodyMaterial?.diffuseColor?.g)
					.toBeGreaterThan(0.4);
			});

		it("should preserve wheel color when body color changes",
			() =>
			{
				service.createKart(scene);
				service.setKartColor(KartColor.Red);

				const wheel: AbstractMesh | undefined =
					scene.meshes.find(
						(mesh) =>
							mesh.name.startsWith("kart-wheel"));
				const wheelMaterial: StandardMaterial =
					wheel?.material as StandardMaterial;

				expect(wheelMaterial?.diffuseColor?.r)
					.toBeLessThan(0.2);
			});

		it("should dispose all meshes on cleanup",
			() =>
			{
				service.createKart(scene);

				const meshCount: number =
					scene
						.meshes
						.filter(
							(mesh) => mesh.name.startsWith("kart"))
						.length;

				expect(meshCount)
					.toBeGreaterThan(0);

				service.dispose();

				const remaining: number =
					scene
						.meshes
						.filter(
							(mesh) => mesh.name.startsWith("kart"))
						.length;

				expect(remaining)
					.toBe(0);
			});
	});