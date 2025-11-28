import { HttpParams } from "@angular/common/http";

export function buildHttpParams(params: Record<string, unknown>): HttpParams
{
	let httpParams: HttpParams = new HttpParams();

	for (const [key, value] of Object.entries(params))
	{
		if (value !== undefined && value !== null)
		{
			if (value instanceof Date)
			{
				httpParams = httpParams.set(key, value.toISOString());
			}
			else
			{
				httpParams = httpParams.set(key, String(value));
			}
		}
	}

	return httpParams;
}
