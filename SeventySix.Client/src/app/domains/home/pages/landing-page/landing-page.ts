import {
	afterNextRender,
	ChangeDetectionStrategy,
	Component,
	inject
} from "@angular/core";
import {
	ARCHITECTURE_CARDS,
	FEATURE_HIGHLIGHTS,
	GITHUB_CLONE_COMMAND,
	GITHUB_REPO_URL,
	STAT_ITEMS,
	TECH_STACK_CATEGORIES
} from "@home/constants/landing-page.constants";
import {
	ArchitectureCard,
	FeatureHighlight,
	StatItem,
	TechStackCategory
} from "@home/models";
import {
	ArchitectureSectionComponent,
	CtaFooterSectionComponent,
	FeaturesSectionComponent,
	HeroSectionComponent,
	StatsSectionComponent,
	TechStackSectionComponent
} from "@home/pages/landing-page/sections";
import { LandingPageSeoService } from "@home/services";

/**
 * Landing page component — dual-theme parallax showcase.
 * Orchestrates section sub-components and provides page data from constants.
 *
 * Loaded directly by the HomeComponent wrapper.
 * Injects JSON-LD structured data and meta tags after first render
 * for SEO and social sharing.
 */
@Component(
	{
		selector: "app-landing-page",
		changeDetection: ChangeDetectionStrategy.OnPush,
		host: { class: "full-width-page" },
		imports: [
			HeroSectionComponent,
			TechStackSectionComponent,
			StatsSectionComponent,
			FeaturesSectionComponent,
			ArchitectureSectionComponent,
			CtaFooterSectionComponent
		],
		templateUrl: "./landing-page.html",
		styleUrl: "./landing-page.scss"
	})
export class LandingPageComponent
{
	/**
	 * SEO service that injects JSON-LD structured data and meta tags.
	 * @type {LandingPageSeoService}
	 * @private
	 * @readonly
	 */
	private readonly seoService: LandingPageSeoService =
		inject(LandingPageSeoService);

	/**
	 * Tech stack categories (Server, Client, Infrastructure) passed to the tech-stack section.
	 * @type {readonly TechStackCategory[]}
	 * @protected
	 * @readonly
	 */
	protected readonly techStackCategories: readonly TechStackCategory[] =
		TECH_STACK_CATEGORIES;

	/**
	 * Feature highlight entries passed to the features section.
	 * @type {readonly FeatureHighlight[]}
	 * @protected
	 * @readonly
	 */
	protected readonly featureHighlights: readonly FeatureHighlight[] = FEATURE_HIGHLIGHTS;

	/**
	 * Animated stats counter items passed to the stats section.
	 * @type {readonly StatItem[]}
	 * @protected
	 * @readonly
	 */
	protected readonly statItems: readonly StatItem[] = STAT_ITEMS;

	/**
	 * Expandable architecture cards passed to the architecture section.
	 * @type {readonly ArchitectureCard[]}
	 * @protected
	 * @readonly
	 */
	protected readonly architectureCards: readonly ArchitectureCard[] = ARCHITECTURE_CARDS;

	/**
	 * GitHub repository URL passed to hero and CTA sections.
	 * @type {string}
	 * @protected
	 * @readonly
	 */
	protected readonly githubRepoUrl: string = GITHUB_REPO_URL;

	/**
	 * `git clone` command string passed to the CTA footer.
	 * @type {string}
	 * @protected
	 * @readonly
	 */
	protected readonly githubCloneCommand: string =
		GITHUB_CLONE_COMMAND;

	constructor()
	{
		afterNextRender(
			() =>
			{
				this.seoService.setup();
			});
	}
}