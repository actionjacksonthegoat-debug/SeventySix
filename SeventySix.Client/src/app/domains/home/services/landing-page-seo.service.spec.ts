/**
 * Unit tests for LandingPageSeoService.
 */

import { DOCUMENT } from "@angular/common";
import { provideZonelessChangeDetection } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { Meta } from "@angular/platform-browser";
import { GITHUB_REPO_URL } from "@home/constants/landing-page.constants";
import { SITE_CONSTANTS } from "@shared/constants/site.constants";
import { vi } from "vitest";
import { LandingPageSeoService } from "./landing-page-seo.service";

describe("LandingPageSeoService",
	() =>
	{
		let service: LandingPageSeoService;
		let metaUpdateTagSpy: ReturnType<typeof vi.fn>;
		let appendChildSpy: ReturnType<typeof vi.fn>;
		let querySelectorSpy: ReturnType<typeof vi.fn>;

		beforeEach(
			() =>
			{
				metaUpdateTagSpy =
					vi.fn();
				appendChildSpy =
					vi.fn();
				querySelectorSpy =
					vi
						.fn()
						.mockReturnValue(null);

				const mockScript: Partial<HTMLScriptElement> =
					{ type: "", textContent: "" };
				const mockLink: Partial<HTMLLinkElement> =
					{ rel: "", href: "" };

				const mockDocument: Partial<Document> =
					{
						head: {
							appendChild: appendChildSpy
						} as unknown as HTMLHeadElement,
						createElement: vi.fn(
							(tag: string) =>
								tag === "script" ? mockScript : mockLink) as unknown as typeof document.createElement,
						querySelector: querySelectorSpy
					};

				TestBed.configureTestingModule(
					{
						providers: [
							provideZonelessChangeDetection(),
							LandingPageSeoService,
							{ provide: DOCUMENT, useValue: mockDocument },
							{
								provide: Meta,
								useValue: { updateTag: metaUpdateTagSpy }
							}
						]
					});

				service =
					TestBed.inject(LandingPageSeoService);
			});

		afterEach(
			() =>
			{
				vi.restoreAllMocks();
			});

		it("should create",
			() =>
			{
				expect(service)
					.toBeTruthy();
			});

		it("should append 4 JSON-LD script tags to the head when setup() is called",
			() =>
			{
				service.setup();

				expect(appendChildSpy)
					.toHaveBeenCalledTimes(5);
			});

		it("should call meta.updateTag for primary, OG, Twitter, AI crawler, and canonical meta tags",
			() =>
			{
				service.setup();

				expect(metaUpdateTagSpy.mock.calls.length)
					.toBeGreaterThanOrEqual(15);
			});

		it("should include the GitHub repo URL in the structured data script",
			() =>
			{
				let capturedContent: string = "";
				appendChildSpy.mockImplementation(
					(el: HTMLScriptElement) =>
					{
						if (el.textContent)
						{
							capturedContent += el.textContent;
						}
					});

				service.setup();

				expect(capturedContent)
					.toContain(GITHUB_REPO_URL);
			});

		it("should include the site URL in the canonical link",
			() =>
			{
				service.setup();

				const canonicalCallArgs: unknown[] =
					appendChildSpy.mock.calls.map(
						(call: unknown[]) => call[0]);

				const hasCanonical: boolean =
					canonicalCallArgs.some(
						(el: unknown) =>
						{
							const link: Partial<HTMLLinkElement> =
								el as Partial<HTMLLinkElement>;
							return link.rel === "canonical" && link.href === `${SITE_CONSTANTS.url}/`;
						});

				expect(hasCanonical)
					.toBe(true);
			});

		it("should update existing canonical link element if one already exists",
			() =>
			{
				const existingCanonical: Partial<HTMLLinkElement> =
					{ rel: "canonical", href: "https://old-url.com" };
				querySelectorSpy.mockReturnValue(existingCanonical);

				service.setup();

				expect(existingCanonical.href)
					.toBe(`${SITE_CONSTANTS.url}/`);
				expect(appendChildSpy)
					.toHaveBeenCalledTimes(4);
			});
	});