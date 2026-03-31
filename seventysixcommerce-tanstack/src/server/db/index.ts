import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const pool: pg.Pool =
	new pg.Pool(
		{
			connectionString: process.env.DATABASE_URL
		});

/** Drizzle ORM database instance. */
export const db: NodePgDatabase<typeof schema> =
	drizzle(pool,
		{ schema });