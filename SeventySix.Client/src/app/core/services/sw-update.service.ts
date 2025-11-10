import { Injectable, inject, ApplicationRef } from "@angular/core";
import { SwUpdate, VersionReadyEvent } from "@angular/service-worker";
import { filter, first, concat, interval } from "rxjs";
import { LoggerService } from "./logger.service";

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
@Injectable({
	providedIn: "root"
})
export class SwUpdateService
{
	private readonly swUpdate = inject(SwUpdate);
	private readonly appRef = inject(ApplicationRef);
	private readonly logger = inject(LoggerService);

	/**
	 * Initializes the Service Worker update service.
	 * Should be called in the application's initialization logic.
	 */
	init(): void
	{
		if (!this.swUpdate.isEnabled)
		{
			this.logger.info("Service Worker is not enabled");
			return;
		}

		this.checkForUpdates();
		this.handleVersionUpdates();
		this.handleUnrecoverableState();
	}

	/**
	 * Checks for updates periodically.
	 * Checks every 6 hours when the app is stable.
	 */
	private checkForUpdates(): void
	{
		// Wait for app to stabilize, then check for updates every 6 hours
		const appIsStable$ = this.appRef.isStable.pipe(
			first((isStable) => isStable === true)
		);
		const everySixHours$ = interval(6 * 60 * 60 * 1000);
		const everySixHoursOnceAppIsStable$ = concat(
			appIsStable$,
			everySixHours$
		);

		everySixHoursOnceAppIsStable$.subscribe(async () =>
		{
			try
			{
				const updateFound = await this.swUpdate.checkForUpdate();
				if (updateFound)
				{
					this.logger.info("New version available");
				}
			}
			catch (err)
			{
				this.logger.error(
					"Failed to check for updates",
					err instanceof Error ? err : undefined
				);
			}
		});
	}

	/**
	 * Handles version updates.
	 * Prompts user to reload when a new version is available.
	 */
	private handleVersionUpdates(): void
	{
		this.swUpdate.versionUpdates
			.pipe(
				filter(
					(evt): evt is VersionReadyEvent =>
						evt.type === "VERSION_READY"
				)
			)
			.subscribe((evt) =>
			{
				this.logger.info("New version ready", {
					current: evt.currentVersion,
					latest: evt.latestVersion
				});

				// Prompt user to reload
				if (this.confirmUpdate())
				{
					this.activateUpdate();
				}
			});
	}

	/**
	 * Handles unrecoverable state.
	 * Reloads the page if the Service Worker enters an unrecoverable state.
	 */
	private handleUnrecoverableState(): void
	{
		this.swUpdate.unrecoverable.subscribe((event) =>
		{
			this.logger.error("Service Worker unrecoverable state", undefined, {
				reason: event.reason
			});

			// Reload the page
			this.notifyUnrecoverableState(
				"An error occurred that requires reloading the page."
			);
			window.location.reload();
		});
	}

	/**
	 * Prompts user to confirm update.
	 * Can be customized to show a custom dialog.
	 */
	private confirmUpdate(): boolean
	{
		// TODO: Replace with custom UI notification
		return confirm(
			"A new version is available. Would you like to update now?"
		);
	}

	/**
	 * Notifies user of unrecoverable state.
	 */
	private notifyUnrecoverableState(message: string): void
	{
		// TODO: Replace with custom UI notification
		alert(message);
	}

	/**
	 * Activates the update and reloads the page.
	 */
	private async activateUpdate(): Promise<void>
	{
		try
		{
			await this.swUpdate.activateUpdate();
			this.logger.info("Update activated, reloading...");
			window.location.reload();
		}
		catch (err)
		{
			this.logger.error(
				"Failed to activate update",
				err instanceof Error ? err : undefined
			);
		}
	}

	/**
	 * Manually checks for updates.
	 * Can be triggered by user action.
	 */
	async checkForUpdate(): Promise<boolean>
	{
		if (!this.swUpdate.isEnabled)
		{
			return false;
		}

		try
		{
			const updateFound = await this.swUpdate.checkForUpdate();
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
		catch (err)
		{
			this.logger.error(
				"Error checking for update",
				err instanceof Error ? err : undefined
			);
			return false;
		}
	}

	/**
	 * Forces an immediate update.
	 * Useful for critical security updates.
	 */
	async forceUpdate(): Promise<void>
	{
		if (!this.swUpdate.isEnabled)
		{
			return;
		}

		try
		{
			const updateFound = await this.swUpdate.checkForUpdate();
			if (updateFound)
			{
				await this.swUpdate.activateUpdate();
				window.location.reload();
			}
		}
		catch (err)
		{
			this.logger.error(
				"Error forcing update",
				err instanceof Error ? err : undefined
			);
		}
	}
}
