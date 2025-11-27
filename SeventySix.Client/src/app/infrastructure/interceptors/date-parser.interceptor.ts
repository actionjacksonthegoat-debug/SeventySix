import { HttpInterceptorFn, HttpResponse } from "@angular/common/http";
import { map } from "rxjs/operators";

/**
 * ISO 8601 date regex (matches API date format)
 */
const ISO_DATE_REGEX: RegExp =
	/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;

/**
 * Recursively parse ISO date strings in response to Date objects.
 */
function parseDates(body: unknown): unknown
{
	if (body === null || body === undefined)
	{
		return body;
	}

	if (typeof body === "string" && ISO_DATE_REGEX.test(body))
	{
		return new Date(body);
	}

	if (Array.isArray(body))
	{
		return body.map(parseDates);
	}

	if (typeof body === "object")
	{
		const parsed: Record<string, unknown> = {};
		for (const [key, value] of Object.entries(body))
		{
			parsed[key] = parseDates(value);
		}
		return parsed;
	}

	return body;
}

/**
 * HTTP Interceptor to automatically parse ISO date strings to Date objects.
 *
 * Converts all ISO 8601 strings in API responses to JavaScript Date objects.
 * This eliminates the need for manual date parsing throughout the application.
 *
 * @example
 * // Before: { timestamp: "2024-04-29T15:45:12.123Z" }
 * // After:  { timestamp: Date(2024-04-29T15:45:12.123Z) }
 */
export const dateParserInterceptor: HttpInterceptorFn = (req, next) =>
{
	return next(req).pipe(
		map((event) =>
		{
			if (event instanceof HttpResponse && event.body)
			{
				return event.clone({ body: parseDates(event.body) });
			}
			return event;
		})
	);
};
