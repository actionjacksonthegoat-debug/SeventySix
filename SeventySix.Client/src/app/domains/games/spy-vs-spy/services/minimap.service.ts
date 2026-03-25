// <copyright file="minimap.service.ts" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

/**
 * Minimap Service.
 * Renders a 2D top-down minimap overlay showing island rooms, airstrip,
 * and the current player position on a <canvas> element.
 * Route-scoped service — must be provided via route providers array.
 */

import { inject, Injectable } from "@angular/core";
import {
	AIRSTRIP_CENTER_X,
	AIRSTRIP_CENTER_Z,
	AIRSTRIP_RUNWAY_LENGTH,
	AIRSTRIP_RUNWAY_WIDTH,
	ISLAND_ROOMS
} from "@games/spy-vs-spy/constants/spy-vs-spy.constants";
import type { RoomDefinition } from "@games/spy-vs-spy/models/spy-vs-spy.models";
import { DateService } from "@shared/services/date.service";

/** World coordinate range to map (±WORLD_EXTENT on both axes). */
const WORLD_EXTENT: number = 55;

/** Player dot radius in minimap pixels. */
const PLAYER_DOT_RADIUS: number = 4;

/**
 * Service for rendering a 2D minimap overlay on a canvas element.
 * Maps world X/Z coordinates to pixel space and draws rooms,
 * the airstrip, and a player position indicator.
 */
@Injectable()
export class MinimapService
{
	/** Date service for timestamps. */
	private readonly dateService: DateService =
		inject(DateService);

	/** 2D rendering context for the minimap canvas. */
	private ctx: CanvasRenderingContext2D | null = null;

	/** Canvas element reference. */
	private canvas: HTMLCanvasElement | null = null;

	/**
	 * Initializes the minimap with a canvas element.
	 * @param {HTMLCanvasElement} canvas
	 * The canvas element to render the minimap on.
	 */
	initialize(canvas: HTMLCanvasElement): void
	{
		this.canvas = canvas;
		this.ctx =
			canvas.getContext("2d");
	}

	/**
	 * Updates the minimap rendering with the current player position.
	 * Clears the canvas and redraws rooms, airstrip, and player dot.
	 * @param {number} playerX
	 * Player world X position.
	 * @param {number} playerZ
	 * Player world Z position.
	 */
	update(
		playerX: number,
		playerZ: number): void
	{
		if (this.ctx == null || this.canvas == null)
		{
			return;
		}

		const ctx: CanvasRenderingContext2D =
			this.ctx;
		const width: number =
			this.canvas.width;
		const height: number =
			this.canvas.height;

		ctx.clearRect(0, 0, width, height);

		this.drawRooms(ctx, width, height);
		this.drawAirstrip(ctx, width, height);
		this.drawPlayer(ctx, width, height, playerX, playerZ);
	}

	/**
	 * Disposes canvas references to prevent memory leaks.
	 */
	dispose(): void
	{
		this.ctx = null;
		this.canvas = null;
	}

	/**
	 * Converts a world X coordinate to minimap pixel X.
	 * @param {number} worldX
	 * World-space X coordinate.
	 * @param {number} canvasWidth
	 * Canvas pixel width.
	 * @returns {number}
	 * Pixel X position on the minimap.
	 */
	private worldToPixelX(
		worldX: number,
		canvasWidth: number): number
	{
		return ((worldX + WORLD_EXTENT) / (2 * WORLD_EXTENT)) * canvasWidth;
	}

	/**
	 * Converts a world Z coordinate to minimap pixel Y.
	 * North (+Z) maps to the top of the canvas; south (−Z) to the bottom.
	 * @param {number} worldZ
	 * World-space Z coordinate.
	 * @param {number} canvasHeight
	 * Canvas pixel height.
	 * @returns {number}
	 * Pixel Y position on the minimap.
	 */
	private worldToPixelY(
		worldZ: number,
		canvasHeight: number): number
	{
		return ((WORLD_EXTENT - worldZ) / (2 * WORLD_EXTENT)) * canvasHeight;
	}

	/**
	 * Draws outlined rectangles for each island room.
	 * @param {CanvasRenderingContext2D} ctx
	 * The 2D rendering context.
	 * @param {number} width
	 * Canvas pixel width.
	 * @param {number} height
	 * Canvas pixel height.
	 */
	private drawRooms(
		ctx: CanvasRenderingContext2D,
		width: number,
		height: number): void
	{
		ctx.strokeStyle = "#0f0";
		ctx.lineWidth = 1;

		for (const room of ISLAND_ROOMS)
		{
			const roomDef: RoomDefinition = room;
			const x: number =
				this.worldToPixelX(roomDef.centerX - roomDef.halfWidth, width);
			const z: number =
				this.worldToPixelY(roomDef.centerZ + roomDef.halfDepth, height);
			const w: number =
				(roomDef.halfWidth * 2 / (2 * WORLD_EXTENT)) * width;
			const h: number =
				(roomDef.halfDepth * 2 / (2 * WORLD_EXTENT)) * height;

			ctx.strokeRect(x, z, w, h);
		}
	}

	/**
	 * Draws a filled rectangle for the airstrip (oriented left-to-right along X axis).
	 * @param {CanvasRenderingContext2D} ctx
	 * The 2D rendering context.
	 * @param {number} width
	 * Canvas pixel width.
	 * @param {number} height
	 * Canvas pixel height.
	 */
	private drawAirstrip(
		ctx: CanvasRenderingContext2D,
		width: number,
		height: number): void
	{
		ctx.fillStyle = "#888";

		const halfLength: number =
			AIRSTRIP_RUNWAY_LENGTH / 2;
		const halfWidth: number =
			AIRSTRIP_RUNWAY_WIDTH / 2;
		const pixelX: number =
			this.worldToPixelX(AIRSTRIP_CENTER_X - halfLength, width);
		const pixelY: number =
			this.worldToPixelY(AIRSTRIP_CENTER_Z + halfWidth, height);
		const pixelW: number =
			(AIRSTRIP_RUNWAY_LENGTH / (2 * WORLD_EXTENT)) * width;
		const pixelH: number =
			(AIRSTRIP_RUNWAY_WIDTH / (2 * WORLD_EXTENT)) * height;

		ctx.fillRect(pixelX, pixelY, pixelW, pixelH);
	}

	/**
	 * Draws a blinking green dot for the player position.
	 * @param {CanvasRenderingContext2D} ctx
	 * The 2D rendering context.
	 * @param {number} width
	 * Canvas pixel width.
	 * @param {number} height
	 * Canvas pixel height.
	 * @param {number} playerX
	 * Player world X position.
	 * @param {number} playerZ
	 * Player world Z position.
	 */
	private drawPlayer(
		ctx: CanvasRenderingContext2D,
		width: number,
		height: number,
		playerX: number,
		playerZ: number): void
	{
		const px: number =
			this.worldToPixelX(playerX, width);
		const py: number =
			this.worldToPixelY(playerZ, height);

		// Pulse effect based on time
		const pulse: number =
			0.7 + 0.3 * Math.sin(this.dateService.nowTimestamp() / 300);

		ctx.beginPath();
		ctx.arc(
			px,
			py,
			PLAYER_DOT_RADIUS,
			0,
			2 * Math.PI);
		ctx.fillStyle =
			`rgba(0, 255, 0, ${String(pulse)})`;
		ctx.fill();
		ctx.closePath();
	}
}