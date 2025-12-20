/**
 * Interface for components that can have unsaved changes.
 * Implement this interface to enable the unsaved changes guard.
 */
export interface CanComponentDeactivate
{
	canDeactivate: () => boolean;
}
