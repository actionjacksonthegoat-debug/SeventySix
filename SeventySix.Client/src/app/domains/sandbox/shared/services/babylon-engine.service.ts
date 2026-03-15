/**
 * Babylon.js Engine Service.
 * Manages the lifecycle of a Babylon.js Engine and Scene within Angular.
 * Domain-scoped service — must be provided via route providers array.
 *
 * @remarks
 * This service wraps Babylon.js engine creation, scene management,
 * and the render loop. It handles proper disposal of GPU resources
 * when the Angular component hosting the canvas is destroyed.
 */

import { Injectable } from "@angular/core";
import { Engine } from "@babylonjs/core/Engines/engine";
import { NullEngine } from "@babylonjs/core/Engines/nullEngine";
import { Scene } from "@babylonjs/core/scene";
import type { EngineOptions } from "@sandbox/shared/models/engine.models";

/**
 * Angular service for managing Babylon.js Engine and Scene lifecycle.
 * Provided at route level for sandbox domain scoping.
 */
@Injectable()
export class BabylonEngineService
{
	/**
	 * The active Babylon.js rendering engine instance.
	 * @type {Engine | null}
	 * @private
	 */
	private engine: Engine | null = null;

	/**
	 * The active Babylon.js scene instance.
	 * @type {Scene | null}
	 * @private
	 */
	private scene: Scene | null = null;

	/**
	 * Creates and initializes a Babylon.js engine for the given canvas.
	 * @param {HTMLCanvasElement} canvas
	 * The HTML canvas element to render to.
	 * @param {EngineOptions} options
	 * Optional configuration for engine creation.
	 * @returns {Engine}
	 * The created Babylon.js engine instance.
	 */
	createEngine(
		canvas: HTMLCanvasElement,
		options?: EngineOptions): Engine
	{
		if (options?.useNullEngine === true)
		{
			this.engine =
				new NullEngine();
		}
		else
		{
			this.engine =
				new Engine(
					canvas,
					true,
					{
						preserveDrawingBuffer: true,
						stencil: true
					});
		}

		return this.engine;
	}

	/**
	 * Creates a new Babylon.js scene attached to the current engine.
	 * @returns {Scene}
	 * The created scene instance.
	 * @throws {Error}
	 * If engine has not been created via createEngine first.
	 */
	createScene(): Scene
	{
		if (this.engine === null)
		{
			throw new Error("Engine must be created before creating a scene. Call createEngine() first.");
		}

		this.scene =
			new Scene(this.engine);

		return this.scene;
	}

	/**
	 * Returns the current Babylon.js engine or null if not created.
	 * @returns {Engine | null}
	 * The active engine instance or null.
	 */
	getEngine(): Engine | null
	{
		return this.engine;
	}

	/**
	 * Returns the current Babylon.js scene or null if not created.
	 * @returns {Scene | null}
	 * The active scene instance or null.
	 */
	getScene(): Scene | null
	{
		return this.scene;
	}

	/**
	 * Starts the Babylon.js render loop for the given scene.
	 * @param {Scene} scene
	 * The scene to render each frame.
	 */
	startRenderLoop(scene: Scene): void
	{
		if (this.engine === null)
		{
			return;
		}

		this.engine.runRenderLoop(
			() =>
			{
				scene.render();
			});
	}

	/**
	 * Stops the active render loop.
	 */
	stopRenderLoop(): void
	{
		if (this.engine === null)
		{
			return;
		}

		this.engine.stopRenderLoop();
	}

	/**
	 * Resizes the engine to match the current canvas dimensions.
	 * Should be called when the window or container resizes.
	 */
	resize(): void
	{
		if (this.engine === null)
		{
			return;
		}

		this.engine.resize();
	}

	/**
	 * Disposes of all Babylon.js resources (scene and engine).
	 * Must be called on component destroy to prevent GPU memory leaks.
	 */
	dispose(): void
	{
		if (this.scene !== null)
		{
			this.scene.dispose();
			this.scene = null;
		}

		if (this.engine !== null)
		{
			this.engine.stopRenderLoop();
			this.engine.dispose();
			this.engine = null;
		}
	}
}