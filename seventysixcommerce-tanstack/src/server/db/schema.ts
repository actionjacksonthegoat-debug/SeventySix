import {
	boolean,
	integer,
	jsonb,
	numeric,
	pgEnum,
	pgTable,
	text,
	timestamp,
	uniqueIndex,
	uuid
} from "drizzle-orm/pg-core";

/** Order status lifecycle enum. */
export const orderStatusEnum =
	pgEnum("order_status",
		[
			"pending",
			"paid",
			"fulfilling",
			"shipped",
			"delivered",
			"cancelled",
			"refunded",
			"fulfillment_error"
		]);

/** Original artwork metadata. */
export const artPieces =
	pgTable("art_pieces",
		{
			id: uuid("id")
				.primaryKey()
				.defaultRandom(),
			title: text("title")
				.notNull(),
			slug: text("slug")
				.notNull()
				.unique(),
			description: text("description")
				.notNull(),
			imageUrl: text("image_url")
				.notNull(),
			tags: text("tags")
				.array()
				.notNull()
				.default([]),
			createdAt: timestamp("created_at",
				{ withTimezone: true })
				.notNull()
				.defaultNow()
		});

/** Product categories. */
export const categories =
	pgTable("categories",
		{
			id: uuid("id")
				.primaryKey()
				.defaultRandom(),
			name: text("name")
				.notNull(),
			slug: text("slug")
				.notNull()
				.unique(),
			description: text("description"),
			sortOrder: integer("sort_order")
				.notNull()
				.default(0)
		});

/** Merchandise products linked to art pieces. */
export const products =
	pgTable("products",
		{
			id: uuid("id")
				.primaryKey()
				.defaultRandom(),
			artPieceId: uuid("art_piece_id")
				.notNull()
				.references(() => artPieces.id),
			categoryId: uuid("category_id")
				.notNull()
				.references(() => categories.id),
			title: text("title")
				.notNull(),
			slug: text("slug")
				.notNull()
				.unique(),
			description: text("description")
				.notNull(),
			seoDescription: text("seo_description"),
			basePrice: numeric("base_price",
				{ precision: 10, scale: 2 })
				.notNull(),
			thumbnailUrl: text("thumbnail_url")
				.notNull(),
			ogImageUrl: text("og_image_url"),
			isActive: boolean("is_active")
				.notNull()
				.default(true),
			isFeatured: boolean("is_featured")
				.notNull()
				.default(false),
			createdAt: timestamp("created_at",
				{ withTimezone: true })
				.notNull()
				.defaultNow()
		});

/** Size/color variants with Printful sync IDs. */
export const productVariants =
	pgTable("product_variants",
		{
			id: uuid("id")
				.primaryKey()
				.defaultRandom(),
			productId: uuid("product_id")
				.notNull()
				.references(() => products.id),
			name: text("name")
				.notNull(),
			printfulSyncVariantId: text("printful_sync_variant_id"),
			isAvailable: boolean("is_available")
				.notNull()
				.default(true)
		});

/** Anonymous cart sessions. */
export const cartSessions =
	pgTable("cart_sessions",
		{
			id: uuid("id")
				.primaryKey(),
			createdAt: timestamp("created_at",
				{ withTimezone: true })
				.notNull()
				.defaultNow(),
			expiresAt: timestamp("expires_at",
				{ withTimezone: true })
				.notNull()
		});

/** Items in a cart session. */
export const cartItems =
	pgTable(
		"cart_items",
		{
			id: uuid("id")
				.primaryKey()
				.defaultRandom(),
			sessionId: uuid("session_id")
				.notNull()
				.references(() => cartSessions.id,
					{ onDelete: "cascade" }),
			productId: uuid("product_id")
				.notNull()
				.references(() => products.id),
			variantId: uuid("variant_id")
				.notNull()
				.references(() => productVariants.id),
			quantity: integer("quantity")
				.notNull()
				.default(1),
			unitPrice: numeric("unit_price",
				{ precision: 10, scale: 2 })
				.notNull(),
			createdAt: timestamp("created_at",
				{ withTimezone: true })
				.notNull()
				.defaultNow()
		},
		(table) =>
			[
				uniqueIndex("cart_items_session_variant_idx")
					.on(
						table.sessionId,
						table.variantId)
			]);

/** Completed orders. */
export const orders =
	pgTable("orders",
		{
			id: uuid("id")
				.primaryKey()
				.defaultRandom(),
			stripeSessionId: text("stripe_session_id")
				.notNull()
				.unique(),
			cartSessionId: uuid("cart_session_id"),
			email: text("email")
				.notNull(),
			status: orderStatusEnum("status")
				.notNull()
				.default("pending"),
			totalAmount: numeric("total_amount",
				{ precision: 10, scale: 2 })
				.notNull(),
			shippingAddress: jsonb("shipping_address"),
			shippingName: text("shipping_name"),
			trackingUrl: text("tracking_url"),
			printfulOrderId: text("printful_order_id"),
			createdAt: timestamp("created_at",
				{ withTimezone: true })
				.notNull()
				.defaultNow(),
			updatedAt: timestamp("updated_at",
				{ withTimezone: true })
				.notNull()
				.defaultNow()
		});

/** Line items in a completed order. */
export const orderItems =
	pgTable("order_items",
		{
			id: uuid("id")
				.primaryKey()
				.defaultRandom(),
			orderId: uuid("order_id")
				.notNull()
				.references(() => orders.id),
			productId: uuid("product_id")
				.notNull()
				.references(() => products.id),
			variantId: uuid("variant_id")
				.notNull()
				.references(() => productVariants.id),
			quantity: integer("quantity")
				.notNull(),
			unitPrice: numeric("unit_price",
				{ precision: 10, scale: 2 })
				.notNull()
		});

/** Immutable snapshot of cart items captured at checkout session creation. */
export const checkoutSnapshots =
	pgTable("checkout_snapshots",
		{
			stripeSessionId: text("stripe_session_id")
				.primaryKey(),
			cartSessionId: uuid("cart_session_id")
				.notNull(),
			items: jsonb("items")
				.$type<
				Array<{
					productId: string;
					variantId: string;
					quantity: number;
					unitPrice: string;
				}>>()
				.notNull(),
			createdAt: timestamp("created_at",
				{ withTimezone: true })
				.notNull()
				.defaultNow()
		});

/** Order status change audit trail. */
export const orderStatusHistory =
	pgTable("order_status_history",
		{
			id: uuid("id")
				.primaryKey()
				.defaultRandom(),
			orderId: uuid("order_id")
				.notNull()
				.references(() => orders.id),
			fromStatus: orderStatusEnum("from_status"),
			toStatus: orderStatusEnum("to_status")
				.notNull(),
			changedAt: timestamp("changed_at",
				{ withTimezone: true })
				.notNull()
				.defaultNow(),
			reason: text("reason")
		});