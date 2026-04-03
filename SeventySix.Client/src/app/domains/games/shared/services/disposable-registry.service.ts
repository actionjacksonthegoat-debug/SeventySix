/**
 * Disposable Registry Service.
 * Tracks IDisposable services for batch cleanup in reverse registration order (LIFO).
 * Route-scoped — register in route providers[], not providedIn root.
 */

import { Injectable } from "@angular/core";
import type { IDisposable } from "@games/shared/models/game-service.interfaces";

/**
 * Registry that tracks IDisposable services for batch cleanup.
 * Services are disposed in reverse registration order (LIFO)
 * to ensure dependent services are cleaned up before their dependencies.
 */
@Injectable()
export class DisposableRegistryService
{
	/** Registered disposables in insertion order. */
	private readonly disposables: IDisposable[] = [];

	/**
	 * Register a disposable service for cleanup.
	 * @param disposable
	 * The service to register for disposal.
	 */
	register(disposable: IDisposable): void
	{
		this.disposables.push(disposable);
	}

	/**
	 * Dispose all registered services in reverse order and clear the registry.
	 * If a disposable throws, the error is logged and remaining disposables continue.
	 */
	disposeAll(): void
	{
		for (let index: number =
			this.disposables.length - 1; index >= 0; index--)
		{
			try
			{
				this.disposables[index].dispose();
			}
			catch (error: unknown)
			{
				console.error(
					"DisposableRegistryService: error during dispose",
					error);
			}
		}

		this.disposables.length = 0;
	}
}