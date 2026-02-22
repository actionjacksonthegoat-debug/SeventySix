/** Feature highlight entry displayed in the alternating left/right layout. */
export interface FeatureHighlight
{
	/** Feature heading (e.g. "Enterprise Security"). */
	readonly title: string;
	/** Material icon name rendered inside the feature card. */
	readonly icon: string;
	/** Short tagline displayed below the heading. */
	readonly tagline: string;
	/** Full paragraph description of the feature. */
	readonly description: string;
	/** Bullet-point list of specific capabilities. */
	readonly bullets: readonly string[];
}