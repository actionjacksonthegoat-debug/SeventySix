/**
 * TanStack commerce metrics instance.
 * Creates an OTel metrics set scoped to the "seventysixcommerce-tanstack" meter.
 * @see {@link @seventysixcommerce/shared/observability}
 */
import { createCommerceMetrics } from "@seventysixcommerce/shared/observability";
import type { CommerceMetrics } from "@seventysixcommerce/shared/observability";

const metricsInstance: CommerceMetrics =
	createCommerceMetrics("seventysixcommerce-tanstack");

/** @see {@link import("@seventysixcommerce/shared/observability").CommerceMetrics.recordPageView} */
export const recordPageView: CommerceMetrics["recordPageView"] =
	metricsInstance.recordPageView;

/** @see {@link import("@seventysixcommerce/shared/observability").CommerceMetrics.recordCartAdd} */
export const recordCartAdd: CommerceMetrics["recordCartAdd"] =
	metricsInstance.recordCartAdd;

/** @see {@link import("@seventysixcommerce/shared/observability").CommerceMetrics.recordCartRemove} */
export const recordCartRemove: CommerceMetrics["recordCartRemove"] =
	metricsInstance.recordCartRemove;

/** @see {@link import("@seventysixcommerce/shared/observability").CommerceMetrics.recordCheckoutStart} */
export const recordCheckoutStart: CommerceMetrics["recordCheckoutStart"] =
	metricsInstance.recordCheckoutStart;

/** @see {@link import("@seventysixcommerce/shared/observability").CommerceMetrics.recordCheckoutComplete} */
export const recordCheckoutComplete: CommerceMetrics["recordCheckoutComplete"] =
	metricsInstance.recordCheckoutComplete;