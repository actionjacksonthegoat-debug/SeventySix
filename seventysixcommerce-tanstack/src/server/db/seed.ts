import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

/**
 * Seed the database with sample art pieces, categories, products, and variants.
 * Run with: npx tsx src/server/db/seed.ts
 */
async function seed(): Promise<void>
{
	const pool =
		new pg.Pool(
			{
				connectionString: process.env.DATABASE_URL
			});
	const db =
		drizzle(pool,
			{ schema });

	console.log("Seeding database...");

	// Skip if already seeded
	const existing =
		await db
			.select(
				{ id: schema.artPieces.id })
			.from(schema.artPieces)
			.limit(1);

	if (existing.length > 0)
	{
		console.log("Database already seeded, skipping.");
		await pool.end();
		return;
	}

	// Art pieces
	const [neonHorizon, cosmicGarden, electricWilderness] =
		await db
			.insert(schema.artPieces)
			.values(
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
				])
			.returning();

	// Categories
	const [posterCat, apparelCat, mugCat] =
		await db
			.insert(schema.categories)
			.values(
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
				])
			.returning();

	// Products — 3 art × 3 categories = 9 products
	const productValues =
		[
		// Neon Horizon
			{
				artPieceId: neonHorizon!.id,
				categoryId: posterCat!.id,
				title: "Neon Horizon — Premium Poster",
				slug: "neon-horizon-poster",
				description: "Museum-quality poster of Neon Horizon on 200gsm matte paper.",
				seoDescription: "Buy the Neon Horizon art poster — vibrant cityscape, museum-quality print.",
				basePrice: "24.99",
				thumbnailUrl: "/api/placeholder/600/600/Neon%20Horizon%20Poster",
				isFeatured: true
			},
			{
				artPieceId: neonHorizon!.id,
				categoryId: apparelCat!.id,
				title: "Neon Horizon — Classic Tee",
				slug: "neon-horizon-tee",
				description: "Soft cotton tee featuring the Neon Horizon artwork.",
				seoDescription: "Shop the Neon Horizon t-shirt — original art on premium cotton.",
				basePrice: "29.99",
				thumbnailUrl: "/api/placeholder/600/600/Neon%20Horizon%20Tee"
			},
			{
				artPieceId: neonHorizon!.id,
				categoryId: mugCat!.id,
				title: "Neon Horizon — Ceramic Mug",
				slug: "neon-horizon-mug",
				description: "11oz ceramic mug with full-wrap Neon Horizon artwork.",
				seoDescription: "Neon Horizon art mug — dishwasher safe, full-wrap print.",
				basePrice: "16.99",
				thumbnailUrl: "/api/placeholder/600/600/Neon%20Horizon%20Mug"
			},
			// Cosmic Garden
			{
				artPieceId: cosmicGarden!.id,
				categoryId: posterCat!.id,
				title: "Cosmic Garden — Premium Poster",
				slug: "cosmic-garden-poster",
				description: "Museum-quality poster of Cosmic Garden on 200gsm matte paper.",
				seoDescription: "Buy the Cosmic Garden art poster — floral space art, museum-quality print.",
				basePrice: "24.99",
				thumbnailUrl: "/api/placeholder/600/600/Cosmic%20Garden%20Poster",
				isFeatured: true
			},
			{
				artPieceId: cosmicGarden!.id,
				categoryId: apparelCat!.id,
				title: "Cosmic Garden — Classic Tee",
				slug: "cosmic-garden-tee",
				description: "Soft cotton tee featuring the Cosmic Garden artwork.",
				seoDescription: "Shop the Cosmic Garden t-shirt — original art on premium cotton.",
				basePrice: "29.99",
				thumbnailUrl: "/api/placeholder/600/600/Cosmic%20Garden%20Tee",
				isFeatured: true
			},
			{
				artPieceId: cosmicGarden!.id,
				categoryId: mugCat!.id,
				title: "Cosmic Garden — Ceramic Mug",
				slug: "cosmic-garden-mug",
				description: "11oz ceramic mug with full-wrap Cosmic Garden artwork.",
				seoDescription: "Cosmic Garden art mug — dishwasher safe, full-wrap print.",
				basePrice: "16.99",
				thumbnailUrl: "/api/placeholder/600/600/Cosmic%20Garden%20Mug"
			},
			// Electric Wilderness
			{
				artPieceId: electricWilderness!.id,
				categoryId: posterCat!.id,
				title: "Electric Wilderness — Premium Poster",
				slug: "electric-wilderness-poster",
				description: "Museum-quality poster of Electric Wilderness on 200gsm matte paper.",
				seoDescription: "Buy the Electric Wilderness art poster — wildlife silhouettes, museum-quality print.",
				basePrice: "24.99",
				thumbnailUrl: "/api/placeholder/600/600/Electric%20Wilderness%20Poster"
			},
			{
				artPieceId: electricWilderness!.id,
				categoryId: apparelCat!.id,
				title: "Electric Wilderness — Classic Tee",
				slug: "electric-wilderness-tee",
				description: "Soft cotton tee featuring the Electric Wilderness artwork.",
				seoDescription: "Shop the Electric Wilderness t-shirt — original art on premium cotton.",
				basePrice: "29.99",
				thumbnailUrl: "/api/placeholder/600/600/Electric%20Wilderness%20Tee"
			},
			{
				artPieceId: electricWilderness!.id,
				categoryId: mugCat!.id,
				title: "Electric Wilderness — Ceramic Mug",
				slug: "electric-wilderness-mug",
				description: "11oz ceramic mug with full-wrap Electric Wilderness artwork.",
				seoDescription: "Electric Wilderness art mug — dishwasher safe, full-wrap print.",
				basePrice: "16.99",
				thumbnailUrl: "/api/placeholder/600/600/Electric%20Wilderness%20Mug",
				isFeatured: true
			}
		];

	const products =
		await db
			.insert(schema.products)
			.values(productValues)
			.returning();

	// Variants — posters get sizes, apparel gets S/M/L/XL, mugs get 11oz/15oz
	const variantValues: Array<{ productId: string; name: string; }> = [];
	for (const product of products)
	{
		if (product.slug.endsWith("-poster"))
		{
			variantValues.push(
				{ productId: product.id, name: "18×24 inches" });
			variantValues.push(
				{ productId: product.id, name: "24×36 inches" });
		}
		else if (product.slug.endsWith("-tee"))
		{
			variantValues.push(
				{ productId: product.id, name: "Small" });
			variantValues.push(
				{ productId: product.id, name: "Medium" });
			variantValues.push(
				{ productId: product.id, name: "Large" });
			variantValues.push(
				{ productId: product.id, name: "XL" });
		}
		else if (product.slug.endsWith("-mug"))
		{
			variantValues.push(
				{ productId: product.id, name: "11 oz" });
			variantValues.push(
				{ productId: product.id, name: "15 oz" });
		}
	}

	await db
		.insert(schema.productVariants)
		.values(variantValues);

	console.log(
		`Seeding complete: 3 art pieces, 3 categories, ${products.length} products, ${variantValues.length} variants.`);
	await pool.end();
}

seed()
	.catch(
		(error: unknown) =>
		{
			console.error("Seed failed:", error);
			process.exit(1);
		});