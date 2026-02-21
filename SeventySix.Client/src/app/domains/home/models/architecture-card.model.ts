/** Architecture deep-dive card displayed in the expandable accordion section. */
export interface ArchitectureCard
{
	/** Card heading (e.g. "Domain-Driven Design"). */
	readonly title: string;
	/** Material icon name rendered beside the title. */
	readonly icon: string;
	/** One-line summary shown in the collapsed state. */
	readonly shortDescription: string;
	/** Detailed bullet points revealed when the card is expanded. */
	readonly details: readonly string[];
	/** Keyword chips shown below the details (e.g. "DDD", "CQRS"). */
	readonly keywords: readonly string[];
}