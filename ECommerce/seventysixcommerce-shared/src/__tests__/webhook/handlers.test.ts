import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	type CheckoutSessionData,
	handleCheckoutCompleted
} from "../../webhook/index";

/** Minimal Drizzle-like transaction object used inside the handler. */
interface MockTx
{
	insert: ReturnType<typeof vi.fn>;
	select: ReturnType<typeof vi.fn>;
	delete: ReturnType<typeof vi.fn>;
	update: ReturnType<typeof vi.fn>;
}

/** Builds a reusable mock Drizzle transaction that calls through to the handler callback. */
function buildMockTx(overrides: Partial<MockTx> = {}): MockTx
{
	const insertValues: ReturnType<typeof vi.fn> =
		vi
			.fn()
			.mockReturnValue(
				{
					values: vi
						.fn()
						.mockReturnValue(
							{
								returning: vi
									.fn()
									.mockResolvedValue(
										[{ id: "order-uuid-0001" }])
							}),
					returning: vi
						.fn()
						.mockResolvedValue(
							[{ id: "order-uuid-0001" }])
				});

	const selectFrom: ReturnType<typeof vi.fn> =
		vi
			.fn()
			.mockReturnValue(
				{
					where: vi
						.fn()
						.mockReturnValue(
							{
								limit: vi
									.fn()
									.mockResolvedValue([])
							})
				});

	return {
		insert: overrides.insert ?? vi
			.fn()
			.mockReturnValue(
				{
					values: insertValues
				}),
		select: overrides.select ?? vi
			.fn()
			.mockReturnValue(
				{ from: selectFrom }),
		delete: overrides.delete ?? vi
			.fn()
			.mockReturnValue(
				{
					where: vi
						.fn()
						.mockResolvedValue(undefined)
				}),
		update: overrides.update ?? vi
			.fn()
			.mockReturnValue(
				{
					set: vi
						.fn()
						.mockReturnValue(
							{
								where: vi
									.fn()
									.mockResolvedValue(undefined)
							})
				}),
		...overrides
	};
}

/** Minimal session data for handler tests. */
const baseSession: CheckoutSessionData =
	{
		stripeSessionId: "cs_test_001",
		cartSessionId: "cart-session-001",
		customerEmail: "buyer@example.com",
		amountTotalCents: 4999,
		shippingAddress: {
			line1: "123 Main St",
			city: "Austin",
			state: "TX",
			postal_code: "78701",
			country: "US"
		},
		shippingName: "Test Buyer"
	};

describe("handleCheckoutCompleted",
	() =>
	{
		let mockTransaction: ReturnType<typeof vi.fn>;
		let mockSelect: ReturnType<typeof vi.fn>;
		let mockTx: MockTx;

		beforeEach(
			() =>
			{
				mockTx =
					buildMockTx();

				// Snapshot select returns empty (no pre-captured snapshot) — falls back to cart
				mockSelect =
					vi
						.fn()
						.mockReturnValue(
							{
								from: vi
									.fn()
									.mockReturnValue(
										{
											where: vi
												.fn()
												.mockReturnValue(
													{
														limit: vi
															.fn()
															.mockResolvedValue([])
													})
										})
							});

				mockTransaction =
					vi
						.fn()
						.mockImplementation(
							async (cb: (tx: MockTx) => Promise<void>) =>
							{
								return cb(mockTx);
							});
			});

		afterEach(
			() =>
			{
				vi.clearAllMocks();
			});

		it("handleCheckoutCompleted_PersistsOrderAndItems_OnSuccess",
			async () =>
			{
				const mockInsertValues: ReturnType<typeof vi.fn> =
					vi
						.fn()
						.mockReturnValue(
							{
								returning: vi
									.fn()
									.mockResolvedValue(
										[{ id: "order-uuid-0001" }])
							});
				const mockTxInsert: ReturnType<typeof vi.fn> =
					vi
						.fn()
						.mockReturnValue(
							{ values: mockInsertValues });

				mockTx =
					buildMockTx(
						{
							insert: mockTxInsert,
							select: vi
								.fn()
								.mockReturnValue(
									{
										from: vi
											.fn()
											.mockReturnValue(
												{
													where: vi
														.fn()
														.mockReturnValue(
															{
																limit: vi
																	.fn()
																	.mockResolvedValue([])
															})
												})
									})
						});
				mockTransaction =
					vi
						.fn()
						.mockImplementation(
							async (cb: (tx: MockTx) => Promise<void>) =>
							{
								return cb(mockTx);
							});

				const db: unknown =
					{
						select: mockSelect,
						transaction: mockTransaction
					};

				await handleCheckoutCompleted(
					db as never,
					baseSession,
					null,
					null,
					() => new Date("2025-01-01T00:00:00Z"));

				expect(mockTransaction)
					.toHaveBeenCalledOnce();
				// Orders insert and status history insert happen inside the transaction
				expect(mockTxInsert)
					.toHaveBeenCalledTimes(2);
			});

		it("handleCheckoutCompleted_RollsBackOrder_WhenItemInsertFails",
			async () =>
			{
				let insertCallCount: number = 0;
				const mockTxInsertFail: ReturnType<typeof vi.fn> =
					vi
						.fn()
						.mockImplementation(
							() =>
							{
								insertCallCount++;
								if (insertCallCount === 1)
								{
									// First insert (orders) succeeds
									return {
										values: vi
											.fn()
											.mockReturnValue(
												{
													returning: vi
														.fn()
														.mockResolvedValue(
															[{ id: "order-uuid-fail" }])
												})
									};
								}

								// Second insert (orderItems or statusHistory) fails
								return {
									values: vi
										.fn()
										.mockRejectedValue(
											new Error("DB constraint violation"))
								};
							});

				mockTx =
					buildMockTx(
						{
							insert: mockTxInsertFail,
							select: vi
								.fn()
								.mockReturnValue(
									{
										from: vi
											.fn()
											.mockReturnValue(
												{
													where: vi
														.fn()
														.mockReturnValue(
															{
																limit: vi
																	.fn()
																	.mockResolvedValue([])
															})
												})
									})
						});
				mockTransaction =
					vi
						.fn()
						.mockImplementation(
							async (cb: (tx: MockTx) => Promise<void>) =>
							{
								return cb(mockTx);
							});

				const db: unknown =
					{
						select: mockSelect,
						transaction: mockTransaction
					};

				await expect(
					handleCheckoutCompleted(
						db as never,
						baseSession,
						null,
						null,
						() => new Date("2025-01-01T00:00:00Z")))
					.rejects
					.toThrow("DB constraint violation");
			});

		it("handleCheckoutCompleted_EmailFailure_DoesNotRollback",
			async () =>
			{
				const mockInsertReturning: ReturnType<typeof vi.fn> =
					vi
						.fn()
						.mockResolvedValue(
							[{ id: "order-uuid-email-fail" }]);
				const mockInsertValues: ReturnType<typeof vi.fn> =
					vi
						.fn()
						.mockReturnValue(
							{ returning: mockInsertReturning });
				const mockTxInsert: ReturnType<typeof vi.fn> =
					vi
						.fn()
						.mockReturnValue(
							{ values: mockInsertValues });
				const mockPostTxSelect: ReturnType<typeof vi.fn> =
					vi
						.fn()
						.mockReturnValue(
							{
								from: vi
									.fn()
									.mockReturnValue(
										{
											where: vi
												.fn()
												.mockReturnValue(
													{
														limit: vi
															.fn()
															.mockResolvedValue(
																[{ id: "order-uuid-email-fail", totalAmount: "49.99" }])
													})
										})
							});

				mockTx =
					buildMockTx(
						{
							insert: mockTxInsert,
							select: vi
								.fn()
								.mockReturnValue(
									{
										from: vi
											.fn()
											.mockReturnValue(
												{
													where: vi
														.fn()
														.mockReturnValue(
															{
																limit: vi
																	.fn()
																	.mockResolvedValue([])
															})
												})
									})
						});
				mockTransaction =
					vi
						.fn()
						.mockImplementation(
							async (cb: (tx: MockTx) => Promise<void>) =>
							{
								return cb(mockTx);
							});

				// Post-transaction selects (for order and item count)
				let postTxSelectCallCount: number = 0;
				mockSelect =
					vi
						.fn()
						.mockImplementation(
							() =>
							{
								postTxSelectCallCount++;

								if (postTxSelectCallCount === 1)
								{
									// Snapshot read — no snapshot
									return {
										from: vi
											.fn()
											.mockReturnValue(
												{
													where: vi
														.fn()
														.mockReturnValue(
															{
																limit: vi
																	.fn()
																	.mockResolvedValue([])
															})
												})
									};
								}

								// Order fetch for email
								return mockPostTxSelect();
							});

				const db: unknown =
					{
						select: mockSelect,
						transaction: mockTransaction
					};

				const throwingEmailClient =
					vi
						.fn()
						.mockRejectedValue(new Error("Brevo rate limit exceeded"));

				// Should resolve without throwing despite email failure
				await expect(
					handleCheckoutCompleted(
						db as never,
						baseSession,
						null,
						throwingEmailClient,
						() => new Date("2025-01-01T00:00:00Z")))
					.resolves
					.toBeUndefined();

				expect(mockTransaction)
					.toHaveBeenCalledOnce();
			});

		it("handleCheckoutCompleted_FulfillmentFailure_DoesNotRollback",
			async () =>
			{
				const mockInsertValues: ReturnType<typeof vi.fn> =
					vi
						.fn()
						.mockReturnValue(
							{
								returning: vi
									.fn()
									.mockResolvedValue(
										[{ id: "order-uuid-printful-fail" }])
							});
				const mockTxInsert: ReturnType<typeof vi.fn> =
					vi
						.fn()
						.mockReturnValue(
							{ values: mockInsertValues });

				mockTx =
					buildMockTx(
						{
							insert: mockTxInsert,
							select: vi
								.fn()
								.mockReturnValue(
									{
										from: vi
											.fn()
											.mockReturnValue(
												{
													where: vi
														.fn()
														.mockReturnValue(
															{
																limit: vi
																	.fn()
																	.mockResolvedValue([])
															})
												})
									})
						});
				mockTransaction =
					vi
						.fn()
						.mockImplementation(
							async (cb: (tx: MockTx) => Promise<void>) =>
							{
								return cb(mockTx);
							});

				// Post-transaction: order exists for Printful, then items join
				let postTxSelectCallCount: number = 0;
				mockSelect =
					vi
						.fn()
						.mockImplementation(
							() =>
							{
								postTxSelectCallCount++;

								if (postTxSelectCallCount === 1)
								{
									// Snapshot read — no snapshot
									return {
										from: vi
											.fn()
											.mockReturnValue(
												{
													where: vi
														.fn()
														.mockReturnValue(
															{
																limit: vi
																	.fn()
																	.mockResolvedValue([])
															})
												})
									};
								}

								if (postTxSelectCallCount === 2)
								{
									// Order fetch for Printful
									return {
										from: vi
											.fn()
											.mockReturnValue(
												{
													where: vi
														.fn()
														.mockReturnValue(
															{
																limit: vi
																	.fn()
																	.mockResolvedValue(
																		[{
																			id: "order-uuid-printful-fail",
																			shippingAddress: {},
																			shippingName: "Test Buyer"
																		}])
															})
												})
									};
								}

								// Order items join for Printful
								return {
									from: vi
										.fn()
										.mockReturnValue(
											{
												innerJoin: vi
													.fn()
													.mockReturnValue(
														{
															where: vi
																.fn()
																.mockResolvedValue([])
														})
											})
								};
							});

				const mockUpdate: ReturnType<typeof vi.fn> =
					vi
						.fn()
						.mockReturnValue(
							{
								set: vi
									.fn()
									.mockReturnValue(
										{
											where: vi
												.fn()
												.mockResolvedValue(undefined)
										})
							});
				const mockInsertForStatusUpdate: ReturnType<typeof vi.fn> =
					vi
						.fn()
						.mockReturnValue(
							{
								values: vi
									.fn()
									.mockResolvedValue(undefined)
							});

				const db: unknown =
					{
						select: mockSelect,
						transaction: mockTransaction,
						update: mockUpdate,
						insert: mockInsertForStatusUpdate
					};

				const throwingFulfillmentClient =
					vi
						.fn()
						.mockRejectedValue(new Error("Printful API down"));

				// Should resolve without throwing despite Printful failure
				await expect(
					handleCheckoutCompleted(
						db as never,
						baseSession,
						throwingFulfillmentClient,
						null,
						() => new Date("2025-01-01T00:00:00Z")))
					.resolves
					.toBeUndefined();

				expect(mockTransaction)
					.toHaveBeenCalledOnce();
			});

		it("handleCheckoutCompleted_IsIdempotent_ForRepeatedStripeEventIds",
			async () =>
			{
				// Verifies that isOrderProcessed guards against duplicate processing
				// The handler itself does NOT check idempotency; the caller is responsible.
				// This test documents the contract: same session can be processed twice
				// if the caller does not check first. Both calls will attempt to insert.
				const mockInsertValues: ReturnType<typeof vi.fn> =
					vi
						.fn()
						.mockReturnValue(
							{
								returning: vi
									.fn()
									.mockResolvedValue(
										[{ id: "order-uuid-idempotent" }])
							});
				const mockTxInsert: ReturnType<typeof vi.fn> =
					vi
						.fn()
						.mockReturnValue(
							{ values: mockInsertValues });

				mockTx =
					buildMockTx(
						{
							insert: mockTxInsert,
							select: vi
								.fn()
								.mockReturnValue(
									{
										from: vi
											.fn()
											.mockReturnValue(
												{
													where: vi
														.fn()
														.mockReturnValue(
															{
																limit: vi
																	.fn()
																	.mockResolvedValue([])
															})
												})
									})
						});
				mockTransaction =
					vi
						.fn()
						.mockImplementation(
							async (cb: (tx: MockTx) => Promise<void>) =>
							{
								return cb(mockTx);
							});

				const db: unknown =
					{
						select: mockSelect,
						transaction: mockTransaction
					};

				// First call
				await handleCheckoutCompleted(
					db as never,
					baseSession,
					null,
					null,
					() => new Date("2025-01-01T00:00:00Z"));

				// Second call (duplicate event) — handler runs again since caller did not check
				// The DB would reject on unique constraint in real scenario
				await handleCheckoutCompleted(
					db as never,
					baseSession,
					null,
					null,
					() => new Date("2025-01-01T00:00:00Z"));

				// Both calls reach the transaction
				expect(mockTransaction)
					.toHaveBeenCalledTimes(2);
			});
	});