import { ApplicationRef, inject, Injectable } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { SwUpdate, VersionReadyEvent } from "@angular/service-worker";
import { LoggerService } from "@shared/services/logger.service";
import { WindowService } from "@shared/services/window.service";
import { concat, filter, first, interval } from "rxjs";

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
		// Wait for app to stabilize, then check for updates every 6 hours
		const appIsStable: import("rxjs").Observable<boolean> =
			this.appRef.isStable.pipe(
				first(
					(isStable: boolean) => isStable === true));
		const everySixHours: import("rxjs").Observable<number> =
			interval(
				6 * 60 * 60 * 1000);
		const everySixHoursOnceAppIsStable: import("rxjs").Observable<
			boolean | number> =
			concat(appIsStable, everySixHours);

		everySixHoursOnceAppIsStable
			.pipe(takeUntilDestroyed())
			.subscribe(
				async () =>
				{
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
				});
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
					if (this.confirmUpdate())
					{
						this.activateUpdate();
					}
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

					// Reload the page
					this.notifyUnrecoverableState(
						"An error occurred that requires reloading the page.");
					this.windowService.reload();
				});
	}

	/**
	 * Prompts user to confirm update.
	 * Can be customized to show a custom dialog.
	 * @returns {boolean}
	 * True if user confirms the update.
	 */
	private confirmUpdate(): boolean
	{
		return confirm(
			"A new version is available. Would you like to update now?");
	}

	/**
	 * Notifies user of unrecoverable state.
	 * @param {string} message
	 * The message to show to the user.
	 * @returns {void}
	 */
	private notifyUnrecoverableState(message: string): void
	{
		alert(message);
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