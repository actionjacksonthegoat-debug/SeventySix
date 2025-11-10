import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideZonelessChangeDetection } from "@angular/core";
import { provideRouter } from "@angular/router";
import { NotFoundPage } from "./not-found";

describe("NotFoundPage", () =>
{
	let component: NotFoundPage;
	let fixture: ComponentFixture<NotFoundPage>;

	beforeEach(async () =>
	{
		await TestBed.configureTestingModule({
			imports: [NotFoundPage],
			providers: [provideZonelessChangeDetection(), provideRouter([])]
		}).compileComponents();

		fixture = TestBed.createComponent(NotFoundPage);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it("should create", () =>
	{
		expect(component).toBeTruthy();
	});
});
