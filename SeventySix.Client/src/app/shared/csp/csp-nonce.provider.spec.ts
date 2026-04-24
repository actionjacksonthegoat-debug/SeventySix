import { Component, CSP_NONCE, provideZonelessChangeDetection } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { readNonceFromRoot } from "./csp-nonce.provider";

describe("readNonceFromRoot",
	() =>
	{
		it("returns the ngCspNonce attribute value when it is set",
			() =>
			{
				const root: HTMLElement =
					document.createElement("app-root");
				root.setAttribute("ngcspnonce", "abc123");
				expect(readNonceFromRoot(root))
					.toBe("abc123");
			});

		it("returns an empty string when the ngCspNonce attribute is absent",
			() =>
			{
				const root: HTMLElement =
					document.createElement("app-root");
				expect(readNonceFromRoot(root))
					.toBe("");
			});

		it("returns an empty string when the element is null",
			() =>
			{
				expect(readNonceFromRoot(null))
					.toBe("");
			});
	});

describe("CSP nonce applied to Angular-injected styles",
	() =>
	{
		it("style elements injected by Angular carry the nonce when ngCspNonce is set",
			async () =>
			{
				@Component(
					{
						selector: "app-nonce-test",
						template: "<p>nonce test</p>",
						styles: ["p { color: red; }"]
					})
				class TestNonceComponent
				{}

				await TestBed
					.configureTestingModule(
						{
							imports: [TestNonceComponent],
							providers: [
								provideZonelessChangeDetection(),
								{ provide: CSP_NONCE, useValue: "testnonce42" }
							]
						})
					.compileComponents();

				TestBed.createComponent(TestNonceComponent);
				TestBed.flushEffects();

				const noncedStyles: NodeListOf<HTMLStyleElement> =
					document.querySelectorAll<HTMLStyleElement>("style[nonce]");
				const hasNonce: boolean =
					Array
						.from(noncedStyles)
						.some(
							(style) =>
								style.getAttribute("nonce") === "testnonce42");

				expect(hasNonce)
					.toBe(true);
			});
	});