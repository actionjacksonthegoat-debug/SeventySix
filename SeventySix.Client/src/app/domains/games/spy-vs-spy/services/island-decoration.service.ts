// <copyright file="island-decoration.service.ts" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

import { Injectable } from "@angular/core";

import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { DynamicTexture } from "@babylonjs/core/Materials/Textures/dynamicTexture";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { Scene } from "@babylonjs/core/scene";

import type { ICanvasRenderingContext } from "@babylonjs/core/Engines/ICanvas";

import { ISLAND_GROUND_Y, ISLAND_ROOMS, ROOM_WALL_HEIGHT } from "@games/spy-vs-spy/constants/spy-vs-spy.constants";
import { RoomId } from "@games/spy-vs-spy/models/spy-vs-spy.models";

import type { RoomDefinition } from "@games/spy-vs-spy/models/spy-vs-spy.models";

/** Parameters for creating a single door outline (frame + panel + knob). */
interface DoorOutlineParams
{
	/** The Babylon.js Scene. */
	readonly scene: Scene;
	/** Room definition for color lookup. */
	readonly room: RoomDefinition;
	/** Cardinal direction label for naming. */
	readonly direction: string;
	/** Door center X position. */
	readonly x: number;
	/** Door center Y position. */
	readonly y: number;
	/** Door center Z position. */
	readonly z: number;
	/** Width of the door panel. */
	readonly doorWidth: number;
	/** Height of the door panel. */
	readonly doorHeight: number;
	/** Frame border thickness. */
	readonly frameThickness: number;
	/** Whether the door is on a horizontal (north/south) wall. */
	readonly isHorizontalWall: boolean;
}

/** Parameters for creating a wall-mounted decoration. */
interface WallMountParams
{
	/** The Babylon.js Scene. */
	readonly scene: Scene;
	/** Mesh name. */
	readonly name: string;
	/** World X position. */
	readonly x: number;
	/** World Y position. */
	readonly y: number;
	/** World Z position. */
	readonly z: number;
	/** Y-axis rotation. */
	readonly rotationY: number;
}

/** Parameters for creating a wall-mounted picture. */
interface WallPictureParams extends WallMountParams
{
	/** Picture fill color. */
	readonly colorHex: string;
}

/** Room theme color mapping — bold, distinct colors matching 1984 aesthetic. */
const ROOM_COLORS: ReadonlyMap<RoomId, string> =
	new Map<RoomId, string>(
		[
			[RoomId.BeachShack, "#E8C872"],
			[RoomId.JungleHQ, "#2E8B2E"],
			[RoomId.Watchtower, "#A0A0A0"],
			[RoomId.CoveCave, "#7B5236"],
			[RoomId.Compound, "#C0C0C0"],
			[RoomId.Library, "#787878"]
		]);

/** Island ground color (sandy tan) — fallback when room color is not found. */
const ISLAND_GROUND_COLOR: string = "#C2A267";

/** Width of each door opening in world units. */
const DOOR_WIDTH: number = 1.8;

/** Height of each door opening in world units. */
const DOOR_HEIGHT: number = 2.5;

/** Frame border thickness in world units. */
const DOOR_FRAME_THICKNESS: number = 0.08;

/**
 * Creates decorative elements for island rooms: ceilings, labels, door
 * outlines, wall-mounted pictures, and clocks.
 */
@Injectable()
export class IslandDecorationService
{
	/** Tracks all disposable Babylon.js objects created by this service. */
	private readonly disposables: Array<{ dispose(): void; }> = [];

	/**
	 * Initializes all room decorations in the scene.
	 * @param scene
	 *   The Babylon.js Scene to populate with decorations.
	 */
	public initialize(scene: Scene): void
	{
		this.createRoomCeilings(scene);
		this.createRoomLabels(scene);
		this.createWallDecorations(scene);
		this.createDoorOutlines(scene);
	}

	/** Disposes all Babylon.js resources created by this service. */
	public dispose(): void
	{
		for (const disposable of this.disposables)
		{
			disposable.dispose();
		}

		this.disposables.length = 0;
	}

	/**
	 * Creates semi-transparent ceilings for every island room.
	 * @param scene
	 *   The Babylon.js Scene.
	 */
	private createRoomCeilings(scene: Scene): void
	{
		for (const room of ISLAND_ROOMS)
		{
			const colorHex: string =
				ROOM_COLORS.get(room.id) ?? ISLAND_GROUND_COLOR;
			const ceilingY: number =
				ISLAND_GROUND_Y + ROOM_WALL_HEIGHT;

			const ceilingMaterial: StandardMaterial =
				new StandardMaterial(
					`room-ceiling-mat-${room.id}`,
					scene);

			ceilingMaterial.diffuseColor =
				Color3
					.FromHexString(colorHex)
					.scale(0.6);
			ceilingMaterial.specularColor =
				new Color3(0.05, 0.05, 0.05);
			ceilingMaterial.alpha = 0.35;
			ceilingMaterial.backFaceCulling = false;

			this.disposables.push(ceilingMaterial);

			const ceiling: Mesh =
				MeshBuilder.CreateBox(
					`room-ceiling-${room.id}`,
					{
						width: room.halfWidth * 2,
						height: 0.08,
						depth: room.halfDepth * 2
					},
					scene);

			ceiling.material = ceilingMaterial;
			ceiling.position.set(
				room.centerX,
				ceilingY,
				room.centerZ);
			this.disposables.push(ceiling);
		}
	}

	/**
	 * Creates floating labels above every island room.
	 * @param scene
	 *   The Babylon.js Scene.
	 */
	private createRoomLabels(scene: Scene): void
	{
		for (const room of ISLAND_ROOMS)
		{
			this.createRoomLabel(scene, room);
		}
	}

	/**
	 * Creates a single billboard-style room label above a room.
	 * @param scene
	 *   The Babylon.js Scene.
	 * @param room
	 *   The room definition used for positioning and naming.
	 */
	private createRoomLabel(
		scene: Scene,
		room: RoomDefinition): void
	{
		const planeWidth: number = 8;
		const planeHeight: number = 1.5;

		const plane: Mesh =
			MeshBuilder.CreatePlane(
				`room-label-${room.id}`,
				{
					width: planeWidth,
					height: planeHeight
				},
				scene);

		plane.position.x =
			room.centerX;
		plane.position.y =
			ISLAND_GROUND_Y + ROOM_WALL_HEIGHT + 2.5;
		plane.position.z =
			room.centerZ;
		plane.rotation.x =
			Math.PI / 6;
		plane.billboardMode =
			Mesh.BILLBOARDMODE_Y;

		const labelTexture: DynamicTexture =
			this.createRoomLabelTexture(scene, room);

		const material: StandardMaterial =
			new StandardMaterial(
				`room-label-material-${room.id}`,
				scene);

		material.diffuseTexture = labelTexture;
		material.emissiveColor =
			new Color3(0.5, 0.5, 0.5);
		material.useAlphaFromDiffuseTexture = true;
		material.backFaceCulling = false;

		plane.material = material;

		this.disposables.push(plane);
		this.disposables.push(material);
		this.disposables.push(labelTexture);
	}

	/**
	 * Creates and draws the dynamic texture for a room label.
	 * @param scene
	 * The Babylon.js Scene.
	 * @param room
	 * The room definition used for the label text.
	 * @returns The configured DynamicTexture.
	 */
	private createRoomLabelTexture(
		scene: Scene,
		room: RoomDefinition): DynamicTexture
	{
		const labelTexture: DynamicTexture =
			new DynamicTexture(
				`room-label-tex-${room.id}`,
				{ width: 512, height: 96 },
				scene,
				false);

		const ctx: ICanvasRenderingContext | null =
			labelTexture.getContext();

		if (ctx != null)
		{
			ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
			ctx.fillRect(0, 0, 512, 96);

			labelTexture.update();

			labelTexture.drawText(
				room.displayName.toUpperCase(),
				null,
				64,
				"bold 48px Courier New",
				"#00FF00",
				null,
				true,
				true);
		}

		labelTexture.hasAlpha = true;

		return labelTexture;
	}

	/**
	 * Creates door outlines (frame, panel, knob) for every room connection.
	 * @param scene
	 *   The Babylon.js Scene.
	 */
	private createDoorOutlines(scene: Scene): void
	{
		for (const room of ISLAND_ROOMS)
		{
			this.createRoomNorthDoor(scene, room);
			this.createConditionalSideDoor(scene, room, "east");
			this.createConditionalSideDoor(scene, room, "west");
		}
	}

	/**
	 * Creates the north wall door outline for a room.
	 * @param scene
	 * The Babylon.js Scene.
	 * @param room
	 * The room definition.
	 */
	private createRoomNorthDoor(
		scene: Scene,
		room: RoomDefinition): void
	{
		const doorY: number =
			ISLAND_GROUND_Y + DOOR_HEIGHT / 2;

		this.createSingleDoorOutline(
			{
				scene,
				room,
				direction: "north",
				x: room.centerX,
				y: doorY,
				z: room.centerZ - room.halfDepth + 0.05,
				doorWidth: DOOR_WIDTH,
				doorHeight: DOOR_HEIGHT,
				frameThickness: DOOR_FRAME_THICKNESS,
				isHorizontalWall: true
			});
	}

	/**
	 * Creates a side wall door outline if the room connects in that direction.
	 * @param scene
	 * The Babylon.js Scene.
	 * @param room
	 * The room definition.
	 * @param direction
	 * The side wall direction: east or west.
	 */
	private createConditionalSideDoor(
		scene: Scene,
		room: RoomDefinition,
		direction: "east" | "west"): void
	{
		const isEast: boolean =
			direction === "east";
		const connectedRooms: ReadonlyArray<RoomDefinition> =
			ISLAND_ROOMS.filter(
				(roomDef: RoomDefinition) =>
					room.connections.includes(roomDef.id));

		const hasConnection: boolean =
			connectedRooms.some(
				(roomDef: RoomDefinition) =>
					isEast
						? roomDef.centerX > room.centerX
						: roomDef.centerX < room.centerX);

		if (!hasConnection)
		{
			return;
		}

		const doorY: number =
			ISLAND_GROUND_Y + DOOR_HEIGHT / 2;
		const doorX: number =
			isEast
				? room.centerX + room.halfWidth - 0.05
				: room.centerX - room.halfWidth + 0.05;

		this.createSingleDoorOutline(
			{
				scene,
				room,
				direction,
				x: doorX,
				y: doorY,
				z: room.centerZ,
				doorWidth: DOOR_WIDTH,
				doorHeight: DOOR_HEIGHT,
				frameThickness: DOOR_FRAME_THICKNESS,
				isHorizontalWall: false
			});
	}

	/**
	 * Creates a single door outline consisting of a frame, panel, and knob.
	 * @param params
	 *   The door outline configuration parameters.
	 */
	private createSingleDoorOutline(params: DoorOutlineParams): void
	{
		const { room } = params;
		const colorHex: string =
			ROOM_COLORS.get(room.id) ?? ISLAND_GROUND_COLOR;

		this.createDoorFrame(params, colorHex);
		this.createDoorPanel(params, colorHex);
		this.createDoorKnob(params);
	}

	/**
	 * Creates the door frame outline rectangle.
	 * @param params
	 * Door outline configuration parameters.
	 * @param colorHex
	 * Room color hex string for material tinting.
	 */
	private createDoorFrame(params: DoorOutlineParams, colorHex: string): void
	{
		const { scene, room, direction, x, y, z, doorWidth, doorHeight, frameThickness, isHorizontalWall } = params;
		const frameMaterial: StandardMaterial =
			new StandardMaterial(
				`door-frame-mat-${room.id}-${direction}`,
				scene);

		frameMaterial.diffuseColor =
			Color3
				.FromHexString(colorHex)
				.scale(0.4);
		frameMaterial.specularColor =
			new Color3(0.05, 0.05, 0.05);
		this.disposables.push(frameMaterial);

		const frameWidth: number =
			isHorizontalWall
				? doorWidth + frameThickness * 2
				: 0.06;
		const frameDepth: number =
			isHorizontalWall
				? 0.06
				: doorWidth + frameThickness * 2;

		const frame: Mesh =
			MeshBuilder.CreateBox(
				`door-frame-${room.id}-${direction}`,
				{
					width: frameWidth,
					height: doorHeight + frameThickness,
					depth: frameDepth
				},
				scene);

		frame.material = frameMaterial;
		frame.position.set(x, y, z);
		this.disposables.push(frame);
	}

	/**
	 * Creates the inset door panel.
	 * @param params
	 * Door outline configuration parameters.
	 * @param colorHex
	 * Room color hex string for material tinting.
	 */
	private createDoorPanel(params: DoorOutlineParams, colorHex: string): void
	{
		const { scene, room, direction, x, y, z, doorWidth, doorHeight, isHorizontalWall } = params;
		const panelMaterial: StandardMaterial =
			new StandardMaterial(
				`door-panel-mat-${room.id}-${direction}`,
				scene);

		panelMaterial.diffuseColor =
			Color3
				.FromHexString(colorHex)
				.scale(0.55);
		panelMaterial.specularColor =
			new Color3(0.08, 0.08, 0.08);
		this.disposables.push(panelMaterial);

		const panelWidth: number =
			isHorizontalWall ? doorWidth : 0.04;
		const panelDepth: number =
			isHorizontalWall ? 0.04 : doorWidth;
		const panelOffsetX: number =
			isHorizontalWall ? 0 : (direction === "east" ? -0.02 : 0.02);
		const panelOffsetZ: number =
			isHorizontalWall ? 0.02 : 0;

		const panel: Mesh =
			MeshBuilder.CreateBox(
				`door-panel-${room.id}-${direction}`,
				{
					width: panelWidth,
					height: doorHeight,
					depth: panelDepth
				},
				scene);

		panel.material = panelMaterial;
		panel.position.set(
			x + panelOffsetX,
			y,
			z + panelOffsetZ);
		this.disposables.push(panel);
	}

	/**
	 * Creates a small gold door knob sphere.
	 * @param params
	 * Door outline configuration parameters.
	 */
	private createDoorKnob(params: DoorOutlineParams): void
	{
		const { scene, room, direction, x, y, z, doorWidth, isHorizontalWall } = params;
		const knobMaterial: StandardMaterial =
			new StandardMaterial(
				`door-knob-mat-${room.id}-${direction}`,
				scene);

		knobMaterial.diffuseColor =
			new Color3(0.7, 0.6, 0.2);
		knobMaterial.specularColor =
			new Color3(0.4, 0.4, 0.3);
		this.disposables.push(knobMaterial);

		const knob: Mesh =
			MeshBuilder.CreateSphere(
				`door-knob-${room.id}-${direction}`,
				{ diameter: 0.15 },
				scene);

		const knobOffsetX: number =
			isHorizontalWall
				? doorWidth / 2 - 0.25
				: (direction === "east" ? -0.08 : 0.08);
		const knobOffsetZ: number =
			isHorizontalWall
				? 0.08
				: doorWidth / 2 - 0.25;

		knob.material = knobMaterial;
		knob.position.set(
			x + knobOffsetX,
			y - 0.2,
			z + knobOffsetZ);
		this.disposables.push(knob);
	}

	/**
	 * Creates wall-mounted pictures and clocks for every room.
	 * @param scene
	 *   The Babylon.js Scene.
	 */
	private createWallDecorations(scene: Scene): void
	{
		const pictureColors: ReadonlyArray<string> =
			["#C4A035", "#3B7A57", "#8B4513", "#4169E1", "#8B0000", "#556B2F"];

		let colorIndex: number = 0;

		for (const room of ISLAND_ROOMS)
		{
			const wallY: number =
				ISLAND_GROUND_Y + ROOM_WALL_HEIGHT * 0.6;

			const pictureColor: string =
				pictureColors[colorIndex % pictureColors.length];
			colorIndex++;

			this.createWallPicture(
				{
					scene,
					name: `wall-pic-${room.id}-north`,
					x: room.centerX + 3,
					y: wallY,
					z: room.centerZ - room.halfDepth + 0.3,
					rotationY: 0,
					colorHex: pictureColor
				});

			/* South wall picture. */
			this.createWallPicture(
				{
					scene,
					name: `wall-pic-${room.id}-south`,
					x: room.centerX - 3,
					y: wallY,
					z: room.centerZ + room.halfDepth - 0.3,
					rotationY: Math.PI,
					colorHex: pictureColor
				});

			this.createWallClock(
				{
					scene,
					name: `wall-clock-${room.id}`,
					x: room.centerX - room.halfWidth + 0.3,
					y: ISLAND_GROUND_Y + ROOM_WALL_HEIGHT * 0.7,
					z: room.centerZ - 2,
					rotationY: Math.PI / 2
				});
		}
	}

	/**
	 * Creates a framed wall-mounted picture.
	 * @param params
	 *   The wall picture configuration parameters.
	 */
	private createWallPicture(params: WallPictureParams): void
	{
		const { scene, name, x, y, z, rotationY, colorHex } = params;
		const frame: Mesh =
			MeshBuilder.CreateBox(
				`${name}-frame`,
				{
					width: 1.6,
					height: 1.2,
					depth: 0.06
				},
				scene);

		const frameMaterial: StandardMaterial =
			new StandardMaterial(
				`${name}-frame-mat`,
				scene);

		frameMaterial.diffuseColor =
			new Color3(0.3, 0.22, 0.12);
		frameMaterial.specularColor =
			new Color3(0.1, 0.1, 0.1);

		frame.material = frameMaterial;
		frame.position.x = x;
		frame.position.y = y;
		frame.position.z = z;
		frame.rotation.y = rotationY;

		const canvas: Mesh =
			MeshBuilder.CreatePlane(
				`${name}-canvas`,
				{
					width: 1.35,
					height: 0.95
				},
				scene);

		const canvasMaterial: StandardMaterial =
			new StandardMaterial(
				`${name}-canvas-mat`,
				scene);

		canvasMaterial.diffuseColor =
			Color3.FromHexString(colorHex);
		canvasMaterial.emissiveColor =
			Color3
				.FromHexString(colorHex)
				.scale(0.15);

		canvas.material = canvasMaterial;
		canvas.parent = frame;
		canvas.position.z = -0.03;

		this.disposables.push(frame);
		this.disposables.push(frameMaterial);
		this.disposables.push(canvas);
		this.disposables.push(canvasMaterial);
	}

	/**
	 * Creates a wall-mounted analog clock.
	 * @param params
	 *   The wall clock configuration parameters.
	 */
	private createWallClock(params: WallMountParams): void
	{
		const { scene, name, x, y, z, rotationY } = params;
		const clockFrame: Mesh =
			MeshBuilder.CreateCylinder(
				`${name}-frame`,
				{
					diameter: 1.0,
					height: 0.08,
					tessellation: 24
				},
				scene);

		const frameMaterial: StandardMaterial =
			new StandardMaterial(
				`${name}-frame-mat`,
				scene);

		frameMaterial.diffuseColor =
			new Color3(0.2, 0.15, 0.1);

		clockFrame.material = frameMaterial;
		clockFrame.position.x = x;
		clockFrame.position.y = y;
		clockFrame.position.z = z;
		clockFrame.rotation.x =
			Math.PI / 2;
		clockFrame.rotation.y = rotationY;

		const face: Mesh =
			MeshBuilder.CreateDisc(
				`${name}-face`,
				{
					radius: 0.4,
					tessellation: 24
				},
				scene);

		const faceMaterial: StandardMaterial =
			new StandardMaterial(
				`${name}-face-mat`,
				scene);

		faceMaterial.diffuseColor =
			new Color3(0.95, 0.92, 0.85);
		faceMaterial.emissiveColor =
			new Color3(0.2, 0.2, 0.18);

		face.material = faceMaterial;
		face.parent = clockFrame;
		face.position.y = -0.045;
		face.rotation.x =
			Math.PI / 2;

		this.disposables.push(clockFrame);
		this.disposables.push(frameMaterial);
		this.disposables.push(face);
		this.disposables.push(faceMaterial);
	}
}