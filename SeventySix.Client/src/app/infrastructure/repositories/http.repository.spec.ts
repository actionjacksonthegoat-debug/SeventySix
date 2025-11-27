/**
 * HTTP Repository Tests
 * Tests for abstract HttpRepository base class
 */

import { TestBed } from "@angular/core/testing";
import { provideZonelessChangeDetection } from "@angular/core";
import {
	HttpTestingController,
	provideHttpClientTesting
} from "@angular/common/http/testing";
import { provideHttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { HttpRepository } from "./http.repository";

/**
 * Test repository extending HttpRepository
 */
interface TestEntity
{
	id: number;
	name: string;
}

@Injectable()
class TestRepository extends HttpRepository<TestEntity>
{
	protected readonly endpoint: string = "test-entities";
}

describe("HttpRepository", () =>
{
	let repository: TestRepository;
	let httpMock: HttpTestingController;
	const baseUrl: string = "http://localhost:1234/api/v1";

	beforeEach(async () =>
	{
		await TestBed.configureTestingModule({
			providers: [
				provideZonelessChangeDetection(),
				provideHttpClient(),
				provideHttpClientTesting(),
				TestRepository
			]
		}).compileComponents();

		repository = TestBed.inject(TestRepository);
		httpMock = TestBed.inject(HttpTestingController);
	});

	afterEach(() =>
	{
		httpMock.verify();
	});

	describe("getAll", () =>
	{
		it("should GET all entities", (done: DoneFn) =>
		{
			const mockEntities: TestEntity[] = [
				{ id: 1, name: "Entity 1" },
				{ id: 2, name: "Entity 2" }
			];

			repository.getAll().subscribe((entities: TestEntity[]) =>
			{
				expect(entities).toEqual(mockEntities);
				done();
			});

			const req = httpMock.expectOne(`${baseUrl}/test-entities`);
			expect(req.request.method).toBe("GET");
			req.flush(mockEntities);
		});
	});

	describe("getById", () =>
	{
		it("should GET entity by numeric ID", (done: DoneFn) =>
		{
			const mockEntity: TestEntity = { id: 1, name: "Entity 1" };

			repository.getById(1).subscribe((entity: TestEntity) =>
			{
				expect(entity).toEqual(mockEntity);
				done();
			});

			const req = httpMock.expectOne(`${baseUrl}/test-entities/1`);
			expect(req.request.method).toBe("GET");
			req.flush(mockEntity);
		});

		it("should GET entity by string ID", (done: DoneFn) =>
		{
			const mockEntity: TestEntity = { id: 1, name: "Entity 1" };

			repository.getById("abc-123").subscribe((entity: TestEntity) =>
			{
				expect(entity).toEqual(mockEntity);
				done();
			});

			const req = httpMock.expectOne(`${baseUrl}/test-entities/abc-123`);
			expect(req.request.method).toBe("GET");
			req.flush(mockEntity);
		});
	});

	describe("create", () =>
	{
		it("should POST new entity", (done: DoneFn) =>
		{
			const newEntity: Partial<TestEntity> = { name: "New Entity" };
			const createdEntity: TestEntity = { id: 3, name: "New Entity" };

			repository.create(newEntity).subscribe((entity: TestEntity) =>
			{
				expect(entity).toEqual(createdEntity);
				done();
			});

			const req = httpMock.expectOne(`${baseUrl}/test-entities`);
			expect(req.request.method).toBe("POST");
			expect(req.request.body).toEqual(newEntity);
			req.flush(createdEntity);
		});
	});

	describe("update", () =>
	{
		it("should PUT updated entity", (done: DoneFn) =>
		{
			const updatedData: Partial<TestEntity> = { name: "Updated Name" };
			const updatedEntity: TestEntity = { id: 1, name: "Updated Name" };

			repository
				.update(1, updatedData)
				.subscribe((entity: TestEntity) =>
				{
					expect(entity).toEqual(updatedEntity);
					done();
				});

			const req = httpMock.expectOne(`${baseUrl}/test-entities/1`);
			expect(req.request.method).toBe("PUT");
			expect(req.request.body).toEqual(updatedData);
			req.flush(updatedEntity);
		});
	});

	describe("delete", () =>
	{
		it("should DELETE entity by ID", (done: DoneFn) =>
		{
			repository.delete(1).subscribe(() =>
			{
				expect().nothing();
				done();
			});

			const req = httpMock.expectOne(`${baseUrl}/test-entities/1`);
			expect(req.request.method).toBe("DELETE");
			req.flush(null);
		});
	});
});
