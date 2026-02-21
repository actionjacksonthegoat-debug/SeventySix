// <copyright file="window.service.spec.ts" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

import { provideZonelessChangeDetection } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { WindowService } from "./window.service";

describe("WindowService",
	() =>
	{
		let service: WindowService;

		beforeEach(
			() =>
			{
				TestBed.configureTestingModule(
					{
						providers: [
							provideZonelessChangeDetection(),
							WindowService
						]
					});
				service =
					TestBed.inject(WindowService);
			});

		it("should be created",
			() =>
			{
				expect(service)
					.toBeTruthy();
			});

		describe("reload",
			() =>
			{
				it("should call window.location.reload",
					() =>
					{
						const reloadSpy: ReturnType<typeof vi.fn> =
							vi.fn();
						Object.defineProperty(
							window,
							"location",
							{
								value: { reload: reloadSpy },
								writable: true
							});

						service.reload();

						expect(reloadSpy)
							.toHaveBeenCalled();
					});
			});

		describe("navigateTo",
			() =>
			{
				it("should set window.location.href to the provided URL",
					() =>
					{
						const testUrl: string = "https://example.com";
						Object.defineProperty(
							window,
							"location",
							{
								value: { href: "" },
								writable: true
							});

						service.navigateTo(testUrl);

						expect(window.location.href)
							.toBe(testUrl);
					});
			});

		describe("getCurrentUrl",
			() =>
			{
				it("should return window.location.href",
					() =>
					{
						const testUrl: string = "https://test.example.com/path";
						Object.defineProperty(
							window,
							"location",
							{
								value: { href: testUrl },
								writable: true
							});

						const result: string =
							service.getCurrentUrl();

						expect(result)
							.toBe(testUrl);
					});
			});

		describe("getPathname",
			() =>
			{
				it("should return window.location.pathname",
					() =>
					{
						const testPath: string = "/test/path";
						Object.defineProperty(
							window,
							"location",
							{
								value: { pathname: testPath },
								writable: true
							});

						const result: string =
							service.getPathname();

						expect(result)
							.toBe(testPath);
					});
			});

		describe("getViewportHeight",
			() =>
			{
				it("should return window.innerHeight",
					() =>
					{
						const testHeight: number = 768;
						Object.defineProperty(
							window,
							"innerHeight",
							{
								value: testHeight,
								writable: true
							});

						const result: number =
							service.getViewportHeight();

						expect(result)
							.toBe(testHeight);
					});
			});

		describe("getViewportWidth",
			() =>
			{
				it("should return window.innerWidth",
					() =>
					{
						const testWidth: number = 1024;
						Object.defineProperty(
							window,
							"innerWidth",
							{
								value: testWidth,
								writable: true
							});

						const result: number =
							service.getViewportWidth();

						expect(result)
							.toBe(testWidth);
					});
			});

		describe("scrollToTop",
			() =>
			{
				it("should call window.scrollTo with 0, 0",
					() =>
					{
						const scrollToSpy: ReturnType<typeof vi.fn> =
							vi.fn();
						Object.defineProperty(
							window,
							"scrollTo",
							{
								value: scrollToSpy,
								writable: true
							});

						service.scrollToTop();

						expect(scrollToSpy)
							.toHaveBeenCalledWith(0, 0);
					});
			});

		describe("getHash",
			() =>
			{
				it("should return window.location.hash",
					() =>
					{
						const testHash: string = "#access_token=abc123";
						Object.defineProperty(
							window,
							"location",
							{
								value: { hash: testHash },
								writable: true
							});

						const result: string =
							service.getHash();

						expect(result)
							.toBe(testHash);
					});
			});

		describe("getSearch",
			() =>
			{
				it("should return window.location.search",
					() =>
					{
						const testSearch: string = "?param=value&other=123";
						Object.defineProperty(
							window,
							"location",
							{
								value: { search: testSearch },
								writable: true
							});

						const result: string =
							service.getSearch();

						expect(result)
							.toBe(testSearch);
					});
			});

		describe("replaceState",
			() =>
			{
				it("should call window.history.replaceState with provided arguments",
					() =>
					{
						const replaceStateSpy: ReturnType<typeof vi.fn> =
							vi.fn();
						Object.defineProperty(
							window,
							"history",
							{
								value: { replaceState: replaceStateSpy },
								writable: true
							});

						const testData: { key: string; } =
							{ key: "value" };
						const testUrl: string = "/new/path";

						service.replaceState(
							testData,
							"",
							testUrl);

						expect(replaceStateSpy)
							.toHaveBeenCalledWith(
								testData,
								"",
								testUrl);
					});
			});
	});