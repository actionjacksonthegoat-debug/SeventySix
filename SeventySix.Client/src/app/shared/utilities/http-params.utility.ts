import { HttpParams } from "@angular/common/http";

/**
 * Builds HttpParams from an object.
 * Filters out undefined/null values and converts Date objects to ISO strings.
 * @param {Record<string, unknown> | object} params
 * The parameters to convert into HttpParams.
 * @returns {HttpParams}
 * An HttpParams instance representing the provided parameters.
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
