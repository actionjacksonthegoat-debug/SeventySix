ALTER TABLE "orders" ADD COLUMN "fulfillment_channel" text DEFAULT 'printful' NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "shipping_provider" text;--> statement-breakpoint
ALTER TABLE "product_variants" ADD COLUMN "stock_level" integer;--> statement-breakpoint
ALTER TABLE "product_variants" ADD COLUMN "low_stock_threshold" integer DEFAULT 5 NOT NULL;