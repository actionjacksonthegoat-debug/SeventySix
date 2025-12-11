import { TestBed } from "@angular/core/testing";
import { provideZonelessChangeDetection } from "@angular/core";
import {
	QueryClient,
	provideAngularQuery
} from "@tanstack/angular-query-experimental";
import { of } from "rxjs";
import { AccountService } from "./account.service";
import { AccountRepository } from "../repositories";
import { QueryKeys } from "@infrastructure/utils/query-keys";

describe("AccountService", () =>
{
	let service: AccountService;
	let queryClient: QueryClient;
	let mockRepository: jasmine.SpyObj<AccountRepository>;

	beforeEach(() =>
	{
		mockRepository = jasmine.createSpyObj("AccountRepository", [
			"getProfile",
			"updateProfile",
			"getAvailableRoles",
			"createPermissionRequest"
		]);

		queryClient = new QueryClient({
			defaultOptions: { queries: { retry: false } }
		});

		TestBed.configureTestingModule({
			providers: [
				provideZonelessChangeDetection(),
				provideAngularQuery(queryClient),
				AccountService,
				{ provide: AccountRepository, useValue: mockRepository }
			]
		});

		service = TestBed.inject(AccountService);
	});

	afterEach(() => queryClient.clear());

	it("should be created", () =>
	{
		expect(service).toBeTruthy();
	});

	it("should invalidate account queries on updateProfile success", async () =>
	{
		mockRepository.updateProfile.and.returnValue(of({} as any));
		const invalidateSpy: jasmine.Spy = spyOn(
			queryClient,
			"invalidateQueries"
		);

		const mutation = TestBed.runInInjectionContext(() =>
			service.updateProfile()
		);
		await mutation.mutateAsync({
			email: "test@example.com",
			fullName: "Test User"
		});

		expect(invalidateSpy).toHaveBeenCalledWith({
			queryKey: QueryKeys.account.all
		});
	});

	it("should invalidate available roles on createPermissionRequest success", async () =>
	{
		mockRepository.createPermissionRequest.and.returnValue(of(undefined));
		const invalidateSpy: jasmine.Spy = spyOn(
			queryClient,
			"invalidateQueries"
		);

		const mutation = TestBed.runInInjectionContext(() =>
			service.createPermissionRequest()
		);
		await mutation.mutateAsync({
			requestedRoles: ["Admin"],
			requestMessage: "Test"
		});

		expect(invalidateSpy).toHaveBeenCalledWith({
			queryKey: QueryKeys.account.availableRoles
		});
	});
});
