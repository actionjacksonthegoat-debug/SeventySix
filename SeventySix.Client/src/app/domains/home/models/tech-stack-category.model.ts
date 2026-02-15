import { TechStackItem } from "@home/models/tech-stack-item.model";

/** Grouped technology category containing related {@link TechStackItem} entries. */
export interface TechStackCategory
{
	/** Category heading (e.g. "Server", "Client", "Infrastructure"). */
	readonly title: string;
	/** Material icon name displayed beside the category heading. */
	readonly icon: string;
	/** Technology items belonging to this category. */
	readonly items: readonly TechStackItem[];
}
