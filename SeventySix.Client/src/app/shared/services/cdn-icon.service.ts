import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { DomSanitizer, SafeHtml } from "@angular/platform-browser";
import DOMPurify from "dompurify";
import { catchError, map, Observable, of, shareReplay } from "rxjs";

/** CDN icon source configuration */
interface CdnIconSource
{
	readonly baseUrl: string;
	readonly pathTemplate: string;
}

const CDN_SOURCES: Record<string, CdnIconSource> =
	{
		simpleIcons: {
			baseUrl: "https://cdn.jsdelivr.net/npm/simple-icons@latest",
			pathTemplate: "/icons/{slug}.svg"
		},
		devicon: {
			baseUrl: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons",
			pathTemplate: "/{slug}/{slug}-original.svg"
		}
	};

/**
 * Service for loading library/brand icons from CDN.
 * Caches loaded SVGs in memory to avoid duplicate requests.
 * Uses Simple Icons (jsdelivr) as primary source.
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
	 * Load an SVG icon from CDN by slug.
	 *
	 * @param {string} slug
	 * Icon slug (e.g., "angular", "dotnet", "postgresql")
	 *
	 * @param {string} source
	 * CDN source key (default: "simpleIcons")
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

		const cdnSource: CdnIconSource =
			CDN_SOURCES[source] ?? CDN_SOURCES["simpleIcons"];
		const iconUrl: string =
			cdnSource.baseUrl + cdnSource.pathTemplate.replace(/\{slug\}/g, slug);

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