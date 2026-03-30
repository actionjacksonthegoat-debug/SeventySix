import { env } from "$env/dynamic/private";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

/** PostgreSQL connection pool. */
const pool: pg.Pool =
	new pg.Pool(
		{
			connectionString: env.DATABASE_URL
		});

/** Drizzle ORM database instance with schema for relational queries. */
export const db: NodePgDatabase<typeof schema> =
	drizzle(pool,
		{ schema });