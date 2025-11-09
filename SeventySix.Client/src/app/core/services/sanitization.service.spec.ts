import { TestBed } from "@angular/core/testing";
import { provideZonelessChangeDetection } from "@angular/core";
import { DomSanitizer } from "@angular/platform-browser";
import { SanitizationService } from "./sanitization.service";

describe("SanitizationService", () =>
{
	let service: SanitizationService;
	let sanitizer: jasmine.SpyObj<DomSanitizer>;

	beforeEach(() =>
	{
		const sanitizerSpy = jasmine.createSpyObj("DomSanitizer", [
			"sanitize",
			"bypassSecurityTrustHtml",
			"bypassSecurityTrustUrl"
		]);

		TestBed.configureTestingModule({
			providers: [
				{ provide: DomSanitizer, useValue: sanitizerSpy },
				provideZonelessChangeDetection()
			]
		});

		service = TestBed.inject(SanitizationService);
		sanitizer = TestBed.inject(
			DomSanitizer
		) as jasmine.SpyObj<DomSanitizer>;
	});

	describe("sanitizeHtml", () =>
	{
		it("should sanitize HTML content", () =>
		{
			const html = '<script>alert("xss")</script><p>Safe content</p>';
			sanitizer.sanitize.and.returnValue("Safe content");

			const result = service.sanitizeHtml(html);

			expect(sanitizer.sanitize).toHaveBeenCalledWith(1, html);
			expect(result).toBe("Safe content");
		});

		it("should return empty string if sanitization returns null", () =>
		{
			sanitizer.sanitize.and.returnValue(null);

			const result = service.sanitizeHtml(
				'<script>alert("xss")</script>'
			);

			expect(result).toBe("");
		});
	});

	describe("sanitizeUrl", () =>
	{
		it("should sanitize URL", () =>
		{
			const url = 'javascript:alert("xss")';
			sanitizer.sanitize.and.returnValue("");

			const result = service.sanitizeUrl(url);

			expect(sanitizer.sanitize).toHaveBeenCalledWith(4, url);
			expect(result).toBe("");
		});

		it("should allow safe URLs", () =>
		{
			const url = "https://example.com";
			sanitizer.sanitize.and.returnValue(url);

			const result = service.sanitizeUrl(url);

			expect(result).toBe(url);
		});
	});

	describe("sanitizeResourceUrl", () =>
	{
		it("should sanitize resource URL", () =>
		{
			const url = "https://example.com/iframe";
			sanitizer.sanitize.and.returnValue(url);

			const result = service.sanitizeResourceUrl(url);

			expect(sanitizer.sanitize).toHaveBeenCalledWith(5, url);
		});
	});

	describe("trustHtml", () =>
	{
		it("should bypass security for trusted HTML", () =>
		{
			const html = "<p>Trusted content</p>";
			const trustedHtml = {} as any;
			sanitizer.bypassSecurityTrustHtml.and.returnValue(trustedHtml);

			const result = service.trustHtml(html);

			expect(sanitizer.bypassSecurityTrustHtml).toHaveBeenCalledWith(
				html
			);
			expect(result).toBe(trustedHtml);
		});
	});

	describe("trustUrl", () =>
	{
		it("should bypass security for trusted URL", () =>
		{
			const url = "https://trusted.com";
			const trustedUrl = {} as any;
			sanitizer.bypassSecurityTrustUrl.and.returnValue(trustedUrl);

			const result = service.trustUrl(url);

			expect(sanitizer.bypassSecurityTrustUrl).toHaveBeenCalledWith(url);
			expect(result).toBe(trustedUrl);
		});
	});

	describe("stripHtml", () =>
	{
		it("should remove all HTML tags", () =>
		{
			const html = "<p>Hello <strong>World</strong></p>";

			const result = service.stripHtml(html);

			expect(result).toBe("Hello World");
		});

		it("should handle script tags", () =>
		{
			const html = '<script>alert("xss")</script>Text';

			const result = service.stripHtml(html);

			// Note: Script tags may or may not execute during parsing
			// We just verify that tags are removed, content may vary
			expect(result).toContain("Text");
			expect(result).not.toContain("<script>");
			expect(result).not.toContain("</script>");
		});

		it("should return empty string for empty input", () =>
		{
			const result = service.stripHtml("");

			expect(result).toBe("");
		});
	});

	describe("escapeHtml", () =>
	{
		it("should escape HTML special characters", () =>
		{
			const text = '<script>alert("xss")</script>';

			const result = service.escapeHtml(text);

			expect(result).toBe(
				"&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;"
			);
		});

		it("should escape ampersands", () =>
		{
			const text = "Rock & Roll";

			const result = service.escapeHtml(text);

			expect(result).toBe("Rock &amp; Roll");
		});

		it("should escape single quotes", () =>
		{
			const text = "It's working";

			const result = service.escapeHtml(text);

			expect(result).toBe("It&#039;s working");
		});

		it("should return original text if no special characters", () =>
		{
			const text = "Hello World";

			const result = service.escapeHtml(text);

			expect(result).toBe("Hello World");
		});
	});

	describe("validateUrl", () =>
	{
		it("should validate and return valid HTTP URL", () =>
		{
			const url = "http://example.com";

			const result = service.validateUrl(url);

			expect(result).toBe("http://example.com/");
		});

		it("should validate and return valid HTTPS URL", () =>
		{
			const url = "https://example.com/path?query=value";

			const result = service.validateUrl(url);

			expect(result).toBe(url);
		});

		it("should reject javascript: protocol", () =>
		{
			const url = 'javascript:alert("xss")';

			const result = service.validateUrl(url);

			expect(result).toBeNull();
		});

		it("should reject data: protocol", () =>
		{
			const url = 'data:text/html,<script>alert("xss")</script>';

			const result = service.validateUrl(url);

			expect(result).toBeNull();
		});

		it("should reject file: protocol", () =>
		{
			const url = "file:///etc/passwd";

			const result = service.validateUrl(url);

			expect(result).toBeNull();
		});

		it("should return null for invalid URLs", () =>
		{
			const url = "not-a-valid-url";

			const result = service.validateUrl(url);

			expect(result).toBeNull();
		});

		it("should return null for empty string", () =>
		{
			const result = service.validateUrl("");

			expect(result).toBeNull();
		});
	});
});
