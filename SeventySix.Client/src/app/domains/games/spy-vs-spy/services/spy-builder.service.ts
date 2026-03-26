// <copyright file="spy-builder.service.ts" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

/**
 * Spy Builder Service.
 * Creates Babylon.js mesh representations for each spy.
 * Single Responsibility: visual mesh construction only.
 * No physics, no game state — pure 3D geometry with materials.
 */

import { Injectable } from "@angular/core";
import { Animation } from "@babylonjs/core/Animations/animation";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { Scene } from "@babylonjs/core/scene";

import "@babylonjs/core/Animations/animatable";
import "@babylonjs/core/Shaders/default.vertex";
import "@babylonjs/core/Shaders/default.fragment";

import {
	DEATH_ANIMATION_SECONDS,
	DEATH_FLOAT_HEIGHT,
	HALO_RADIUS,
	SPY_GROUND_OFFSET,
	SPY_MESH_HEIGHT,
	SPY_MESH_RADIUS,
	STUN_STAR_COUNT,
	STUN_STAR_ORBIT_RADIUS,
	STUN_STAR_RADIUS
} from "@games/spy-vs-spy/constants/spy-vs-spy.constants";
import { SpyIdentity } from "@games/spy-vs-spy/models/spy-vs-spy.models";
import { isNullOrUndefined } from "@shared/utilities/null-check.utility";

/** Black spy body diffuse color. */
const BLACK_SPY_COLOR: Color3 =
	new Color3(0.12, 0.12, 0.14);

/** Black spy emissive tint for visibility against dark backgrounds. */
const BLACK_SPY_EMISSIVE: Color3 =
	new Color3(0.06, 0.06, 0.08);

/** White spy body diffuse color. */
const WHITE_SPY_COLOR: Color3 =
	new Color3(0.92, 0.92, 0.90);

/** White spy emissive tint for visibility against bright backgrounds. */
const WHITE_SPY_EMISSIVE: Color3 =
	new Color3(0.12, 0.12, 0.10);

/** Hat brim diameter. */
const HAT_BRIM_DIAMETER: number = 1.2;

/** Hat brim height (thickness). */
const HAT_BRIM_HEIGHT: number = 0.1;

/** Hat crown diameter. */
const HAT_CROWN_DIAMETER: number = 0.7;

/** Hat crown height. */
const HAT_CROWN_HEIGHT: number = 0.7;

/** Eye sphere radius. */
const EYE_RADIUS: number = 0.12;

/** Eye horizontal offset from center. */
const EYE_HORIZONTAL_OFFSET: number = 0.15;

/** Eye vertical offset from body top. */
const EYE_VERTICAL_OFFSET: number = 0.3;

/** Eye forward offset from body center. */
const EYE_FORWARD_OFFSET: number = 0.3;

/** Eye emissive color (white glow). */
const EYE_EMISSIVE_COLOR: Color3 =
	new Color3(1, 1, 1);

/** Pointed nose cone length. */
const NOSE_LENGTH: number = 0.7;

/** Pointed nose cone diameter at base. */
const NOSE_BASE_DIAMETER: number = 0.30;

/** Ground marker disc diameter for top-down visibility. */
const GROUND_MARKER_DIAMETER: number = 3.0;

/** Ground marker disc Y offset above ground plane. */
const GROUND_MARKER_Y_OFFSET: number = 0.05;

/** Black spy ground marker emissive color (cyan glow). */
const BLACK_MARKER_COLOR: Color3 =
	new Color3(0, 0.7, 0.9);

/** White spy ground marker emissive color (yellow glow). */
const WHITE_MARKER_COLOR: Color3 =
	new Color3(0.9, 0.8, 0);

/** Disposable resource contract. */
interface Disposable
{
	/** Release resources. */
	dispose(): void;
}

/**
 * Creates procedural spy meshes with body, hat, and eye indicators.
 * Domain-scoped — provided via route `providers` array.
 */
@Injectable()
export class SpyBuilderService
{
	/** References to disposable resources for cleanup. */
	private readonly disposables: Disposable[] = [];

	/**
	 * Builds the spy mesh hierarchy for the given identity.
	 * Returns a TransformNode root containing body + hat sub-meshes.
	 * @param scene
	 * The Babylon.js Scene to create meshes in.
	 * @param identity
	 * Which spy to build (Black or White).
	 * @returns
	 * A TransformNode root parenting the spy mesh hierarchy.
	 */
	buildSpy(
		scene: Scene,
		identity: SpyIdentity): TransformNode
	{
		const spyName: string =
			`spy-${identity.toLowerCase()}`;

		const root: TransformNode =
			new TransformNode(
				`${spyName}-root`,
				scene);

		root.metadata =
			{ spyIdentity: identity };

		const spyColor: Color3 =
			identity === SpyIdentity.Black
				? BLACK_SPY_COLOR
				: WHITE_SPY_COLOR;

		const spyEmissive: Color3 =
			identity === SpyIdentity.Black
				? BLACK_SPY_EMISSIVE
				: WHITE_SPY_EMISSIVE;

		const bodyMaterial: StandardMaterial =
			this.createMaterial(
				`${spyName}-body-mat`,
				spyColor,
				scene,
				spyEmissive);

		this.createBody(
			spyName,
			bodyMaterial,
			root,
			scene);

		this.createHat(
			spyName,
			bodyMaterial,
			root,
			scene);

		this.createEyes(
			spyName,
			root,
			scene);

		this.createNose(
			spyName,
			bodyMaterial,
			root,
			scene);

		this.createGroundMarker(
			spyName,
			identity,
			root,
			scene);

		root.position.y = SPY_GROUND_OFFSET;

		return root;
	}

	/**
	 * Plays the cartoon death animation: halo appears, spy floats upward, fades out.
	 * Resolves after DEATH_ANIMATION_SECONDS, then resets spy to starting Y.
	 * @param spyNode
	 * The spy root TransformNode.
	 * @param scene
	 * The Babylon.js Scene.
	 * @returns
	 * A Promise that resolves when the animation completes.
	 */
	playDeathAnimation(
		spyNode: TransformNode,
		scene: Scene): Promise<void>
	{
		const halo: Mesh =
			this.createHaloMesh(spyNode, scene);

		const startY: number =
			spyNode.position.y;
		const targetY: number =
			startY + DEATH_FLOAT_HEIGHT;
		const frameRate: number = 30;
		const totalFrames: number =
			frameRate * DEATH_ANIMATION_SECONDS;

		const floatAnimation: Animation =
			this.buildFloatAnimation(
				spyNode,
				startY,
				targetY,
				frameRate,
				totalFrames);

		const bodyMeshes: Mesh[] =
			spyNode.getChildMeshes(false) as Mesh[];

		const fadeAnimations: Animation[] =
			this.buildFadeAnimations(
				bodyMeshes,
				frameRate,
				totalFrames);

		return new Promise<void>(
			(resolve: () => void) =>
			{
				scene.beginDirectAnimation(
					spyNode,
					[floatAnimation],
					0,
					totalFrames,
					false,
					1);

				bodyMeshes.forEach(
					(mesh: Mesh, index: number) =>
					{
						scene.beginDirectAnimation(
							mesh,
							[fadeAnimations[index]],
							0,
							totalFrames,
							false,
							1,
							() =>
							{
								if (index === bodyMeshes.length - 1)
								{
									this.resetAfterDeath(
										spyNode,
										halo,
										startY);
									resolve();
								}
							});
					});
			});
	}

	/**
	 * Creates stun star spheres orbiting above the spy's head.
	 * Stars are parented to the spy node for automatic positioning.
	 * @param spyNode
	 * The spy root TransformNode.
	 * @param scene
	 * The Babylon.js Scene.
	 */
	showStunEffect(
		spyNode: TransformNode,
		scene: Scene): void
	{
		this.hideStunEffect(spyNode);

		const starMaterial: StandardMaterial =
			new StandardMaterial(
				`${spyNode.name}-stun-mat`,
				scene);

		starMaterial.emissiveColor =
			new Color3(1, 1, 0);

		this.disposables.push(starMaterial);

		const stars: Mesh[] = [];

		for (let idx: number = 0; idx < STUN_STAR_COUNT; idx++)
		{
			const angle: number =
				(idx / STUN_STAR_COUNT) * Math.PI * 2;

			const star: Mesh =
				MeshBuilder.CreateSphere(
					`${spyNode.name}-stun-star-${idx}`,
					{ diameter: STUN_STAR_RADIUS * 2 },
					scene);

			star.material = starMaterial;
			star.parent = spyNode;
			star.position.set(
				Math.cos(angle) * STUN_STAR_ORBIT_RADIUS,
				SPY_MESH_HEIGHT / 2 + 0.6,
				Math.sin(angle) * STUN_STAR_ORBIT_RADIUS);

			star.metadata =
				{ stunStar: true, starIndex: idx };

			this.disposables.push(star);
			stars.push(star);
		}

		spyNode.metadata =
			{
				...spyNode.metadata,
				stunStars: stars
			};
	}

	/**
	 * Removes stun star meshes from the spy node.
	 * @param spyNode
	 * The spy root TransformNode to clear stun effects from.
	 */
	hideStunEffect(spyNode: TransformNode): void
	{
		const stars: Mesh[] | undefined =
			spyNode.metadata?.stunStars as Mesh[] | undefined;

		if (isNullOrUndefined(stars))
		{
			return;
		}

		for (const star of stars)
		{
			star.dispose();
		}

		spyNode.metadata =
			{
				...spyNode.metadata,
				stunStars: undefined
			};
	}

	/**
	 * Dispose all created meshes and materials.
	 */
	dispose(): void
	{
		for (const disposable of this.disposables)
		{
			disposable.dispose();
		}

		this.disposables.length = 0;
	}

	/**
	 * Creates the halo torus mesh for the death animation.
	 * @param spyNode
	 * The spy root TransformNode.
	 * @param scene
	 * The Babylon.js Scene.
	 * @returns
	 * The created halo mesh.
	 */
	private createHaloMesh(
		spyNode: TransformNode,
		scene: Scene): Mesh
	{
		const haloMaterial: StandardMaterial =
			new StandardMaterial(
				`${spyNode.name}-halo-mat`,
				scene);

		haloMaterial.emissiveColor =
			new Color3(1, 1, 0);
		haloMaterial.alpha = 0.8;

		this.disposables.push(haloMaterial);

		const halo: Mesh =
			MeshBuilder.CreateTorus(
				`${spyNode.name}-halo`,
				{
					diameter: HALO_RADIUS * 2,
					thickness: 0.08,
					tessellation: 24
				},
				scene);

		halo.material = haloMaterial;
		halo.parent = spyNode;
		halo.position.y =
			SPY_MESH_HEIGHT / 2 + 0.8;

		this.disposables.push(halo);

		return halo;
	}

	/**
	 * Builds the float-up position animation for the death sequence.
	 * @param spyNode
	 * The spy root TransformNode.
	 * @param startY
	 * Starting Y position.
	 * @param targetY
	 * Target Y position.
	 * @param frameRate
	 * Animation frame rate.
	 * @param totalFrames
	 * Total animation frames.
	 * @returns
	 * The float position animation.
	 */
	private buildFloatAnimation(
		spyNode: TransformNode,
		startY: number,
		targetY: number,
		frameRate: number,
		totalFrames: number): Animation
	{
		const floatAnimation: Animation =
			new Animation(
				`${spyNode.name}-death-float`,
				"position.y",
				frameRate,
				Animation.ANIMATIONTYPE_FLOAT,
				Animation.ANIMATIONLOOPMODE_CONSTANT);

		floatAnimation.setKeys(
			[
				{ frame: 0, value: startY },
				{ frame: totalFrames, value: targetY }
			]);

		return floatAnimation;
	}

	/**
	 * Builds per-mesh fade-out visibility animations.
	 * @param bodyMeshes
	 * Child meshes to animate.
	 * @param frameRate
	 * Animation frame rate.
	 * @param totalFrames
	 * Total animation frames.
	 * @returns
	 * Array of fade animations, one per mesh.
	 */
	private buildFadeAnimations(
		bodyMeshes: ReadonlyArray<Mesh>,
		frameRate: number,
		totalFrames: number): Animation[]
	{
		return bodyMeshes.map(
			(mesh: Mesh, index: number) =>
			{
				const fadeAnim: Animation =
					new Animation(
						`${mesh.name}-fade-${index}`,
						"visibility",
						frameRate,
						Animation.ANIMATIONTYPE_FLOAT,
						Animation.ANIMATIONLOOPMODE_CONSTANT);

				fadeAnim.setKeys(
					[
						{ frame: 0, value: 1 },
						{ frame: totalFrames, value: 0 }
					]);

				return fadeAnim;
			});
	}

	/**
	 * Resets spy state after the death animation completes.
	 * @param spyNode
	 * The spy root TransformNode.
	 * @param halo
	 * The halo mesh to dispose.
	 * @param startY
	 * Original Y position to restore.
	 */
	private resetAfterDeath(
		spyNode: TransformNode,
		halo: Mesh,
		startY: number): void
	{
		halo.dispose();
		spyNode.position.y = startY;

		const bodyMeshes: Mesh[] =
			spyNode.getChildMeshes(false) as Mesh[];

		for (const childMesh of bodyMeshes)
		{
			childMesh.visibility = 1;
		}
	}

	/**
	 * Create a StandardMaterial with the given diffuse color.
	 * @param name
	 * Material name.
	 * @param color
	 * Diffuse color.
	 * @param scene
	 * The Babylon.js Scene.
	 * @returns
	 * The created material.
	 */
	private createMaterial(
		name: string,
		color: Color3,
		scene: Scene,
		emissive?: Color3): StandardMaterial
	{
		const material: StandardMaterial =
			new StandardMaterial(name, scene);

		material.diffuseColor = color;
		material.specularColor =
			new Color3(0.3, 0.3, 0.3);
		material.specularPower = 32;

		if (emissive != null)
		{
			material.emissiveColor = emissive;
		}

		this.disposables.push(material);
		return material;
	}

	/**
	 * Create the spy body capsule mesh.
	 * @param spyName
	 * Base name prefix.
	 * @param material
	 * Body material to apply.
	 * @param parent
	 * Parent TransformNode.
	 * @param scene
	 * The Babylon.js Scene.
	 */
	private createBody(
		spyName: string,
		material: StandardMaterial,
		parent: TransformNode,
		scene: Scene): void
	{
		const body: Mesh =
			MeshBuilder.CreateCapsule(
				`${spyName}-body`,
				{
					height: SPY_MESH_HEIGHT,
					radius: SPY_MESH_RADIUS
				},
				scene);

		body.material = material;
		body.parent = parent;

		this.disposables.push(body);

		this.createArms(spyName, material, parent, scene);
		this.createLegs(spyName, material, parent, scene);
	}

	/**
	 * Create thin gangly arms extending from shoulders (matching the 1984 spy silhouette).
	 * @param spyName
	 * Base name prefix.
	 * @param material
	 * Body material to apply.
	 * @param parent
	 * Parent TransformNode.
	 * @param scene
	 * The Babylon.js Scene.
	 */
	private createArms(
		spyName: string,
		material: StandardMaterial,
		parent: TransformNode,
		scene: Scene): void
	{
		const armLength: number = 0.8;
		const armDiameter: number = 0.18;
		const shoulderY: number =
			SPY_MESH_HEIGHT / 2 - 0.35;
		const shoulderOffset: number =
			SPY_MESH_RADIUS + 0.05;

		for (const side of ["left", "right"] as const)
		{
			const xSign: number =
				side === "left" ? -1 : 1;

			const arm: Mesh =
				MeshBuilder.CreateCylinder(
					`${spyName}-arm-${side}`,
					{
						diameter: armDiameter,
						height: armLength,
						tessellation: 8
					},
					scene);

			arm.material = material;
			arm.parent = parent;
			arm.position.set(
				xSign * shoulderOffset,
				shoulderY - armLength / 2,
				0);

			this.disposables.push(arm);
		}
	}

	/**
	 * Create thin legs extending from lower body (matching the 1984 spy silhouette).
	 * @param spyName
	 * Base name prefix.
	 * @param material
	 * Body material to apply.
	 * @param parent
	 * Parent TransformNode.
	 * @param scene
	 * The Babylon.js Scene.
	 */
	private createLegs(
		spyName: string,
		material: StandardMaterial,
		parent: TransformNode,
		scene: Scene): void
	{
		const legLength: number = 0.7;
		const legDiameter: number = 0.20;
		const hipY: number =
			-SPY_MESH_HEIGHT / 2 + 0.2;
		const hipOffset: number = 0.15;

		for (const side of ["left", "right"] as const)
		{
			const xSign: number =
				side === "left" ? -1 : 1;

			const leg: Mesh =
				MeshBuilder.CreateCylinder(
					`${spyName}-leg-${side}`,
					{
						diameter: legDiameter,
						height: legLength,
						tessellation: 8
					},
					scene);

			leg.material = material;
			leg.parent = parent;
			leg.position.set(
				xSign * hipOffset,
				hipY - legLength / 2,
				0);

			this.disposables.push(leg);

			/* Oversized shoe at the foot of each leg. */
			const shoe: Mesh =
				MeshBuilder.CreateBox(
					`${spyName}-shoe-${side}`,
					{
						width: 0.22,
						height: 0.12,
						depth: 0.35
					},
					scene);

			shoe.material = material;
			shoe.parent = parent;
			shoe.position.set(
				xSign * hipOffset,
				hipY - legLength - 0.06,
				0.08);

			this.disposables.push(shoe);
		}
	}

	/**
	 * Create the spy fedora hat (brim + crown cylinders).
	 * @param spyName
	 * Base name prefix.
	 * @param material
	 * Hat material to apply.
	 * @param parent
	 * Parent TransformNode.
	 * @param scene
	 * The Babylon.js Scene.
	 */
	private createHat(
		spyName: string,
		material: StandardMaterial,
		parent: TransformNode,
		scene: Scene): void
	{
		const hatY: number =
			SPY_MESH_HEIGHT / 2;

		const brim: Mesh =
			MeshBuilder.CreateCylinder(
				`${spyName}-hat-brim`,
				{
					diameter: HAT_BRIM_DIAMETER,
					height: HAT_BRIM_HEIGHT
				},
				scene);

		brim.material = material;
		brim.parent = parent;
		brim.position.y = hatY;

		this.disposables.push(brim);

		const crown: Mesh =
			MeshBuilder.CreateCylinder(
				`${spyName}-hat-crown`,
				{
					diameter: HAT_CROWN_DIAMETER,
					height: HAT_CROWN_HEIGHT
				},
				scene);

		crown.material = material;
		crown.parent = parent;
		crown.position.y =
			hatY + HAT_BRIM_HEIGHT / 2 + HAT_CROWN_HEIGHT / 2;

		this.disposables.push(crown);
	}

	/**
	 * Create eye indicator spheres (white emissive).
	 * @param spyName
	 * Base name prefix.
	 * @param parent
	 * Parent TransformNode.
	 * @param scene
	 * The Babylon.js Scene.
	 */
	private createEyes(
		spyName: string,
		parent: TransformNode,
		scene: Scene): void
	{
		const eyeMaterial: StandardMaterial =
			new StandardMaterial(
				`${spyName}-eye-mat`,
				scene);

		eyeMaterial.emissiveColor = EYE_EMISSIVE_COLOR;

		this.disposables.push(eyeMaterial);

		const eyeY: number =
			SPY_MESH_HEIGHT / 2 - EYE_VERTICAL_OFFSET;

		const leftEye: Mesh =
			MeshBuilder.CreateSphere(
				`${spyName}-eye-left`,
				{ diameter: EYE_RADIUS * 2 },
				scene);

		leftEye.material = eyeMaterial;
		leftEye.parent = parent;
		leftEye.position.set(
			-EYE_HORIZONTAL_OFFSET,
			eyeY,
			EYE_FORWARD_OFFSET);

		this.disposables.push(leftEye);

		const rightEye: Mesh =
			MeshBuilder.CreateSphere(
				`${spyName}-eye-right`,
				{ diameter: EYE_RADIUS * 2 },
				scene);

		rightEye.material = eyeMaterial;
		rightEye.parent = parent;
		rightEye.position.set(
			EYE_HORIZONTAL_OFFSET,
			eyeY,
			EYE_FORWARD_OFFSET);

		this.disposables.push(rightEye);
	}

	/**
	 * Create the iconic pointed nose cone extending forward from the face.
	 * @param spyName
	 * Base name prefix.
	 * @param material
	 * Body material to apply.
	 * @param parent
	 * Parent TransformNode.
	 * @param scene
	 * The Babylon.js Scene.
	 */
	private createNose(
		spyName: string,
		material: StandardMaterial,
		parent: TransformNode,
		scene: Scene): void
	{
		const nose: Mesh =
			MeshBuilder.CreateCylinder(
				`${spyName}-nose`,
				{
					diameterTop: 0,
					diameterBottom: NOSE_BASE_DIAMETER,
					height: NOSE_LENGTH,
					tessellation: 12
				},
				scene);

		nose.material = material;
		nose.parent = parent;

		/* Position at face level, rotated to point forward. */
		nose.position.set(
			0,
			SPY_MESH_HEIGHT / 2 - EYE_VERTICAL_OFFSET - 0.05,
			SPY_MESH_RADIUS + NOSE_LENGTH / 2);
		nose.rotation.x =
			Math.PI / 2;

		this.disposables.push(nose);
	}

	/**
	 * Create a glowing ground marker disc beneath the spy for top-down visibility.
	 * @param spyName
	 * Base name prefix.
	 * @param identity
	 * Spy identity for color selection.
	 * @param parent
	 * Parent TransformNode.
	 * @param scene
	 * The Babylon.js Scene.
	 */
	private createGroundMarker(
		spyName: string,
		identity: SpyIdentity,
		parent: TransformNode,
		scene: Scene): void
	{
		const disc: Mesh =
			MeshBuilder.CreateDisc(
				`${spyName}-marker`,
				{
					radius: GROUND_MARKER_DIAMETER / 2,
					tessellation: 24
				},
				scene);

		const markerColor: Color3 =
			identity === SpyIdentity.Black
				? BLACK_MARKER_COLOR
				: WHITE_MARKER_COLOR;

		const material: StandardMaterial =
			new StandardMaterial(
				`${spyName}-marker-mat`,
				scene);

		material.diffuseColor = markerColor;
		material.emissiveColor = markerColor;
		material.alpha = 0.7;

		disc.material = material;
		disc.parent = parent;

		/* Lay flat on ground, slightly above to prevent z-fighting. */
		disc.rotation.x =
			Math.PI / 2;
		disc.position.y =
			-SPY_GROUND_OFFSET + GROUND_MARKER_Y_OFFSET;

		this.disposables.push(disc);
		this.disposables.push(material);
	}
}