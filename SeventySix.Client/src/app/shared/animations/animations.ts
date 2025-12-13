import {
	animate,
	AnimationTriggerMetadata,
	state,
	style,
	transition,
	trigger
} from "@angular/animations";

/**
 * Reusable animation definitions for the application
 * Material Design 3 motion principles
 */

/**
 * Fade in/out animation
 */
export const fadeInOut: AnimationTriggerMetadata =
	trigger("fadeInOut", [
	transition(":enter", [
		style({ opacity: 0 }),
		animate("200ms ease-in", style({ opacity: 1 }))
	]),
	transition(":leave", [animate("150ms ease-out", style({ opacity: 0 }))])
]);

/**
 * Slide in/out animation
 */
export const slideIn: AnimationTriggerMetadata =
	trigger("slideIn", [
	transition(":enter", [
		style({ transform: "translateX(-100%)", opacity: 0 }),
		animate(
			"250ms ease-out",
			style({ transform: "translateX(0)", opacity: 1 }))
	]),
	transition(":leave", [
		animate(
			"200ms ease-in",
			style({ transform: "translateX(-100%)", opacity: 0 }))
	])
]);

/**
 * Scale in/out animation
 */
export const scaleIn: AnimationTriggerMetadata =
	trigger("scaleIn", [
	transition(":enter", [
		style({ transform: "scale(0.8)", opacity: 0 }),
		animate(
			"200ms cubic-bezier(0.4, 0, 0.2, 1)",
			style({ transform: "scale(1)", opacity: 1 }))
	]),
	transition(":leave", [
		animate(
			"150ms cubic-bezier(0.4, 0, 1, 1)",
			style({ transform: "scale(0.8)", opacity: 0 }))
	])
]);

/**
 * List item stagger animation
 */
export const staggerFadeIn: AnimationTriggerMetadata =
	trigger(
	"staggerFadeIn",
	[transition("* => *", [animate("0ms")])]);

/**
 * Expand/collapse animation
 */
export const expandCollapse: AnimationTriggerMetadata =
	trigger(
	"expandCollapse",
	[
		state(
			"collapsed",
			style({
				height: "0",
				overflow: "hidden",
				opacity: 0
			})),
		state(
			"expanded",
			style({
				height: "*",
				overflow: "visible",
				opacity: 1
			})),
		transition("collapsed <=> expanded", [
			animate("250ms cubic-bezier(0.4, 0, 0.2, 1)")
		])
	]);

/**
 * Bounce animation for notifications
 */
export const bounce: AnimationTriggerMetadata =
	trigger("bounce", [
	transition(":enter", [
		animate(
			"300ms cubic-bezier(0.68, -0.55, 0.265, 1.55)",
			style({ transform: "translateY(0)" }))
	])
]);

/**
 * Shake animation for errors
 */
export const shake: AnimationTriggerMetadata =
	trigger("shake", [
	transition("* => shake", [
		animate("0.5s", style({ transform: "translateX(0)" })),
		animate("0.1s", style({ transform: "translateX(-10px)" })),
		animate("0.1s", style({ transform: "translateX(10px)" })),
		animate("0.1s", style({ transform: "translateX(-10px)" })),
		animate("0.1s", style({ transform: "translateX(10px)" })),
		animate("0.1s", style({ transform: "translateX(0)" }))
	])
]);

/**
 * Slide down animation for panels
 * Used for selection panels, notification bars, etc.
 */
export const slideDown: AnimationTriggerMetadata =
	trigger("slideDown", [
	transition(":enter", [
		style({
			height: "0",
			opacity: 0,
			overflow: "hidden"
		}),
		animate(
			"200ms cubic-bezier(0.4, 0, 0.2, 1)",
			style({
				height: "*",
				opacity: 1
			}))
	]),
	transition(":leave", [
		animate(
			"150ms cubic-bezier(0.4, 0, 1, 1)",
			style({
				height: "0",
				opacity: 0,
				overflow: "hidden"
			}))
	])
]);
