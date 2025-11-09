import { provideHttpClient, withFetch } from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { provideZonelessChangeDetection } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { WeatherDisplay } from "./weather-display";

describe("WeatherDisplay", () =>
{
	let component: WeatherDisplay;
	let fixture: ComponentFixture<WeatherDisplay>;

	beforeEach(async () =>
	{
		await TestBed.configureTestingModule({
			imports: [WeatherDisplay],
			providers: [
				provideHttpClient(withFetch()),
				provideHttpClientTesting(),
				provideZonelessChangeDetection()
			]
		}).compileComponents();

		fixture = TestBed.createComponent(WeatherDisplay);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it("should create", () =>
	{
		expect(component).toBeTruthy();
	});
});
