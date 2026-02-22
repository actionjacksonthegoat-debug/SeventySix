import { HttpTestingController } from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { SafeHtml } from "@angular/platform-browser";
import { withHttpTesting } from "@testing/provider-helpers";
import { setupSimpleServiceTest } from "@testing/test-bed-builders";
import { firstValueFrom } from "rxjs";
import { CdnIconService } from "./cdn-icon.service";

describe("CdnIconService",
	() =>
	{
		let service: CdnIconService;
		let httpController: HttpTestingController;

		beforeEach(
			() =>
			{
				service =
					setupSimpleServiceTest(
						CdnIconService,
						[...withHttpTesting()]);
				httpController =
					TestBed.inject(HttpTestingController);
			});

		afterEach(
			() =>
			{
				httpController.verify();
			});

		it("should be created",
			() =>
			{
				expect(service)
					.toBeTruthy();
			});

		it("should construct correct URL for simpleIcons source",
			() =>
			{
				service
					.loadIcon("angular", "simpleIcons")
					.subscribe();

				const request: ReturnType<typeof httpController.expectOne> =
					httpController.expectOne(
						"https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/angular.svg");
				request.flush("<svg></svg>");
			});

		it("should construct correct URL for devicon source",
			() =>
			{
				service
					.loadIcon("angular", "devicon")
					.subscribe();

				const request: ReturnType<typeof httpController.expectOne> =
					httpController.expectOne(
						"https://cdn.jsdelivr.net/gh/devicons/devicon/icons/angular/angular-original.svg");
				request.flush("<svg></svg>");
			});

		it("should cache duplicate requests",
			() =>
			{
				service
					.loadIcon("angular")
					.subscribe();
				service
					.loadIcon("angular")
					.subscribe();

				httpController
					.expectOne(
						"https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/angular.svg")
					.flush("<svg></svg>");

				// Only one request should have been made
				httpController.verify();
			});

		it("should return SafeHtml on success",
			async () =>
			{
				const result$: Promise<SafeHtml> =
					firstValueFrom(service.loadIcon("angular"));

				httpController
					.expectOne(
						"https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/angular.svg")
					.flush("<svg><path d='M0 0'/></svg>");

				const result: SafeHtml =
					await result$;
				expect(result)
					.toBeTruthy();
			});

		it("should return empty SafeHtml on HTTP error",
			async () =>
			{
				const result$: Promise<SafeHtml> =
					firstValueFrom(service.loadIcon("nonexistent"));

				httpController
					.expectOne(
						"https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/nonexistent.svg")
					.flush(
						"",
						{ status: 404, statusText: "Not Found" });

				const result: SafeHtml =
					await result$;
				expect(result)
					.toBeTruthy();
			});

		it("should strip malicious script tags from SVG content",
			async () =>
			{
				const maliciousSvg: string = "<svg><script>alert(\"xss\")</script><path d=\"M0 0\"/></svg>";

				const result$: Promise<SafeHtml> =
					firstValueFrom(service.loadIcon("evil"));

				httpController
					.expectOne(
						"https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/evil.svg")
					.flush(maliciousSvg);

				const result: SafeHtml =
					await result$;
				// DOMPurify should strip the script tag
				const htmlString: string =
					(result as { changingThisBreaksApplicationSecurity: string; })
						.changingThisBreaksApplicationSecurity ?? "";
				expect(htmlString)
					.not
					.toContain("<script>");
			});
	});