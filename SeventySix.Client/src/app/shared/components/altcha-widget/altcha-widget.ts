import "altcha";
import {
	ChangeDetectionStrategy,
	Component,
	CUSTOM_ELEMENTS_SCHEMA,
	ElementRef,
	input,
	InputSignal,
	OnDestroy,
	OnInit,
	output,
	OutputEmitterRef,
	Signal,
	viewChild
} from "@angular/core";
import { ALTCHA_STRINGS } from "@shared/constants";
import { AltchaWidgetState } from "@shared/models";
import { isNullOrUndefined } from "@shared/utilities/null-check.utility";

/**
 * Angular component wrapper for the ALTCHA proof-of-work widget.
 * Uses the standalone ALTCHA Web Component with custom element schema.
 */
@Component(
	{
		selector: "app-altcha-widget",
		standalone: true,
		changeDetection: ChangeDetectionStrategy.OnPush,
		schemas: [CUSTOM_ELEMENTS_SCHEMA],
		host: {
			"[style.display]": "'block'"
		},
		template: `
<altcha-widget
	#widget
	[attr.challengeurl]="challengeUrl()"
	[attr.hidefooter]="hideFooter() || undefined"
	[attr.strings]="stringified"></altcha-widget>
`
	})
/**
 * Wraps the ALTCHA proof-of-work widget and exposes Angular-friendly outputs.
 * Emits verified payloads and state changes to parent components.
 */
export class AltchaWidgetComponent implements OnInit, OnDestroy
{
	/**
	 * URL for the ALTCHA challenge endpoint.
	 * @type {InputSignal<string>}
	 */
	readonly challengeUrl: InputSignal<string> =
		input.required<string>();

	/**
	 * Whether to hide the ALTCHA footer branding.
	 * @type {InputSignal<boolean>}
	 */
	readonly hideFooter: InputSignal<boolean> =
		input<boolean>(false);

	/**
	 * Emits the base64-encoded ALTCHA payload when verified successfully.
	 * @type {OutputEmitterRef<string>}
	 */
	readonly verified: OutputEmitterRef<string> =
		output<string>();

	/**
	 * Emits when widget state changes (unverified, verifying, verified, error).
	 * @type {OutputEmitterRef<AltchaWidgetState>}
	 */
	readonly stateChanged: OutputEmitterRef<AltchaWidgetState> =
		output<AltchaWidgetState>();

	/**
	 * Reference to the native ALTCHA widget element.
	 * @type {Signal<ElementRef<HTMLElement> | undefined>}
	 * @readonly
	 */
	private readonly widgetRef: Signal<ElementRef<HTMLElement> | undefined> =
		viewChild<ElementRef<HTMLElement>>(
			"widget");

	/**
	 * JSON-stringified widget UI strings.
	 * @type {string}
	 * @protected
	 * @readonly
	 */
	protected readonly stringified: string =
		JSON.stringify(ALTCHA_STRINGS);

	/**
	 * Bound reference to the statechange handler for cleanup.
	 * @type {(event: Event) => void}
	 * @private
	 */
	private boundStateHandler: ((event: Event) => void) | null = null;

	/**
	 * Initializes event listeners on the ALTCHA widget.
	 * @returns {void}
	 */
	ngOnInit(): void
	{
		// Defer event binding to allow template to render
		setTimeout(
			() =>
			{
				const element: HTMLElement | undefined =
					this.widgetRef()?.nativeElement;
				if (isNullOrUndefined(element))
				{
					return;
				}

				this.boundStateHandler =
					(event: Event): void =>
						this.handleStateChange(event);
				element.addEventListener(
					"statechange",
					this.boundStateHandler);
			},
			0);
	}

	/**
	 * Cleans up event listeners.
	 * @returns {void}
	 */
	ngOnDestroy(): void
	{
		const element: HTMLElement | undefined =
			this.widgetRef()?.nativeElement;
		if (element && this.boundStateHandler)
		{
			element.removeEventListener(
				"statechange",
				this.boundStateHandler);
		}
	}

	/**
	 * Handles ALTCHA widget state changes.
	 * @param {Event} event
	 * The statechange event from the ALTCHA widget.
	 * @private
	 */
	private handleStateChange(event: Event): void
	{
		const customEvent: CustomEvent<{ state: AltchaWidgetState; payload?: string; }> =
			event as CustomEvent<
				{ state: AltchaWidgetState; payload?: string; }>;
		const state: AltchaWidgetState =
			customEvent.detail.state;

		// Emit payload when verified
		if (state === "verified" && customEvent.detail.payload)
		{
			this.verified.emit(customEvent.detail.payload);
		}

		this.stateChanged.emit(state);
	}

	/**
	 * Resets the widget to initial state.
	 * @returns {void}
	 */
	reset(): void
	{
		const element: HTMLElement & { reset?: () => void; } | undefined =
			this.widgetRef()?.nativeElement as
			& HTMLElement
			& { reset?: () => void; };
		element?.reset?.();
	}
}