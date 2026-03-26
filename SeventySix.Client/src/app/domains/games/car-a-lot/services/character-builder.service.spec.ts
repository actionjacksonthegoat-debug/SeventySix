/**
 * Character Builder Service unit tests.
 * Tests LEGO character creation, switching, and disposal.
 */

import { provideZonelessChangeDetection } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { NullEngine } from "@babylonjs/core/Engines/nullEngine";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { Scene } from "@babylonjs/core/scene";
import { CharacterType } from "@games/car-a-lot/models/car-a-lot.models";
import { CharacterBuilderService } from "@games/car-a-lot/services/character-builder.service";

describe("CharacterBuilderService",
	() =>
	{
		let service: CharacterBuilderService;
		let engine: NullEngine;
		let scene: Scene;
		let kartRoot: TransformNode;

		beforeEach(
			() =>
			{
				TestBed.configureTestingModule(
					{
						providers: [
							provideZonelessChangeDetection(),
							CharacterBuilderService
						]
					});

				service =
					TestBed.inject(CharacterBuilderService);
				engine =
					new NullEngine();
				scene =
					new Scene(engine);
				kartRoot =
					new TransformNode("kart-root", scene);
			});

		afterEach(
			() =>
			{
				service.dispose();
				kartRoot.dispose();
				scene.dispose();
				engine.dispose();
			});

		it("should create a character mesh hierarchy",
			() =>
			{
				service.createCharacter(scene, kartRoot);

				const charMeshes: AbstractMesh[] =
					scene.meshes.filter(
						(mesh) => mesh.name.startsWith("char-"));

				expect(charMeshes.length)
					.toBeGreaterThan(0);
			});

		it("should default to Princess character",
			() =>
			{
				service.createCharacter(scene, kartRoot);

				const princessHair: boolean =
					scene.meshes.some(
						(mesh) =>
							mesh.name === "char-hair-princess");

				expect(princessHair)
					.toBe(true);
			});

		it("should create character at oversized LEGO proportions",
			() =>
			{
				service.createCharacter(scene, kartRoot);

				const head: AbstractMesh | undefined =
					scene.meshes.find(
						(mesh) => mesh.name === "char-head");

				expect(head)
					.toBeTruthy();
				expect(head!.scaling.x)
					.toBeGreaterThanOrEqual(1.0);
			});

		it("should create LEGO head shape",
			() =>
			{
				service.createCharacter(scene, kartRoot);

				const head: boolean =
					scene.meshes.some(
						(mesh) => mesh.name === "char-head");

				expect(head)
					.toBe(true);
			});

		it("should create LEGO body shape",
			() =>
			{
				service.createCharacter(scene, kartRoot);

				const torso: boolean =
					scene.meshes.some(
						(mesh) => mesh.name === "char-torso");

				expect(torso)
					.toBe(true);
			});

		it("should create arms with C-shaped hands",
			() =>
			{
				service.createCharacter(scene, kartRoot);

				const hands: AbstractMesh[] =
					scene.meshes.filter(
						(mesh) =>
							mesh.name.startsWith("char-hand"));

				expect(hands.length)
					.toBe(2);
			});

		it("should create cape mesh",
			() =>
			{
				service.createCharacter(scene, kartRoot);

				const cape: boolean =
					scene.meshes.some(
						(mesh) => mesh.name === "char-cape");

				expect(cape)
					.toBe(true);
			});

		it("should switch character type",
			() =>
			{
				service.createCharacter(scene, kartRoot);
				service.setCharacterType(CharacterType.Prince);

				const princeHat: boolean =
					scene.meshes.some(
						(mesh) =>
							mesh.name === "char-hat-prince");

				expect(princeHat)
					.toBe(true);
			});

		it("should dispose old character when switching",
			() =>
			{
				service.createCharacter(scene, kartRoot);
				service.setCharacterType(CharacterType.Prince);

				const princessHair: boolean =
					scene.meshes.some(
						(mesh) =>
							mesh.name === "char-hair-princess");

				expect(princessHair)
					.toBe(false);
			});

		it("should create standing rescue character",
			() =>
			{
				service.createCharacter(scene, kartRoot);

				const rescue: TransformNode =
					service.createRescueCharacter(scene);

				expect(rescue)
					.toBeTruthy();
				expect(rescue.name)
					.toBe("char-rescue-root");
			});

		it("should dispose all meshes on cleanup",
			() =>
			{
				service.createCharacter(scene, kartRoot);

				const charCount: number =
					scene
						.meshes
						.filter(
							(mesh) => mesh.name.startsWith("char-"))
						.length;

				expect(charCount)
					.toBeGreaterThan(0);

				service.dispose();

				const remaining: number =
					scene
						.meshes
						.filter(
							(mesh) => mesh.name.startsWith("char-"))
						.length;

				expect(remaining)
					.toBe(0);
			});

		it("should preserve rescue character when switching character type",
			() =>
			{
				service.createCharacter(scene, kartRoot);
				service.createRescueCharacter(scene);

				const rescueBefore: boolean =
					scene.meshes.some(
						(mesh) =>
							mesh.name.startsWith("char-")
								&& mesh.parent != null
								&& hasAncestor(mesh, "char-rescue-root"));

				expect(rescueBefore)
					.toBe(true);

				service.setCharacterType(CharacterType.Prince);

				const rescueAfter: boolean =
					scene.meshes.some(
						(mesh) =>
							mesh.name.startsWith("char-")
								&& mesh.parent != null
								&& hasAncestor(mesh, "char-rescue-root"));

				expect(rescueAfter)
					.toBe(true);
			});

		it("should dispose only rescue meshes when disposeRescue runs via dispose-then-recreate",
			() =>
			{
				service.createCharacter(scene, kartRoot);
				service.createRescueCharacter(scene);

				const kartMeshesBefore: number =
					scene
						.meshes
						.filter(
							(mesh) =>
								mesh.name.startsWith("char-")
									&& !hasAncestor(mesh, "char-rescue-root"))
						.length;

				// Full dispose clears both
				service.dispose();

				const allAfter: number =
					scene
						.meshes
						.filter(
							(mesh) => mesh.name.startsWith("char-"))
						.length;

				expect(allAfter)
					.toBe(0);

				// Recreate only main — no rescue meshes should exist
				service.createCharacter(scene, kartRoot);

				const kartMeshesAfter: number =
					scene
						.meshes
						.filter(
							(mesh) =>
								mesh.name.startsWith("char-")
									&& !hasAncestor(mesh, "char-rescue-root"))
						.length;

				expect(kartMeshesAfter)
					.toBe(kartMeshesBefore);
			});

		it("should preserve main character when showVictoryStanding disposes seated character",
			() =>
			{
				service.createCharacter(scene, kartRoot);
				service.createRescueCharacter(scene);

				const rescueMeshesBefore: number =
					scene
						.meshes
						.filter(
							(mesh) =>
								hasAncestor(mesh, "char-rescue-root"))
						.length;

				expect(rescueMeshesBefore)
					.toBeGreaterThan(0);

				service.showVictoryStanding(
					scene,
					new Vector3(5, 0, 5));

				const rescueMeshesAfter: number =
					scene
						.meshes
						.filter(
							(mesh) =>
								hasAncestor(mesh, "char-rescue-root"))
						.length;

				expect(rescueMeshesAfter)
					.toBe(rescueMeshesBefore);
			});

		it("should create both characters independently after setCharacterType and createRescueCharacter",
			() =>
			{
				service.createCharacter(scene, kartRoot);
				service.setCharacterType(CharacterType.Prince);
				service.createRescueCharacter(scene);

				const kartCharMeshes: AbstractMesh[] =
					scene.meshes.filter(
						(mesh) =>
							mesh.name.startsWith("char-")
								&& !hasAncestor(mesh, "char-rescue-root"));

				const rescueMeshes: AbstractMesh[] =
					scene.meshes.filter(
						(mesh) =>
							hasAncestor(mesh, "char-rescue-root"));

				expect(kartCharMeshes.length)
					.toBeGreaterThan(0);
				expect(rescueMeshes.length)
					.toBeGreaterThan(0);
			});
	});

/**
 * Checks whether a mesh has an ancestor with the given name.
 * @param mesh - Mesh to check.
 * @param ancestorName - Ancestor node name to look for.
 * @returns True if any ancestor matches.
 */
function hasAncestor(
	mesh: AbstractMesh,
	ancestorName: string): boolean
{
	let current: TransformNode | null =
		mesh.parent as TransformNode | null;

	while (current != null)
	{
		if (current.name === ancestorName)
		{
			return true;
		}

		current =
			current.parent as TransformNode | null;
	}

	return false;
}