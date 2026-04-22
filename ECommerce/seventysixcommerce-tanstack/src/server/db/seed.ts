import {
	buildVariantNames,
	DEFAULT_ART_PIECES,
	DEFAULT_CATEGORIES,
	DEFAULT_PRODUCT_TEMPLATES
} from "@seventysixcommerce/shared/seed";
import { isNullOrEmpty } from "@seventysixcommerce/shared/utils";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

/** Seeds the development database with sample art, categories, products, and variants. */
async function seed(): Promise<void>
{
	const connectionString: string | undefined =
		process.env.DATABASE_URL;
	if (isNullOrEmpty(connectionString))
	{
		throw new Error("DATABASE_URL environment variable is required for seeding");
	}

	const pool =
		new pg.Pool(
			{ connectionString });
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
	const artPieces =
		await db
			.insert(schema.artPieces)
			.values(
				DEFAULT_ART_PIECES.map((piece) => ({
					title: piece.title,
					slug: piece.slug,
					description: piece.description,
					imageUrl: piece.imageUrl,
					tags: piece.tags
				})))
			.returning();

	// Categories
	const categories =
		await db
			.insert(schema.categories)
			.values(
				DEFAULT_CATEGORIES.map((cat) => ({
					name: cat.name,
					slug: cat.slug,
					description: cat.description,
					sortOrder: cat.sortOrder
				})))
			.returning();

	// Products — 3 art × 3 categories = 9 products
	const productValues =
		DEFAULT_PRODUCT_TEMPLATES.map((template) => ({
			artPieceId: artPieces[template.artPieceIndex]!.id,
			categoryId: categories[template.categoryIndex]!.id,
			title: template.title,
			slug: template.slug,
			description: template.description,
			seoDescription: template.seoDescription,
			basePrice: template.basePrice,
			thumbnailUrl: template.thumbnailUrl,
			isFeatured: template.isFeatured || undefined
		}));

	const products =
		await db
			.insert(schema.products)
			.values(productValues)
			.returning();

	// Variants — posters get sizes, apparel gets S/M/L/XL, mugs get 11oz/15oz
	const variantValues: Array<{ productId: string; name: string; }> = [];
	for (const product of products)
	{
		const names: string[] =
			buildVariantNames(product.slug);
		for (const name of names)
		{
			variantValues.push(
				{ productId: product.id, name });
		}
	}

	await db
		.insert(schema.productVariants)
		.values(variantValues);

	console.log(
		`Seeding complete: ${artPieces.length} art pieces, ${categories.length} categories, ${products.length} products, ${variantValues.length} variants.`);
	await pool.end();
}

seed()
	.catch(
		(error: unknown) =>
		{
			console.error("Seed failed:", error);
			process.exit(1);
		});
