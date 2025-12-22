import { TestBed } from "@angular/core/testing";
import { DomSanitizer, SafeHtml, SafeUrl } from "@angular/platform-browser";
import { setupSimpleServiceTest } from "@shared/testing";
import { Mock, vi } from "vitest";
import { SanitizationService } from "./sanitization.service";

interface MockDomSanitizer
{
	sanitize: Mock;
	bypassSecurityTrustHtml: Mock;
	bypassSecurityTrustUrl: Mock;
}

describe("SanitizationService",
	() =>
	{
		let service: SanitizationService;
		let sanitizer: MockDomSanitizer;

		beforeEach(
			() =>
			{
				const sanitizerSpy: MockDomSanitizer =
					{
						sanitize: vi.fn(),
						bypassSecurityTrustHtml: vi.fn(),
						bypassSecurityTrustUrl: vi.fn()
					};

				service =
					setupSimpleServiceTest(SanitizationService,
						[
							{ provide: DomSanitizer, useValue: sanitizerSpy }
						]);

				sanitizer =
					TestBed.inject(
						DomSanitizer) as unknown as MockDomSanitizer;
			});

		describe("sanitizeHtml",
			() =>
			{
				it("should sanitize HTML content",
					() =>
					{
						const html: string = "<script>alert(\"xss\")</script><p>Safe content</p>";
						sanitizer.sanitize.mockReturnValue("Safe content");

						const result: SafeHtml =
							service.sanitizeHtml(html);

						expect(sanitizer.sanitize)
							.toHaveBeenCalledWith(1, html);
						expect(result)
							.toBe("Safe content");
					});

				it("should return empty string if sanitization returns null",
					() =>
					{
						sanitizer.sanitize.mockReturnValue(null);

						const result: SafeHtml =
							service.sanitizeHtml(
								"<script>alert(\"xss\")</script>");

						expect(result)
							.toBe("");
					});
			});

		describe("sanitizeUrl",
			() =>
			{
				it("should sanitize URL",
					() =>
					{
						const url: string = "javascript:alert(\"xss\")";
						sanitizer.sanitize.mockReturnValue("");

						const result: SafeUrl =
							service.sanitizeUrl(url);

						expect(sanitizer.sanitize)
							.toHaveBeenCalledWith(4, url);
						expect(result)
							.toBe("");
					});

				it("should allow safe URLs",
					() =>
					{
						const url: string = "https://example.com";
						sanitizer.sanitize.mockReturnValue(url);

						const result: SafeUrl =
							service.sanitizeUrl(url);

						expect(result)
							.toBe(url);
					});
			});

		describe("sanitizeResourceUrl",
			() =>
			{
				it("should sanitize resource URL",
					() =>
					{
						const url: string = "https://example.com/iframe";
						sanitizer.sanitize.mockReturnValue(url);

						service.sanitizeResourceUrl(url);

						expect(sanitizer.sanitize)
							.toHaveBeenCalledWith(5, url);
					});
			});

		describe("trustHtml",
			() =>
			{
				it("should bypass security for trusted HTML",
					() =>
					{
						const html: string = "<p>Trusted content</p>";
						const trustedHtml: SafeHtml =
							{} as SafeHtml;
						sanitizer.bypassSecurityTrustHtml.mockReturnValue(trustedHtml);

						const result: SafeHtml =
							service.trustHtml(html);

						expect(sanitizer.bypassSecurityTrustHtml)
							.toHaveBeenCalledWith(
								html);
						expect(result)
							.toBe(trustedHtml);
					});
			});

		describe("trustUrl",
			() =>
			{
				it("should bypass security for trusted URL",
					() =>
					{
						const url: string = "https://trusted.com";
						const trustedUrl: SafeUrl =
							{} as SafeUrl;
						sanitizer.bypassSecurityTrustUrl.mockReturnValue(trustedUrl);

						const result: SafeUrl =
							service.trustUrl(url);

						expect(sanitizer.bypassSecurityTrustUrl)
							.toHaveBeenCalledWith(url);
						expect(result)
							.toBe(trustedUrl);
					});
			});

		describe("stripHtml",
			() =>
			{
				it("should remove all HTML tags",
					() =>
					{
						const html: string = "<p>Hello <strong>World</strong></p>";

						const result: string =
							service.stripHtml(html);

						expect(result)
							.toBe("Hello World");
					});

				it("should handle script tags",
					() =>
					{
						const html: string = "<script>alert(\"xss\")</script>Text";

						const result: string =
							service.stripHtml(html);

						// Note: Script tags may or may not execute during parsing
						// We just verify that tags are removed, content may vary
						expect(result)
							.toContain("Text");
						expect(result).not.toContain("<script>");
						expect(result).not.toContain("</script>");
					});

				it("should return empty string for empty input",
					() =>
					{
						const result: string =
							service.stripHtml("");

						expect(result)
							.toBe("");
					});
			});

		describe("escapeHtml",
			() =>
			{
				it("should escape HTML special characters",
					() =>
					{
						const text: string = "<script>alert(\"xss\")</script>";

						const result: string =
							service.escapeHtml(text);

						expect(result)
							.toBe(
								"&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;");
					});

				it("should escape ampersands",
					() =>
					{
						const text: string = "Rock & Roll";

						const result: string =
							service.escapeHtml(text);

						expect(result)
							.toBe("Rock &amp; Roll");
					});

				it("should escape single quotes",
					() =>
					{
						const text: string = "It's working";

						const result: string =
							service.escapeHtml(text);

						expect(result)
							.toBe("It&#039;s working");
					});

				it("should return original text if no special characters",
					() =>
					{
						const text: string = "Hello World";

						const result: string =
							service.escapeHtml(text);

						expect(result)
							.toBe("Hello World");
					});
			});

		describe("validateUrl",
			() =>
			{
				it("should validate and return valid HTTP URL",
					() =>
					{
						const url: string = "http://example.com";

						const result: string | null =
							service.validateUrl(url);

						expect(result)
							.toBe("http://example.com/");
					});

				it("should validate and return valid HTTPS URL",
					() =>
					{
						const url: string = "https://example.com/path?query=value";

						const result: string | null =
							service.validateUrl(url);

						expect(result)
							.toBe(url);
					});

				it("should reject javascript: protocol",
					() =>
					{
						const url: string = "javascript:alert(\"xss\")";

						const result: string | null =
							service.validateUrl(url);

						expect(result)
							.toBeNull();
					});

				it("should reject data: protocol",
					() =>
					{
						const url: string = "data:text/html,<script>alert(\"xss\")</script>";

						const result: string | null =
							service.validateUrl(url);

						expect(result)
							.toBeNull();
					});

				it("should reject file: protocol",
					() =>
					{
						const url: string = "file:///etc/passwd";

						const result: string | null =
							service.validateUrl(url);

						expect(result)
							.toBeNull();
					});

				it("should return null for invalid URLs",
					() =>
					{
						const url: string = "not-a-valid-url";

						const result: string | null =
							service.validateUrl(url);

						expect(result)
							.toBeNull();
					});

				it("should return null for empty string",
					() =>
					{
						const result: string | null =
							service.validateUrl("");

						expect(result)
							.toBeNull();
					});
			});
	});
