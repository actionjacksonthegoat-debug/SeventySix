/** Shape of an art piece for database seeding. */
export interface ArtPieceSeed
{
	/** Display title of the art piece. */
	title: string;
	/** URL-safe slug identifier. */
	slug: string;
	/** Human-readable description. */
	description: string;
	/** Placeholder image URL path. */
	imageUrl: string;
	/** Categorization tags for the art piece. */
	tags: string[];
}

/** Shape of a product category for database seeding. */
export interface CategorySeed
{
	/** Display name of the category. */
	name: string;
	/** URL-safe slug identifier. */
	slug: string;
	/** Human-readable description. */
	description: string;
	/** Display ordering (ascending). */
	sortOrder: number;
}

/** Shape of a product template for database seeding, referencing art piece and category by index. */
export interface ProductTemplateSeed
{
	/** Index into DEFAULT_ART_PIECES for the associated art piece. */
	artPieceIndex: number;
	/** Index into DEFAULT_CATEGORIES for the associated category. */
	categoryIndex: number;
	/** Display title of the product. */
	title: string;
	/** URL-safe slug identifier. */
	slug: string;
	/** Human-readable description. */
	description: string;
	/** SEO-optimized description for search engines. */
	seoDescription: string;
	/** Base price as a decimal string (e.g. "24.99"). */
	basePrice: string;
	/** Placeholder thumbnail image URL path. */
	thumbnailUrl: string;
	/** Whether this product should be featured on the home page. */
	isFeatured: boolean;
}

/** Default art pieces used for seeding development databases. */
export const DEFAULT_ART_PIECES: readonly ArtPieceSeed[] =
	[
		{
			title: "Neon Horizon",
			slug: "neon-horizon",
			description: "A vibrant sunset cityscape with neon-lit reflections.",
			imageUrl: "/api/placeholder/800/800/Neon%20Horizon",
			tags: ["cityscape", "neon", "sunset"]
		},
		{
			title: "Cosmic Garden",
			slug: "cosmic-garden",
			description: "Floral forms drifting through a star-filled void.",
			imageUrl: "/api/placeholder/800/800/Cosmic%20Garden",
			tags: ["floral", "space", "abstract"]
		},
		{
			title: "Electric Wilderness",
			slug: "electric-wilderness",
			description: "Wildlife silhouettes against an electrified forest backdrop.",
			imageUrl: "/api/placeholder/800/800/Electric%20Wilderness",
			tags: ["wildlife", "forest", "electric"]
		}
	];

/** Default product categories used for seeding development databases. */
export const DEFAULT_CATEGORIES: readonly CategorySeed[] =
	[
		{
			name: "Posters",
			slug: "posters",
			description: "Museum-quality art prints and posters.",
			sortOrder: 1
		},
		{
			name: "Apparel",
			slug: "apparel",
			description: "Wearable art in premium fabrics.",
			sortOrder: 2
		},
		{
			name: "Mugs",
			slug: "mugs",
			description: "Ceramic mugs with full-wrap artwork.",
			sortOrder: 3
		}
	];

/** Default product templates (3 art × 3 categories = 9 products) for seeding development databases. */
export const DEFAULT_PRODUCT_TEMPLATES: readonly ProductTemplateSeed[] =
	[
	// Neon Horizon
		{
			artPieceIndex: 0,
			categoryIndex: 0,
			title: "Neon Horizon — Premium Poster",
			slug: "neon-horizon-poster",
			description: "Museum-quality poster of Neon Horizon on 200gsm matte paper.",
			seoDescription: "Buy the Neon Horizon art poster — vibrant cityscape, museum-quality print.",
			basePrice: "24.99",
			thumbnailUrl: "/api/placeholder/600/600/Neon%20Horizon%20Poster",
			isFeatured: true
		},
		{
			artPieceIndex: 0,
			categoryIndex: 1,
			title: "Neon Horizon — Classic Tee",
			slug: "neon-horizon-tee",
			description: "Soft cotton tee featuring the Neon Horizon artwork.",
			seoDescription: "Shop the Neon Horizon t-shirt — original art on premium cotton.",
			basePrice: "29.99",
			thumbnailUrl: "/api/placeholder/600/600/Neon%20Horizon%20Tee",
			isFeatured: false
		},
		{
			artPieceIndex: 0,
			categoryIndex: 2,
			title: "Neon Horizon — Ceramic Mug",
			slug: "neon-horizon-mug",
			description: "11oz ceramic mug with full-wrap Neon Horizon artwork.",
			seoDescription: "Neon Horizon art mug — dishwasher safe, full-wrap print.",
			basePrice: "16.99",
			thumbnailUrl: "/api/placeholder/600/600/Neon%20Horizon%20Mug",
			isFeatured: false
		},
		// Cosmic Garden
		{
			artPieceIndex: 1,
			categoryIndex: 0,
			title: "Cosmic Garden — Premium Poster",
			slug: "cosmic-garden-poster",
			description: "Museum-quality poster of Cosmic Garden on 200gsm matte paper.",
			seoDescription: "Buy the Cosmic Garden art poster — floral space art, museum-quality print.",
			basePrice: "24.99",
			thumbnailUrl: "/api/placeholder/600/600/Cosmic%20Garden%20Poster",
			isFeatured: true
		},
		{
			artPieceIndex: 1,
			categoryIndex: 1,
			title: "Cosmic Garden — Classic Tee",
			slug: "cosmic-garden-tee",
			description: "Soft cotton tee featuring the Cosmic Garden artwork.",
			seoDescription: "Shop the Cosmic Garden t-shirt — original art on premium cotton.",
			basePrice: "29.99",
			thumbnailUrl: "/api/placeholder/600/600/Cosmic%20Garden%20Tee",
			isFeatured: true
		},
		{
			artPieceIndex: 1,
			categoryIndex: 2,
			title: "Cosmic Garden — Ceramic Mug",
			slug: "cosmic-garden-mug",
			description: "11oz ceramic mug with full-wrap Cosmic Garden artwork.",
			seoDescription: "Cosmic Garden art mug — dishwasher safe, full-wrap print.",
			basePrice: "16.99",
			thumbnailUrl: "/api/placeholder/600/600/Cosmic%20Garden%20Mug",
			isFeatured: false
		},
		// Electric Wilderness
		{
			artPieceIndex: 2,
			categoryIndex: 0,
			title: "Electric Wilderness — Premium Poster",
			slug: "electric-wilderness-poster",
			description: "Museum-quality poster of Electric Wilderness on 200gsm matte paper.",
			seoDescription: "Buy the Electric Wilderness art poster — wildlife silhouettes, museum-quality print.",
			basePrice: "24.99",
			thumbnailUrl: "/api/placeholder/600/600/Electric%20Wilderness%20Poster",
			isFeatured: false
		},
		{
			artPieceIndex: 2,
			categoryIndex: 1,
			title: "Electric Wilderness — Classic Tee",
			slug: "electric-wilderness-tee",
			description: "Soft cotton tee featuring the Electric Wilderness artwork.",
			seoDescription: "Shop the Electric Wilderness t-shirt — original art on premium cotton.",
			basePrice: "29.99",
			thumbnailUrl: "/api/placeholder/600/600/Electric%20Wilderness%20Tee",
			isFeatured: false
		},
		{
			artPieceIndex: 2,
			categoryIndex: 2,
			title: "Electric Wilderness — Ceramic Mug",
			slug: "electric-wilderness-mug",
			description: "11oz ceramic mug with full-wrap Electric Wilderness artwork.",
			seoDescription: "Electric Wilderness art mug — dishwasher safe, full-wrap print.",
			basePrice: "16.99",
			thumbnailUrl: "/api/placeholder/600/600/Electric%20Wilderness%20Mug",
			isFeatured: true
		}
	];

/**
 * Returns variant names appropriate for the product type based on its slug suffix.
 * @param productSlug - The product slug used to determine category type.
 * @returns An array of variant display names (sizes for posters/apparel, volumes for mugs).
 */
export function buildVariantNames(productSlug: string): string[]
{
	if (productSlug.endsWith("-poster"))
	{
		return ["18×24 inches", "24×36 inches"];
	}
	if (productSlug.endsWith("-tee"))
	{
		return ["Small", "Medium", "Large", "XL"];
	}
	if (productSlug.endsWith("-mug"))
	{
		return ["11 oz", "15 oz"];
	}
	return [];
}