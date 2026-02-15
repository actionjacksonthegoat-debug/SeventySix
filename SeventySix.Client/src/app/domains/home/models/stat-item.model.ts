/** Animated statistics counter item displayed in the stats bar. */
export interface StatItem
{
	/** Numeric value animated by the count-up directive. */
	readonly value: number;
	/** Suffix appended after the animated number (e.g. "+", "$"). */
	readonly suffix: string;
	/** Descriptive label shown below the counter. */
	readonly label: string;
	/** Material icon name rendered above the counter. */
	readonly icon: string;
}
