import { CanDeactivateFn } from "@angular/router";
import { inject } from "@angular/core";
import { NotificationService } from "@infrastructure/services/notification.service";

/**
 * Interface for components that can have unsaved changes.
 */
export interface CanComponentDeactivate
{
	canDeactivate: () => boolean;
}

/**
 * Unsaved changes guard.
 * Prompts user before navigating away from a component with unsaved changes.
 */
export const unsavedChangesGuard: CanDeactivateFn<CanComponentDeactivate> = (
	component
) =>
{
	const notification: NotificationService = inject(NotificationService);

	if (component.canDeactivate && !component.canDeactivate())
	{
		const confirmed: boolean = window.confirm(
			"You have unsaved changes. Are you sure you want to leave?"
		);

		if (!confirmed)
		{
			notification.info("Navigation cancelled");
		}

		return confirmed;
	}

	return true;
};
