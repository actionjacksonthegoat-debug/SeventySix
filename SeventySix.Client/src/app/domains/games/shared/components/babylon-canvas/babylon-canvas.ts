/**
 * Babylon Canvas Wrapper Component.
 * Hosts a canvas element for Babylon.js rendering with proper Angular lifecycle management.
 * Initializes the engine and scene on afterNextRender, disposes on destroy.
 */

import {
	afterNextRender,
	ChangeDetectionStrategy,
	Component,
	DestroyRef,
	ElementRef,
	inject,
	output,
	OutputEmitterRef,
	Signal,
	viewChild
} from "@angular/core";
import { Scene } from "@babylonjs/core/scene";
import { BABYLON_ENGINE_OPTIONS } from "@games/shared/constants/engine.constants";
import type { EngineOptions } from "@games/shared/models/engine.models";
import { BabylonEngineService } from "@games/shared/services/babylon-engine.service";

/**
 * Reusable canvas wrapper for Babylon.js rendering.
 * Manages engine/scene lifecycle and emits the Scene reference
 * when initialization is complete.
 */
@Component(
	{
		selector: "app-babylon-canvas",
		standalone: true,
		changeDetection: ChangeDetectionStrategy.OnPush,
		templateUrl: "./babylon-canvas.html",
		styleUrl: "./babylon-canvas.scss",
		host: {
			"[style.display]": "'block'",
			"[style.width]": "'100%'",
			"[style.height]": "'100%'"
		}
	})
export class BabylonCanvasComponent
{
	/**
	 * Emits the Babylon.js Scene instance when initialization is complete.
	 * @type {OutputEmitterRef<Scene>}
	 */
	readonly sceneReady: OutputEmitterRef<Scene> =
		output<Scene>();

	/**
	 * Reference to the canvas element used for rendering.
	 * @type {Signal<ElementRef<HTMLCanvasElement>>}
	 * @private
	 * @readonly
	 */
	private readonly canvasRef: Signal<ElementRef<HTMLCanvasElement>> =
		viewChild.required<
			ElementRef<HTMLCanvasElement>>("renderCanvas");

	/**
	 * Injected Babylon.js engine service.
	 * @type {BabylonEngineService}
	 * @private
	 * @readonly
	 */
	private readonly engineService: BabylonEngineService =
		inject(BabylonEngineService);

	/**
	 * Injected destroy reference for cleanup registration.
	 * @type {DestroyRef}
	 * @private
	 * @readonly
	 */
	private readonly destroyRef: DestroyRef =
		inject(DestroyRef);

	/**
	 * Optional engine options injected via token (used for test environments).
	 * @type {EngineOptions | null}
	 * @private
	 * @readonly
	 */
	private readonly engineOptions: EngineOptions | null =
		inject(
			BABYLON_ENGINE_OPTIONS,
			{ optional: true });

	/**
	 * Bound resize handler for window resize events.
	 * @type {() => void}
	 * @private
	 * @readonly
	 */
	private readonly boundResizeHandler: () => void =
		(): void => this.engineService.resize();

	constructor()
	{
		afterNextRender(
			() =>
			{
				this.initializeEngine();
			});

		this.destroyRef.onDestroy(
			() =>
			{
				window.removeEventListener(
					"resize",
					this.boundResizeHandler);
				this.engineService.dispose();
			});
	}

	/**
	 * Initializes the Babylon.js engine, creates a scene,
	 * starts the render loop, and emits the scene reference.
	 * @private
	 */
	private initializeEngine(): void
	{
		const canvas: HTMLCanvasElement =
			this.canvasRef().nativeElement;

		this.engineService.createEngine(
			canvas,
			this.engineOptions ?? undefined);

		const scene: Scene =
			this.engineService.createScene();

		this.engineService.startRenderLoop(scene);

		window.addEventListener(
			"resize",
			this.boundResizeHandler);

		this.sceneReady.emit(scene);
	}
}