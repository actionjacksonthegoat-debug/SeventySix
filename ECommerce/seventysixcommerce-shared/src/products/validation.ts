/**
 * Zod validation schemas for product query inputs.
 */
import { z } from "zod";
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from "../constants";
import type { GetProductsInput } from "./types";

/** Maximum allowed length for URL slugs. */
const MAX_SLUG_LENGTH: number = 200;

/** Pattern for valid URL slugs (lowercase alphanumeric with hyphens). */
const SLUG_PATTERN: RegExp =
	/^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Validation schema for a product/category URL slug. */
export const slugSchema: z.ZodType<string> =
	z
		.string()
		.max(MAX_SLUG_LENGTH)
		.regex(SLUG_PATTERN);

/** Validation schema for paginated product listing input. */
export const getProductsSchema: z.ZodType<GetProductsInput> =
	z.object(
		{
			category: z
				.string()
				.max(MAX_SLUG_LENGTH)
				.regex(SLUG_PATTERN)
				.optional(),
			page: z
				.coerce
				.number()
				.int()
				.positive()
				.default(1),
			limit: z
				.coerce
				.number()
				.int()
				.positive()
				.max(MAX_PAGE_SIZE)
				.default(DEFAULT_PAGE_SIZE)
		});