import { provideZonelessChangeDetection } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideAnimations } from "@angular/platform-browser/animations";
import { ArchitectureCard } from "@home/models";
import { vi } from "vitest";
import { ArchitectureSectionComponent } from "./architecture-section";

const TEST_CARDS: readonly ArchitectureCard[] =
	[
		{
			title: "Clean Architecture",
			icon: "layers",
			shortDescription: "Separation of concerns",
			details: ["Detail A", "Detail B"],
			keywords: ["DDD", "Hexagonal"]
		},
		{
			title: "CQRS Pattern",
			icon: "sync_alt",
			shortDescription: "Command Query Responsibility Segregation",
			details: ["Detail C"],
			keywords: ["Wolverine"]
		}
	];

let mockObserve: ReturnType<typeof vi.fn>;
let mockDisconnect: ReturnType<typeof vi.fn>;

function setupMockIntersectionObserver(): void
{
	mockObserve =
		vi.fn();
	mockDisconnect =
		vi.fn();

	vi.stubGlobal(
		"IntersectionObserver",
		class MockIntersectionObserver
		{
			observe: ReturnType<typeof vi.fn> = mockObserve;
			unobserve: ReturnType<typeof vi.fn> =
				vi.fn();
			disconnect: ReturnType<typeof vi.fn> = mockDisconnect;
		});

	vi.stubGlobal(
		"matchMedia",
		vi.fn(
			() => ({ matches: true })));
}

describe("ArchitectureSectionComponent",
	() =>
	{
		let fixture: ComponentFixture<ArchitectureSectionComponent>;
		let nativeElement: HTMLElement;

		beforeEach(
			async () =>
			{
				setupMockIntersectionObserver();

				await TestBed
					.configureTestingModule(
						{
							imports: [ArchitectureSectionComponent],
							providers: [
								provideZonelessChangeDetection(),
								provideAnimations()
							]
						})
					.compileComponents();

				fixture =
					TestBed.createComponent(ArchitectureSectionComponent);
				fixture.componentRef.setInput("cards", TEST_CARDS);
				fixture.detectChanges();
				nativeElement =
					fixture.nativeElement;
			});

		afterEach(
			() =>
			{
				vi.restoreAllMocks();
			});

		it("should create",
			() =>
			{
				expect(fixture.componentInstance)
					.toBeTruthy();
			});

		it("should render all cards",
			() =>
			{
				const cards: NodeListOf<Element> =
					nativeElement.querySelectorAll(".arch-card");
				expect(cards.length)
					.toBe(2);
			});

		it("should display card titles",
			() =>
			{
				const titles: NodeListOf<Element> =
					nativeElement.querySelectorAll(".arch-card-title");
				expect(titles[0]?.textContent?.trim())
					.toBe("Clean Architecture");
				expect(titles[1]?.textContent?.trim())
					.toBe("CQRS Pattern");
			});

		it("should expand card on click",
			() =>
			{
				const firstHeader: HTMLElement | null =
					nativeElement.querySelector(".arch-card-header");
				firstHeader?.click();
				fixture.detectChanges();

				const expandedContent: Element | null =
					nativeElement.querySelector(".arch-card-content");
				expect(expandedContent)
					.toBeTruthy();
			});

		it("should collapse previous card when new card clicked",
			() =>
			{
				const headers: NodeListOf<HTMLElement> =
					nativeElement.querySelectorAll(".arch-card-header");

				// Expand first card
				headers[0]?.click();
				fixture.detectChanges();

				// Expand second card
				headers[1]?.click();
				fixture.detectChanges();

				const expandedContents: NodeListOf<Element> =
					nativeElement.querySelectorAll(".arch-card-content");
				expect(expandedContents.length)
					.toBe(1);
			});

		it("should toggle same card closed on second click",
			() =>
			{
				const firstHeader: HTMLElement | null =
					nativeElement.querySelector(".arch-card-header");

				firstHeader?.click();
				fixture.detectChanges();
				firstHeader?.click();
				fixture.detectChanges();

				const expandedContent: Element | null =
					nativeElement.querySelector(".arch-card-content");
				expect(expandedContent)
					.toBeNull();
			});

		it("should set aria-expanded attribute",
			() =>
			{
				const firstHeader: HTMLElement | null =
					nativeElement.querySelector(".arch-card-header");

				expect(firstHeader?.getAttribute("aria-expanded"))
					.toBe("false");

				firstHeader?.click();
				fixture.detectChanges();

				expect(firstHeader?.getAttribute("aria-expanded"))
					.toBe("true");
			});

		it("should show details list when expanded",
			() =>
			{
				const firstHeader: HTMLElement | null =
					nativeElement.querySelector(".arch-card-header");
				firstHeader?.click();
				fixture.detectChanges();

				const listItems: NodeListOf<Element> =
					nativeElement.querySelectorAll(".arch-card-details li");
				expect(listItems.length)
					.toBe(2);
				expect(listItems[0]?.textContent?.trim())
					.toBe("Detail A");
			});

		it("should show keyword chips when expanded",
			() =>
			{
				const firstHeader: HTMLElement | null =
					nativeElement.querySelector(".arch-card-header");
				firstHeader?.click();
				fixture.detectChanges();

				const keywords: NodeListOf<Element> =
					nativeElement.querySelectorAll("mat-chip");
				expect(keywords.length)
					.toBe(2);
			});

		it("should have correct heading hierarchy",
			() =>
			{
				const headingH2: Element | null =
					nativeElement.querySelector("h2");
				expect(headingH2?.textContent)
					.toContain("Architecture Patterns");

				const headingsH3: NodeListOf<Element> =
					nativeElement.querySelectorAll("h3");
				expect(headingsH3.length)
					.toBe(2);
			});
	});