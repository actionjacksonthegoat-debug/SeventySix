import {
	animate,
	AnimationTriggerMetadata,
	style,
	transition,
	trigger
} from "@angular/animations";

/**
 * Reusable animation definitions for the application.
 * Material Design 3 motion principles.
 */

/**
 * Slide down animation for panels.
 * Used for selection panels, notification bars, etc.
 * Note: Apply overflow: hidden via CSS on the animated element.
 */
export const slideDown: AnimationTriggerMetadata =
	trigger("slideDown",
		[
			transition(":enter",
				[
					style(
						{
							height: "0",
							opacity: 0
						}),
					animate(
						"200ms cubic-bezier(0.4, 0, 0.2, 1)",
						style(
							{
								height: "*",
								opacity: 1
							}))
				]),
			transition(":leave",
				[
					animate(
						"150ms cubic-bezier(0.4, 0, 1, 1)",
						style(
							{
								height: "0",
								opacity: 0
							}))
				])
		]);