import { useRouter } from "@tanstack/react-router";
import type { RegisteredRouter } from "@tanstack/react-router";
import type { JSX } from "react";
import { useEffect, useState } from "react";
import { getCart } from "~/server/functions/cart";

/** Cart badge that shows item count in the navigation. */
export function CartBadge(): JSX.Element | null
{
	const router: RegisteredRouter =
		useRouter();
	const [count, setCount] =
		useState<number>(0);

	useEffect(
		() =>
		{
			/** Fetches the current cart count from the server. */
			function fetchCount(): void
			{
				getCart()
					.then((cart) => setCount(cart.itemCount))
					.catch(() => setCount(0));
			}

			fetchCount();

			const unsubscribe: () => void =
				router.subscribe("onResolved", fetchCount);

			return unsubscribe;
		},
		[router]);

	if (count === 0)
	{
		return null;
	}

	return (
		<span className="absolute -top-2 -right-3 bg-text-primary text-bg-primary text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
			{count > 99 ? "99+" : count}
		</span>);
}