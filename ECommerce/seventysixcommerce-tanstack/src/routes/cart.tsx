import type { CartItem, CartResponse } from "@seventysixcommerce/shared/cart";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import type { JSX } from "react";
import { useState } from "react";
import {
	FREE_SHIPPING_THRESHOLD,
	STANDARD_SHIPPING_DOLLARS
} from "~/lib/constants";
import {
	getCart,
	removeFromCart,
	updateCartItem
} from "~/server/functions/cart";
import { createCheckoutSession } from "~/server/functions/checkout";
import { queueLog } from "~/server/log-forwarder";
import { recordPageView } from "~/server/metrics";

export const Route =
	createFileRoute("/cart")(
		{
			head: () => ({
				meta: [
					{ title: "Your Cart — SeventySixCommerce" },
					{ name: "robots", content: "noindex" }
				]
			}),
			loader: async (): Promise<CartResponse> =>
			{
				recordPageView("cart");
				queueLog(
					{
						logLevel: "Information",
						message: "Page view: cart"
					});

				return getCart();
			},
			component: CartPage
		});

function CartPage(): JSX.Element
{
	const cart: CartResponse =
		Route.useLoaderData();
	const router =
		useRouter();
	const [pending, setPending] =
		useState<string | null>(null);
	const [checkingOut, setCheckingOut] =
		useState<boolean>(false);
	const [checkoutError, setCheckoutError] =
		useState<string | null>(null);

	const subtotal: number =
		parseFloat(cart.subtotal);
	const shipping: number =
		subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : STANDARD_SHIPPING_DOLLARS;
	const total: number =
		subtotal + shipping;

	/** Updates quantity for a cart item. */
	async function handleUpdateQuantity(
		cartItemId: string,
		quantity: number): Promise<void>
	{
		setPending(cartItemId);
		try
		{
			await updateCartItem(
				{ data: { cartItemId, quantity } });
			await router.invalidate();
		}
		finally
		{
			setPending(null);
		}
	}

	/** Removes an item from the cart. */
	async function handleRemove(cartItemId: string): Promise<void>
	{
		setPending(cartItemId);
		try
		{
			await removeFromCart(
				{ data: { cartItemId } });
			await router.invalidate();
		}
		finally
		{
			setPending(null);
		}
	}

	/** Initiates Stripe checkout from the current cart. */
	async function handleCheckout(): Promise<void>
	{
		setCheckingOut(true);
		setCheckoutError(null);
		try
		{
			const result =
				await createCheckoutSession();
			if (result.url)
			{
				window.location.href =
					result.url;
			}
		}
		catch
		{
			setCheckoutError("Failed to start checkout. Please try again.");
		}
		finally
		{
			setCheckingOut(false);
		}
	}

	if (cart.items.length === 0)
	{
		return <EmptyCart />;
	}

	return (
		<div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
			<h1 className="text-2xl font-bold text-text-primary mb-8">Your Cart</h1>

			<div className="space-y-4">
				{cart.items.map((item: CartItem) => (
					<CartItemRow
						key={item.id}
						item={item}
						isPending={pending === item.id}
						onUpdateQuantity={handleUpdateQuantity}
						onRemove={handleRemove}
					/>))}
			</div>

			<div className="mt-8 border-t border-border pt-6">
				<div className="space-y-2 text-sm">
					<div className="flex justify-between">
						<span className="text-text-secondary">Subtotal</span>
						<span className="text-text-primary">
							${subtotal.toFixed(2)}
						</span>
					</div>
					<div className="flex justify-between">
						<span className="text-text-secondary">Shipping</span>
						<span className="text-text-primary">
							{shipping === 0
								? "Free"
								: `$${shipping.toFixed(2)}`}
						</span>
					</div>
					{shipping > 0 && (
						<p className="text-xs text-text-muted">
							Free shipping on orders ${FREE_SHIPPING_THRESHOLD}+
						</p>)}
					<div className="flex justify-between text-base font-semibold border-t border-border pt-2">
						<span>Total</span>
						<span>${total.toFixed(2)}</span>
					</div>
				</div>

				<div className="mt-6 flex flex-col sm:flex-row gap-3">
					{checkoutError && (
						<p
							className="w-full text-sm text-red-600 mb-2"
							role="alert"
						>
							{checkoutError}
						</p>)}
					<button
						type="button"
						disabled={checkingOut}
						onClick={handleCheckout}
						className="flex-1 text-center bg-text-primary text-bg-primary py-3 px-6 rounded-lg hover:bg-text-primary transition-colors font-medium disabled:cursor-not-allowed disabled:opacity-50"
					>
						{checkingOut
							? "Starting checkout..."
							: "Proceed to Checkout"}
					</button>
					<a
						href="/"
						className="flex-1 text-center border border-border text-text-secondary py-3 px-6 rounded-lg hover:bg-bg-secondary transition-colors"
					>
						Continue Shopping
					</a>
				</div>
			</div>
		</div>);
}

/** Props for the CartItemRow component. */
interface CartItemRowProps
{
	readonly item: CartItem;
	readonly isPending: boolean;
	readonly onUpdateQuantity: (
		cartItemId: string,
		quantity: number) => Promise<void>;
	readonly onRemove: (cartItemId: string) => Promise<void>;
}

/** Individual cart item row with quantity controls and remove action. */
function CartItemRow({
	item,
	isPending,
	onUpdateQuantity,
	onRemove
}: CartItemRowProps): JSX.Element
{
	return (
		<div
			className={`flex items-start gap-4 p-4 bg-bg-primary rounded-lg border border-border ${
				isPending ? "opacity-60" : ""
			}`}
		>
			<img
				src={item.thumbnailUrl}
				alt={item.productTitle}
				className="w-20 h-20 object-cover rounded-md"
				loading="lazy"
				decoding="async"
				width={80}
				height={80}
			/>

			<div className="flex-1 min-w-0">
				<h3 className="font-medium text-text-primary truncate">
					{item.productTitle}
				</h3>
				<p className="text-sm text-text-muted">{item.variantName}</p>
				<p className="text-sm text-text-primary mt-1">${item.unitPrice}</p>
			</div>

			<div className="flex items-center gap-2">
				<button
					type="button"
					disabled={isPending || item.quantity <= 1}
					onClick={() =>
						onUpdateQuantity(item.id, item.quantity - 1)}
					className="w-8 h-8 flex items-center justify-center border border-border rounded text-text-secondary hover:bg-bg-secondary disabled:opacity-40"
					aria-label={`Decrease quantity of ${item.productTitle}`}
				>
					−
				</button>
				<span
					className="w-8 text-center text-sm"
					aria-label={`Quantity: ${item.quantity}`}
				>
					{item.quantity}
				</span>
				<button
					type="button"
					disabled={isPending || item.quantity >= 10}
					onClick={() =>
						onUpdateQuantity(item.id, item.quantity + 1)}
					className="w-8 h-8 flex items-center justify-center border border-border rounded text-text-secondary hover:bg-bg-secondary disabled:opacity-40"
					aria-label={`Increase quantity of ${item.productTitle}`}
				>
					+
				</button>
			</div>

			<div className="text-right">
				<p className="font-medium text-text-primary">${item.lineTotal}</p>
				<button
					type="button"
					disabled={isPending}
					onClick={() => onRemove(item.id)}
					className="text-sm text-red-600 hover:text-red-800 mt-1"
					aria-label={`Remove ${item.productTitle} from cart`}
				>
					Remove
				</button>
			</div>
		</div>);
}

/** Empty cart state with CTA to continue shopping. */
function EmptyCart(): JSX.Element
{
	return (
		<div className="max-w-md mx-auto px-4 py-16 text-center">
			<div className="text-6xl mb-4" aria-hidden="true">
				🛒
			</div>
			<h1 className="text-xl font-semibold text-text-primary mb-2">
				Your cart is empty
			</h1>
			<p className="text-text-muted mb-6">
				Looks like you haven't added anything yet. Browse our collection to find something you love.
			</p>
			<a
				href="/"
				className="inline-block bg-text-primary text-bg-primary py-3 px-6 rounded-lg hover:bg-text-primary transition-colors font-medium"
			>
				Browse Collection
			</a>
		</div>);
}