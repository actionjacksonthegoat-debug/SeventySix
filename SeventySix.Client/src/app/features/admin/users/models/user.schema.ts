import { z } from "zod";

/**
 * Zod schema for User model
 * Provides runtime type validation for API responses
 */
export const UserSchema: z.ZodType<{
	id: number;
	username: string;
	email: string;
	fullName?: string | undefined;
	createdAt: string;
	isActive: boolean;
	createdBy?: string | undefined;
	modifiedAt?: string | undefined;
	modifiedBy?: string | undefined;
	lastLoginAt?: string | undefined;
	rowVersion?: number | undefined;
}> = z.object({
	id: z.number().int().positive(),
	username: z.string().min(3).max(50),
	email: z.string().email(),
	fullName: z.string().max(100).optional(),
	createdAt: z.string().datetime(),
	isActive: z.boolean(),
	createdBy: z.string().optional(),
	modifiedAt: z.string().datetime().optional(),
	modifiedBy: z.string().optional(),
	lastLoginAt: z.string().datetime().optional(),
	rowVersion: z.number().int().nonnegative().optional()
});

/**
 * Infer TypeScript type from Zod schema
 */
export type UserFromSchema = z.infer<typeof UserSchema>;

/**
 * Zod schema for CreateUserRequest
 */
export const CreateUserRequestSchema: z.ZodType<{
	username: string;
	email: string;
	fullName?: string | undefined;
	isActive?: boolean | undefined;
}> = z.object({
	username: z.string().min(3).max(50),
	email: z.string().email(),
	fullName: z.string().max(100).optional(),
	isActive: z.boolean().optional().default(true)
});

/**
 * Zod schema for UpdateUserRequest
 */
export const UpdateUserRequestSchema: z.ZodType<{
	id: number;
	username: string;
	email: string;
	fullName?: string | undefined;
	isActive: boolean;
	rowVersion?: number | undefined;
}> = z.object({
	id: z.number().int().positive(),
	username: z.string().min(3).max(50),
	email: z.string().email(),
	fullName: z.string().max(100).optional(),
	isActive: z.boolean(),
	rowVersion: z.number().int().nonnegative().optional()
});

/**
 * Zod schema for UserQueryRequest
 */
export const UserQueryRequestSchema: z.ZodType<{
	page: number;
	pageSize: number;
	searchTerm?: string | undefined;
	includeInactive?: boolean | undefined;
	sortBy?: string | undefined;
	sortDescending?: boolean | undefined;
}> = z.object({
	page: z.number().int().min(1),
	pageSize: z.number().int().min(1).max(100),
	searchTerm: z.string().optional(),
	includeInactive: z.boolean().optional(),
	sortBy: z.string().optional(),
	sortDescending: z.boolean().optional()
});

/**
 * Generic Zod schema for PagedResult
 * Use with .extend() to specify the items type
 */
export const PagedResultSchema: <T extends z.ZodTypeAny>(
	itemSchema: T
) => z.ZodObject<{
	items: z.ZodArray<T>;
	totalCount: z.ZodNumber;
	page: z.ZodNumber;
	pageSize: z.ZodNumber;
	totalPages: z.ZodNumber;
	hasPreviousPage: z.ZodBoolean;
	hasNextPage: z.ZodBoolean;
}> = <T extends z.ZodTypeAny>(
	itemSchema: T
): z.ZodObject<{
	items: z.ZodArray<T>;
	totalCount: z.ZodNumber;
	page: z.ZodNumber;
	pageSize: z.ZodNumber;
	totalPages: z.ZodNumber;
	hasPreviousPage: z.ZodBoolean;
	hasNextPage: z.ZodBoolean;
}> =>
	z.object({
		items: z.array(itemSchema),
		totalCount: z.number().int().nonnegative(),
		page: z.number().int().min(1),
		pageSize: z.number().int().min(1),
		totalPages: z.number().int().nonnegative(),
		hasPreviousPage: z.boolean(),
		hasNextPage: z.boolean()
	});

/**
 * Specific schema for PagedResult<User>
 */
export const PagedUserResultSchema: ReturnType<
	typeof PagedResultSchema<typeof UserSchema>
> = PagedResultSchema(UserSchema);
