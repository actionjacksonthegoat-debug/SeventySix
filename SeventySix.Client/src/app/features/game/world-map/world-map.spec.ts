import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideZonelessChangeDetection } from "@angular/core";
import { provideHttpClient, withFetch } from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import {
	provideTanStackQuery,
	QueryClient
} from "@tanstack/angular-query-experimental";
import { WorldMap } from "./world-map";

describe("WorldMap", () =>
{
	let component: WorldMap;
	let fixture: ComponentFixture<WorldMap>;

	beforeEach(async () =>
	{
		const queryClient = new QueryClient({
			defaultOptions: {
				queries: { retry: false },
				mutations: { retry: false }
			}
		});

		await TestBed.configureTestingModule({
			imports: [WorldMap],
			providers: [
				provideHttpClient(withFetch()),
				provideHttpClientTesting(),
				provideZonelessChangeDetection(),
				provideTanStackQuery(queryClient)
			]
		}).compileComponents();

		fixture = TestBed.createComponent(WorldMap);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it("should create", () =>
	{
		expect(component).toBeTruthy();
	});
});
