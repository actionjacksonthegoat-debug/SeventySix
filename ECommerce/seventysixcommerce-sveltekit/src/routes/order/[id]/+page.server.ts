import { db } from "$lib/server/db";
import { orderItems, orders, products } from "$lib/server/db/schema";
import { error } from "@sveltejs/kit";
import { and, eq } from "drizzle-orm";
import type { PageServerLoad } from "./$types";

const UUID_PATTERN: RegExp =
	/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Loads order details for the tracking page. Scoped to current cart session. */
export const load: PageServerLoad =
	async ({ params, locals }) =>
	{
		if (!UUID_PATTERN.test(params.id))
		{
			error(404, "Order not found");
		}

		const matchedOrders =
			await db
				.select()
				.from(orders)
				.where(
					and(
						eq(orders.id, params.id),
						eq(orders.cartSessionId, locals.cartSessionId)))
				.limit(1);

		if (matchedOrders.length === 0)
		{
			error(404, "Order not found");
		}

		const items =
			await db
				.select(
					{
						productTitle: products.title,
						quantity: orderItems.quantity,
						unitPrice: orderItems.unitPrice
					})
				.from(orderItems)
				.innerJoin(products, eq(orderItems.productId, products.id))
				.where(eq(orderItems.orderId, params.id));

		return { order: matchedOrders[0], items };
	};