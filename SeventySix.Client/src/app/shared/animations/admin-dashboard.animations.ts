import {
	trigger,
	transition,
	style,
	animate,
	query,
	stagger,
	AnimationTriggerMetadata
} from "@angular/animations";

/**
 * Fade in animation
 */
export const fadeIn: AnimationTriggerMetadata = trigger("fadeIn", [
	transition(":enter", [
		style({ opacity: 0 }),
		animate("300ms ease-out", style({ opacity: 1 }))
	])
]);

/**
 * Fade in and slide up animation
 */
export const fadeInUp: AnimationTriggerMetadata = trigger("fadeInUp", [
	transition(":enter", [
		style({ opacity: 0, transform: "translateY(20px)" }),
		animate(
			"400ms ease-out",
			style({ opacity: 1, transform: "translateY(0)" })
		)
	])
]);

/**
 * Slide in from right animation
 */
export const slideInRight: AnimationTriggerMetadata = trigger("slideInRight", [
	transition(":enter", [
		style({ opacity: 0, transform: "translateX(20px)" }),
		animate(
			"300ms ease-out",
			style({ opacity: 1, transform: "translateX(0)" })
		)
	])
]);

/**
 * Stagger animation for lists
 */
export const staggerList: AnimationTriggerMetadata = trigger("staggerList", [
	transition("* => *", [
		query(
			":enter",
			[
				style({ opacity: 0, transform: "translateY(10px)" }),
				stagger(50, [
					animate(
						"300ms ease-out",
						style({ opacity: 1, transform: "translateY(0)" })
					)
				])
			],
			{ optional: true }
		)
	])
]);

/**
 * Scale in animation
 */
export const scaleIn: AnimationTriggerMetadata = trigger("scaleIn", [
	transition(":enter", [
		style({ opacity: 0, transform: "scale(0.95)" }),
		animate("250ms ease-out", style({ opacity: 1, transform: "scale(1)" }))
	])
]);

/**
 * Card hover animation (for use with CSS)
 */
export const cardElevation: AnimationTriggerMetadata = trigger(
	"cardElevation",
	[
		transition("* => hover", [
			style({ transform: "translateY(-2px)" }),
			animate("200ms ease-out")
		]),
		transition("hover => *", [
			style({ transform: "translateY(0)" }),
			animate("200ms ease-out")
		])
	]
);
