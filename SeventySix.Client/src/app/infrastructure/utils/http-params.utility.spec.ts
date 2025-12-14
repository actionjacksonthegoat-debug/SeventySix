import { HttpParams } from "@angular/common/http";
import { buildHttpParams } from "./http-params.utility";

describe("buildHttpParams",
	() =>
	{
		it("should create empty HttpParams for empty object",
			() =>
			{
				const result: HttpParams =
					buildHttpParams({});

				expect(result.keys().length)
				.toBe(0);
			});

		it("should handle string values",
			() =>
			{
				const result: HttpParams =
					buildHttpParams(
						{ name: "test" });

				expect(result.get("name"))
				.toBe("test");
			});

		it("should handle number values",
			() =>
			{
				const result: HttpParams =
					buildHttpParams(
						{ page: 1, size: 10 });

				expect(result.get("page"))
				.toBe("1");
				expect(result.get("size"))
				.toBe("10");
			});

		it("should handle boolean values",
			() =>
			{
				const result: HttpParams =
					buildHttpParams(
						{
							active: true,
							deleted: false
						});

				expect(result.get("active"))
				.toBe("true");
				expect(result.get("deleted"))
				.toBe("false");
			});

		it("should handle Date values as ISO strings",
			() =>
			{
				const date: Date =
					new Date("2024-01-15T10:30:00.000Z");
				const result: HttpParams =
					buildHttpParams(
						{ createdAt: date });

				expect(result.get("createdAt"))
				.toBe("2024-01-15T10:30:00.000Z");
			});

		it("should skip null values",
			() =>
			{
				const result: HttpParams =
					buildHttpParams(
						{
							name: "test",
							nullValue: null
						});

				expect(result.has("name"))
				.toBe(true);
				expect(result.has("nullValue"))
				.toBe(false);
			});

		it("should skip undefined values",
			() =>
			{
				const result: HttpParams =
					buildHttpParams(
						{
							name: "test",
							undefinedValue: undefined
						});

				expect(result.has("name"))
				.toBe(true);
				expect(result.has("undefinedValue"))
				.toBe(false);
			});

		it("should handle mixed types",
			() =>
			{
				const date: Date =
					new Date("2024-06-01T00:00:00.000Z");
				const result: HttpParams =
					buildHttpParams(
						{
							page: 1,
							search: "test",
							active: true,
							startDate: date,
							nullValue: null,
							undefinedValue: undefined
						});

				expect(result.get("page"))
				.toBe("1");
				expect(result.get("search"))
				.toBe("test");
				expect(result.get("active"))
				.toBe("true");
				expect(result.get("startDate"))
				.toBe("2024-06-01T00:00:00.000Z");
				expect(result.has("nullValue"))
				.toBe(false);
				expect(result.has("undefinedValue"))
				.toBe(false);
			});
	});
