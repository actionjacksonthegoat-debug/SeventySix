import { inject } from "@angular/core";
import { CanDeactivateFn } from "@angular/router";
import { CanComponentDeactivate } from "@shared/interfaces";
import { NotificationService } from "@shared/services/notification.service";

/**
 * Unsaved changes guard.
 * Prompts user before navigating away from a component with unsaved changes.
 * @type {CanDeactivateFn<CanComponentDeactivate>}
 * @param {CanComponentDeactivate} component
 * The component being deactivated; used to determine if unsaved changes exist.
 * @returns {boolean}
 * True to allow navigation, false to block.
 */
export const unsavedChangesGuard: CanDeactivateFn<CanComponentDeactivate> =
	(
		component) =>
	{
		const notification: NotificationService =
			inject(NotificationService);

		if (component.canDeactivate && !component.canDeactivate())
		{
			const confirmed: boolean =
				window.confirm(
					"You have unsaved changes. Are you sure you want to leave?");

			if (!confirmed)
			{
				notification.info("Navigation cancelled");
			}

			return confirmed;
		}

		return true;
	};
