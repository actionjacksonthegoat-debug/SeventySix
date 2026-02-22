import {
	ChangeDetectionStrategy,
	Component,
	input,
	InputSignal,
	signal,
	WritableSignal
} from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { MatChipsModule } from "@angular/material/chips";
import { MatIconModule } from "@angular/material/icon";
import { ArchitectureCard } from "@home/models";
import { ScrollRevealDirective } from "@shared/directives";

/**
 * Architecture section — expandable cards for architecture patterns.
 * Only one card can be expanded at a time (accordion behavior).
 */
@Component(
	{
		selector: "app-architecture-section",
		changeDetection: ChangeDetectionStrategy.OnPush,
		imports: [
			MatCardModule,
			MatIconModule,
			MatButtonModule,
			MatChipsModule,
			ScrollRevealDirective
		],
		templateUrl: "./architecture-section.html",
		styleUrl: "./architecture-section.scss"
	})
export class ArchitectureSectionComponent
{
	/**
	 * Architecture deep-dive cards with title, icon, details, and keywords.
	 * @type {InputSignal<readonly ArchitectureCard[]>}
	 * @readonly
	 */
	readonly cards: InputSignal<readonly ArchitectureCard[]> =
		input.required<readonly ArchitectureCard[]>();

	/**
	 * Index of the currently expanded card, or `null` when all are collapsed.
	 * @type {WritableSignal<number | null>}
	 * @protected
	 * @readonly
	 */
	protected readonly expandedIndex: WritableSignal<number | null> =
		signal<number | null>(null);

	/**
	 * Toggles the expanded state of a card.
	 * If the card at `index` is already expanded, it collapses;
	 * otherwise it expands that card and collapses the previous one.
	 *
	 * @param {number} index
	 * The zero-based index of the card to toggle.
	 */
	protected toggleCard(index: number): void
	{
		this.expandedIndex.update(
			(current: number | null) =>
				current === index ? null : index);
	}
}