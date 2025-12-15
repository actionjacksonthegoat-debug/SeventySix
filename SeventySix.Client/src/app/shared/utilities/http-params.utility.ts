import { HttpParams } from "@angular/common/http";

/**
 * Builds HttpParams from an object
 * Filters out undefined and null values
 * Converts Date objects to ISO strings
 *
 * @param params - Object with parameters to convert
 * @returns HttpParams instance
 */
export function buildHttpParams(params: Record<string, unknown> | object): HttpParams
{
	let httpParams: HttpParams =
		new HttpParams();

	for (const [key, value] of Object.entries(params))
	{
		if (value !== undefined && value !== null)
		{
			if (value instanceof Date)
			{
				httpParams =
					httpParams.set(key, value.toISOString());
			}
			else
			{
				httpParams =
					httpParams.set(key, String(value));
			}
		}
	}

	return httpParams;
}
