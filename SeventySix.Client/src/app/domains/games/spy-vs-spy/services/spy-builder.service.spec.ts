/**
 * Spy Builder Service unit tests.
 * Tests spy mesh construction, material coloring, metadata, disposal,
 * death animation, and stun effects.
 */

import { provideZonelessChangeDetection } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { NullEngine } from "@babylonjs/core/Engines/nullEngine";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import type { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { Scene } from "@babylonjs/core/scene";
import { DEATH_FLOAT_HEIGHT } from "@games/spy-vs-spy/constants/spy-vs-spy.constants";
import { SpyIdentity } from "@games/spy-vs-spy/models/spy-vs-spy.models";
import { SpyBuilderService } from "./spy-builder.service";

describe("SpyBuilderService",
	() =>
	{
		let service: SpyBuilderService;
		let engine: NullEngine;
		let scene: Scene;

		beforeEach(
			() =>
			{
				TestBed.configureTestingModule(
					{
						providers: [
							provideZonelessChangeDetection(),
							SpyBuilderService
						]
					});

				service =
					TestBed.inject(SpyBuilderService);
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

		it("buildSpy should return a non-null TransformNode for Black",
			() =>
			{
				const node: TransformNode =
					service.buildSpy(scene, SpyIdentity.Black);

				expect(node)
					.toBeTruthy();
				expect(node)
					.toBeInstanceOf(TransformNode);
			});

		it("buildSpy should return a different TransformNode for White",
			() =>
			{
				const blackNode: TransformNode =
					service.buildSpy(scene, SpyIdentity.Black);
				const whiteNode: TransformNode =
					service.buildSpy(scene, SpyIdentity.White);

				expect(whiteNode)
					.toBeTruthy();
				expect(whiteNode)
					.not
					.toBe(blackNode);
			});

		it("Black spy material color should be dark",
			() =>
			{
				const node: TransformNode =
					service.buildSpy(scene, SpyIdentity.Black);
				const childMeshes: AbstractMesh[] =
					node.getChildMeshes();

				expect(childMeshes.length)
					.toBeGreaterThan(0);

				const material: StandardMaterial =
					childMeshes[0].material as StandardMaterial;

				expect(material.diffuseColor.r)
					.toBeLessThan(0.2);
				expect(material.diffuseColor.g)
					.toBeLessThan(0.2);
				expect(material.diffuseColor.b)
					.toBeLessThan(0.2);
			});

		it("White spy material color should be light",
			() =>
			{
				const node: TransformNode =
					service.buildSpy(scene, SpyIdentity.White);
				const childMeshes: AbstractMesh[] =
					node.getChildMeshes();

				expect(childMeshes.length)
					.toBeGreaterThan(0);

				const material: StandardMaterial =
					childMeshes[0].material as StandardMaterial;

				expect(material.diffuseColor.r)
					.toBeGreaterThan(0.8);
				expect(material.diffuseColor.g)
					.toBeGreaterThan(0.8);
				expect(material.diffuseColor.b)
					.toBeGreaterThan(0.8);
			});

		it("spy mesh should have metadata.spyIdentity set correctly",
			() =>
			{
				const blackNode: TransformNode =
					service.buildSpy(scene, SpyIdentity.Black);
				const whiteNode: TransformNode =
					service.buildSpy(scene, SpyIdentity.White);

				expect(blackNode.metadata?.spyIdentity)
					.toBe(SpyIdentity.Black);
				expect(whiteNode.metadata?.spyIdentity)
					.toBe(SpyIdentity.White);
			});

		it("dispose should cleanly remove meshes without throwing",
			() =>
			{
				service.buildSpy(scene, SpyIdentity.Black);
				service.buildSpy(scene, SpyIdentity.White);

				expect(() => service.dispose())
					.not
					.toThrow();
			});

		describe("playDeathAnimation",
			() =>
			{
				it("should create a halo mesh on the spy node",
					() =>
					{
						const node: TransformNode =
							service.buildSpy(scene, SpyIdentity.Black);

						const childCountBefore: number =
							node.getChildMeshes().length;

						service.playDeathAnimation(node, scene);

						const childCountAfter: number =
							node.getChildMeshes().length;

						expect(childCountAfter)
							.toBeGreaterThan(childCountBefore);

						const haloMesh: AbstractMesh | undefined =
							node
								.getChildMeshes()
								.find(
									(mesh: AbstractMesh) =>
										mesh.name.includes("halo"));

						expect(haloMesh)
							.toBeTruthy();
					});

				it("should animate position to death float height",
					() =>
					{
						const node: TransformNode =
							service.buildSpy(scene, SpyIdentity.Black);
						const startY: number =
							node.position.y;

						service.playDeathAnimation(node, scene);

						const expectedTarget: number =
							startY + DEATH_FLOAT_HEIGHT;

						expect(expectedTarget)
							.toBeGreaterThan(startY);
					});

				it("should return a Promise",
					() =>
					{
						const node: TransformNode =
							service.buildSpy(scene, SpyIdentity.Black);

						const result: Promise<void> =
							service.playDeathAnimation(node, scene);

						expect(result)
							.toBeInstanceOf(Promise);
					});
			});

		describe("showStunEffect",
			() =>
			{
				it("should create stun star meshes on the spy node",
					() =>
					{
						const node: TransformNode =
							service.buildSpy(scene, SpyIdentity.Black);

						const childCountBefore: number =
							node.getChildMeshes().length;

						service.showStunEffect(node, scene);

						const childCountAfter: number =
							node.getChildMeshes().length;

						expect(childCountAfter)
							.toBeGreaterThan(childCountBefore);
					});

				it("should create exactly 3 stun star meshes",
					() =>
					{
						const node: TransformNode =
							service.buildSpy(scene, SpyIdentity.Black);

						service.showStunEffect(node, scene);

						const starMeshes: AbstractMesh[] =
							node
								.getChildMeshes()
								.filter(
									(mesh: AbstractMesh) =>
										mesh.name.includes("stun-star"));

						expect(starMeshes.length)
							.toBe(3);
					});

				it("should store stun stars in node metadata",
					() =>
					{
						const node: TransformNode =
							service.buildSpy(scene, SpyIdentity.Black);

						service.showStunEffect(node, scene);

						const stars: Mesh[] =
							node.metadata?.stunStars as Mesh[];

						expect(stars)
							.toBeTruthy();
						expect(stars.length)
							.toBe(3);
					});

				it("should use yellow emissive material for stars",
					() =>
					{
						const node: TransformNode =
							service.buildSpy(scene, SpyIdentity.Black);

						service.showStunEffect(node, scene);

						const starMesh: AbstractMesh | undefined =
							node
								.getChildMeshes()
								.find(
									(mesh: AbstractMesh) =>
										mesh.name.includes("stun-star"));

						expect(starMesh)
							.toBeTruthy();

						const material: StandardMaterial =
							starMesh!.material as StandardMaterial;

						expect(material.emissiveColor.r)
							.toBe(1);
						expect(material.emissiveColor.g)
							.toBe(1);
					});
			});

		describe("hideStunEffect",
			() =>
			{
				it("should remove stun star meshes from spy node",
					() =>
					{
						const node: TransformNode =
							service.buildSpy(scene, SpyIdentity.Black);

						service.showStunEffect(node, scene);

						const starsExist: boolean =
							node
								.getChildMeshes()
								.some(
									(mesh: AbstractMesh) =>
										mesh.name.includes("stun-star"));

						expect(starsExist)
							.toBe(true);

						service.hideStunEffect(node);

						const starsAfter: boolean =
							node
								.getChildMeshes()
								.some(
									(mesh: AbstractMesh) =>
										mesh.name.includes("stun-star"));

						expect(starsAfter)
							.toBe(false);
					});

				it("should clear stunStars from node metadata",
					() =>
					{
						const node: TransformNode =
							service.buildSpy(scene, SpyIdentity.Black);

						service.showStunEffect(node, scene);

						expect(node.metadata?.stunStars)
							.toBeTruthy();

						service.hideStunEffect(node);

						expect(node.metadata?.stunStars)
							.toBeUndefined();
					});

				it("should not throw when no stun effect exists",
					() =>
					{
						const node: TransformNode =
							service.buildSpy(scene, SpyIdentity.Black);

						expect(() => service.hideStunEffect(node))
							.not
							.toThrow();
					});

				it("should handle calling show twice by clearing first",
					() =>
					{
						const node: TransformNode =
							service.buildSpy(scene, SpyIdentity.Black);

						service.showStunEffect(node, scene);
						service.showStunEffect(node, scene);

						const starMeshes: AbstractMesh[] =
							node
								.getChildMeshes()
								.filter(
									(mesh: AbstractMesh) =>
										mesh.name.includes("stun-star"));

						expect(starMeshes.length)
							.toBe(3);
					});
			});
	});