CREATE TABLE IF NOT EXISTS "checkout_snapshots" (
	"stripe_session_id" text PRIMARY KEY NOT NULL,
	"cart_session_id" uuid NOT NULL,
	"items" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
