import { ApplicationRef, inject, Injectable } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { SwUpdate, VersionReadyEvent } from "@angular/service-worker";
import { LoggerService } from "@shared/services/logger.service";
import { WindowService } from "@shared/services/window.service";
import {
	filter,
	first,
	merge,
	Observable,
	switchMap,
	timer
} from "rxjs";

/**
 * Service Worker update service.
 * Handles application updates and version management.
 *
 * Features:
 * - Automatic update checks
 * - User notification of available updates
 * - Forced update on critical versions
 * - Update logging and monitoring
 */
@Injectable(
	{
		providedIn: "root"
	})
export class SwUpdateService
{
	/**
	 * Guard to prevent overlapping update checks when startup retries are close together.
	 * @type {boolean}
	 * @private
	 */
	private isCheckInProgress: boolean = false;

	/**
	 * Service Worker update API.
	 * @type {SwUpdate}
	 * @private
	 * @readonly
	 */
	private readonly swUpdate: SwUpdate =
		inject(SwUpdate);

	/**
	 * ApplicationRef used to detect app stabilization.
	 * @type {ApplicationRef}
	 * @private
	 * @readonly
	 */
	private readonly appRef: ApplicationRef =
		inject(ApplicationRef);

	/**
	 * Logger service for update-related diagnostics.
	 * @type {LoggerService}
	 * @private
	 * @readonly
	 */
	private readonly logger: LoggerService =
		inject(LoggerService);

	/**
	 * Window service for page reload operations.
	 * @type {WindowService}
	 * @private
	 * @readonly
	 */
	private readonly windowService: WindowService =
		inject(WindowService);

	/**
	 * Initialize SwUpdateService and register update handlers when enabled.
	 * @returns {void}
	 */
	constructor()
	{
		// Set up subscriptions in constructor (injection context) if SW is enabled
		if (this.swUpdate.isEnabled)
		{
			this.checkForUpdates();
			this.handleVersionUpdates();
			this.handleUnrecoverableState();
		}
	}

	/**
	 * Checks for updates periodically.
	 * Checks every 6 hours when the app is stable.
	 * @returns {void}
	 */
	private checkForUpdates(): void
	{
		// Wait for app to stabilize, then run aggressive startup retries before
		// switching to long-running checks.
		const appIsStable: Observable<boolean> =
			this.appRef.isStable.pipe(
				first(
					(isStable: boolean) => isStable === true));
		const startupChecks: Observable<number> =
			merge(
				timer(0),
				timer(10_000),
				timer(30_000),
				timer(60_000));
		const periodicChecks: Observable<number> =
			timer(6 * 60 * 60 * 1000, 6 * 60 * 60 * 1000);
		const updateCheckSchedule: Observable<number> =
			appIsStable.pipe(
				switchMap(
					() =>
						merge(startupChecks, periodicChecks)));

		updateCheckSchedule
			.pipe(takeUntilDestroyed())
			.subscribe(
				async () =>
				{
					await this.checkForUpdateSilently();
				});
	}

	/**
	 * Performs a background update check and logs failures without surfacing browser dialogs.
	 * @returns {Promise<void>}
	 */
	private async checkForUpdateSilently(): Promise<void>
	{
		if (this.isCheckInProgress)
		{
			return;
		}

		this.isCheckInProgress = true;

		try
		{
			await this.swUpdate.checkForUpdate();
		}
		catch (error)
		{
			this.logger.error(
				"Failed to check for updates",
				error instanceof Error ? error : undefined);
		}
		finally
		{
			this.isCheckInProgress = false;
		}
	}

	/**
	 * Handles version updates.
	 * Prompts user to reload when a new version is available.
	 * @returns {void}
	 */
	private handleVersionUpdates(): void
	{
		this
			.swUpdate
			.versionUpdates
			.pipe(
				filter(
					(evt): evt is VersionReadyEvent =>
						evt.type === "VERSION_READY"),
				takeUntilDestroyed())
			.subscribe(
				() =>
				{
					this.logger.info("New version available. Activating update.");
					void this.activateUpdate();
				});
	}

	/**
	 * Handles unrecoverable state.
	 * Reloads the page if the Service Worker enters an unrecoverable state.
	 * @returns {void}
	 */
	private handleUnrecoverableState(): void
	{
		this
			.swUpdate
			.unrecoverable
			.pipe(takeUntilDestroyed())
			.subscribe(
				(event) =>
				{
					this.logger.error(
						"Service Worker unrecoverable state",
						undefined,
						{
							reason: event.reason
						});
					this.windowService.reload();
				});
	}

	/**
	 * Activates the update and reloads the page.
	 * @returns {Promise<void>}
	 */
	private async activateUpdate(): Promise<void>
	{
		try
		{
			await this.swUpdate.activateUpdate();
			this.windowService.reload();
		}
		catch (error)
		{
			this.logger.error(
				"Failed to activate update",
				error instanceof Error ? error : undefined);
		}
	}

	/**
	 * Manually checks for updates.
	 * Can be triggered by user action.
	 * @returns {Promise<boolean>}
	 * True when an update was found.
	 */
	async checkForUpdate(): Promise<boolean>
	{
		if (!this.swUpdate.isEnabled)
		{
			return false;
		}

		try
		{
			const updateFound: boolean =
				await this.swUpdate.checkForUpdate();
			if (updateFound)
			{
				this.logger.info("Update found");
			}
			else
			{
				this.logger.info("No update available");
			}
			return updateFound;
		}
		catch (error)
		{
			this.logger.error(
				"Error checking for update",
				error instanceof Error ? error : undefined);
			return false;
		}
	}

	/**
	 * Forces an immediate update.
	 * Useful for critical security updates.
	 * @returns {Promise<void>}
	 */
	async forceUpdate(): Promise<void>
	{
		if (!this.swUpdate.isEnabled)
		{
			return;
		}

		try
		{
			const updateFound: boolean =
				await this.swUpdate.checkForUpdate();
			if (updateFound)
			{
				await this.swUpdate.activateUpdate();
				this.windowService.reload();
			}
		}
		catch (error)
		{
			this.logger.error(
				"Error forcing update",
				error instanceof Error ? error : undefined);
		}
	}
}