import {
	ChangeDetectionStrategy,
	Component,
	input,
	InputSignal,
	signal,
	WritableSignal
} from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { ScrollRevealDirective } from "@shared/directives";

/** Duration (ms) the "Copied!" feedback badge is shown before resetting. */
const COPY_FEEDBACK_DURATION_MS: number = 2_000;

/**
 * CTA footer section — clone command with copy-to-clipboard and GitHub action links.
 * Visual bookend to the hero section using gradient mesh background.
 */
@Component(
	{
		selector: "app-cta-footer-section",
		changeDetection: ChangeDetectionStrategy.OnPush,
		imports: [
			MatButtonModule,
			MatIconModule,
			ScrollRevealDirective
		],
		templateUrl: "./cta-footer-section.html",
		styleUrl: "./cta-footer-section.scss"
	})
export class CtaFooterSectionComponent
{
	/**
	 * GitHub repository URL passed from parent.
	 * @type {InputSignal<string>}
	 * @readonly
	 */
	readonly githubUrl: InputSignal<string> =
		input.required<string>();

	/**
	 * Git clone command string passed from parent.
	 * @type {InputSignal<string>}
	 * @readonly
	 */
	readonly cloneCommand: InputSignal<string> =
		input.required<string>();

	/**
	 * Whether the clone command was recently copied to clipboard.
	 * @type {WritableSignal<boolean>}
	 * @protected
	 * @readonly
	 */
	protected readonly copied: WritableSignal<boolean> =
		signal<boolean>(false);

	/**
	 * Copies the clone command to the system clipboard and
	 * briefly shows a "Copied!" confirmation.
	 *
	 * @returns {Promise<void>}
	 * Resolves after the clipboard write completes.
	 */
	protected async copyCloneCommand(): Promise<void>
	{
		await navigator.clipboard.writeText(this.cloneCommand());
		this.copied.set(true);
		setTimeout(
			() => this.copied.set(false),
			COPY_FEEDBACK_DURATION_MS);
	}
}