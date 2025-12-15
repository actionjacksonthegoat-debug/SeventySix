/**
 * Query Keys Tests
 * Verifies centralized query key constants for TanStack Query
 */

import { QueryKeys } from "./query-keys.utility";

describe("QueryKeys",
	() =>
	{
		describe("logs",
			() =>
			{
				it("should have correct all key",
					() =>
					{
						const key: readonly string[] =
							QueryKeys.logs.all;
						expect(key)
						.toEqual(
							["logs"]);
					});

				it("should generate correct paged key with filter",
					() =>
					{
						const filter: { page: number; } =
							{ page: 1 };
						const key: readonly unknown[] =
							QueryKeys.logs.paged(filter);
						expect(key)
						.toEqual(
							["logs", filter]);
					});

				it("should generate correct count key with filter",
					() =>
					{
						const filter: { page: number; } =
							{ page: 1 };
						const key: readonly unknown[] =
							QueryKeys.logs.count(filter);
						expect(key)
						.toEqual(
							["logs", "count", filter]);
					});
			});

		describe("users",
			() =>
			{
				it("should have correct all key",
					() =>
					{
						const key: readonly string[] =
							QueryKeys.users.all;
						expect(key)
						.toEqual(
							["users"]);
					});

				it("should generate correct paged key with filter",
					() =>
					{
						const filter: { page: number; } =
							{ page: 1 };
						const key: readonly unknown[] =
							QueryKeys.users.paged(filter);
						expect(key)
						.toEqual(
							["users", "paged", filter]);
					});

				it("should generate correct single key with number id",
					() =>
					{
						const key: readonly unknown[] =
							QueryKeys.users.single(123);
						expect(key)
						.toEqual(
							["users", "user", 123]);
					});

				it("should generate correct single key with string id",
					() =>
					{
						const key: readonly unknown[] =
							QueryKeys.users.single("abc");
						expect(key)
						.toEqual(
							["users", "user", "abc"]);
					});

				it("should generate correct byUsername key",
					() =>
					{
						const key: readonly unknown[] =
							QueryKeys.users.byUsername("testuser");
						expect(key)
						.toEqual(
							["users", "username", "testuser"]);
					});
			});

		describe("type safety",
			() =>
			{
				it("should return readonly arrays",
					() =>
					{
						// TypeScript compile-time check - these should be readonly
						const logsAll: readonly string[] =
							QueryKeys.logs.all;
						const usersAll: readonly string[] =
							QueryKeys.users.all;

						expect(logsAll)
						.toBeDefined();
						expect(usersAll)
						.toBeDefined();
					});
			});
	});
