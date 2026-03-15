import { Injectable, signal, type WritableSignal } from "@angular/core";
import type { Observer } from "@babylonjs/core/Misc/observable";
import type { Scene } from "@babylonjs/core/scene";
import { GameLifecycleState } from "@games/shared/models/game.models";

/**
 * Manages a structured game loop lifecycle.
 * Provides init → start → update → pause → dispose flow
 * using Babylon.js scene observables for per-frame updates.
 * @remarks
 * Route-scoped — do NOT use `providedIn`. Register in route `providers[]`.
 * Consumers set `onUpdate` callback to receive per-frame delta time.
 */
@Injectable()
export class GameLoopService
{
	/** Current lifecycle state of the game loop. */
	public readonly state: WritableSignal<GameLifecycleState> =
		signal<GameLifecycleState>(
			GameLifecycleState.Initializing);

	/**
	 * Per-frame update callback.
	 * Set this before calling `start()` to receive delta time each frame.
	 * @param deltaTime - Time in milliseconds since last frame.
	 */
	public onUpdate: ((deltaTime: number) => void) | null = null;

	/** Reference to the scene this loop is bound to. */
	private scene: Scene | null = null;

	/** Reference to the render observer for cleanup. */
	private renderObserver: Observer<Scene> | null = null;

	/**
	 * Initialize the game loop with a Babylon.js scene.
	 * Transitions state to Ready.
	 * @param scene - The Babylon.js scene to bind the loop to.
	 */
	public initialize(scene: Scene): void
	{
		this.scene = scene;
		this.state.set(GameLifecycleState.Ready);
	}

	/**
	 * Start or resume the game loop.
	 * Registers an `onBeforeRenderObservable` observer for per-frame updates.
	 * @throws Error if called before `initialize()`.
	 */
	public start(): void
	{
		if (this.scene === null)
		{
			throw new Error("GameLoopService.start() called before initialize().");
		}

		this.removeObserver();

		this.renderObserver =
			this.scene.onBeforeRenderObservable.add(
				() =>
				{
					if (this.state() === GameLifecycleState.Running && this.onUpdate !== null)
					{
						const deltaTime: number =
							this.scene!
								.getEngine()
								.getDeltaTime();
						this.onUpdate(deltaTime);
					}
				});

		this.state.set(GameLifecycleState.Running);
	}

	/**
	 * Pause the game loop.
	 * The observer remains registered but updates are skipped.
	 */
	public pause(): void
	{
		this.state.set(GameLifecycleState.Paused);
	}

	/**
	 * Dispose the game loop and clean up all resources.
	 * Removes the render observer and transitions to Disposed.
	 */
	public dispose(): void
	{
		this.removeObserver();
		this.onUpdate = null;
		this.scene = null;
		this.state.set(GameLifecycleState.Disposed);
	}

	/**
	 * Remove the render observer from the scene.
	 */
	private removeObserver(): void
	{
		if (this.renderObserver !== null && this.scene !== null)
		{
			this.scene.onBeforeRenderObservable.remove(this.renderObserver);
			this.renderObserver = null;
		}
	}
}