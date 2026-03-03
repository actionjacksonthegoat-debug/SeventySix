import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { DomSanitizer, SafeHtml } from "@angular/platform-browser";
import DOMPurify from "dompurify";
import { catchError, map, Observable, of, shareReplay } from "rxjs";

/** Icon source configuration */
interface IconSource
{
	readonly baseUrl: string;
	readonly pathTemplate: string;
}

const ICON_SOURCES: Record<string, IconSource> =
	{
		simpleIcons: {
			baseUrl: "/icons/simple-icons",
			pathTemplate: "/{slug}.svg"
		}
	};

/**
 * Service for loading library/brand SVG icons from local assets.
 * Icons are self-hosted in `public/icons/` and cached at the Cloudflare edge.
 * In-memory `shareReplay` prevents duplicate requests within a session.
 */
@Injectable(
	{
		providedIn: "root"
	})
export class CdnIconService
{
	private readonly httpClient: HttpClient =
		inject(HttpClient);

	private readonly sanitizer: DomSanitizer =
		inject(DomSanitizer);

	private readonly cache: Map<string, Observable<SafeHtml>> =
		new Map();

	/**
	 * Load an SVG icon from local assets by slug.
	 *
	 * @param {string} slug
	 * Icon slug (e.g., "angular", "dotnet", "postgresql")
	 *
	 * @param {string} source
	 * Icon source key (default: "simpleIcons")
	 *
	 * @returns {Observable<SafeHtml>}
	 * Sanitized SVG markup
	 */
	loadIcon(
		slug: string,
		source: string = "simpleIcons"): Observable<SafeHtml>
	{
		const cacheKey: string =
			`${source}:${slug}`;

		if (this.cache.has(cacheKey))
		{
			return this.cache.get(cacheKey)!;
		}

		const iconSource: IconSource =
			ICON_SOURCES[source] ?? ICON_SOURCES["simpleIcons"];
		const iconUrl: string =
			iconSource.baseUrl + iconSource.pathTemplate.replace(/\{slug\}/g, slug);

		const icon$: Observable<SafeHtml> =
			this
				.httpClient
				.get(
					iconUrl,
					{ responseType: "text" })
				.pipe(
					map(
						(svg: string) =>
						{
							const sanitizedSvg: string =
								DOMPurify.sanitize(
									svg,
									{
										USE_PROFILES: { svg: true },
										FORBID_TAGS: ["script", "style", "use"],
										FORBID_ATTR: ["onload", "onerror", "onclick", "onmouseover"]
									});
							return this.sanitizer.bypassSecurityTrustHtml(sanitizedSvg);
						}),
					catchError(
						() =>
							of(this.sanitizer.bypassSecurityTrustHtml(""))),
					shareReplay(
						{
							bufferSize: 1,
							refCount: false
						}));

		this.cache.set(cacheKey, icon$);
		return icon$;
	}
}