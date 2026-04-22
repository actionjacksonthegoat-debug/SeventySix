/**
 * TanStack log forwarder instance.
 * Creates a log forwarder scoped to the "seventysixcommerce-tanstack" source context.
 * @see {@link @seventysixcommerce/shared/observability}
 */
import { createLogForwarder } from "@seventysixcommerce/shared/observability";
import type { LogForwarder } from "@seventysixcommerce/shared/observability";

const forwarder: LogForwarder =
	createLogForwarder("seventysixcommerce-tanstack");

export type { LogEntry } from "@seventysixcommerce/shared/observability";

/** @see {@link import("@seventysixcommerce/shared/observability").LogForwarder.configureLogForwarder} */
export const configureLogForwarder: LogForwarder["configureLogForwarder"] =
	forwarder.configureLogForwarder;

/** @see {@link import("@seventysixcommerce/shared/observability").LogForwarder.shouldForwardLog} */
export const shouldForwardLog: LogForwarder["shouldForwardLog"] =
	forwarder.shouldForwardLog;

/** @see {@link import("@seventysixcommerce/shared/observability").LogForwarder.formatLogEntry} */
export const formatLogEntry: LogForwarder["formatLogEntry"] =
	forwarder.formatLogEntry;

/** @see {@link import("@seventysixcommerce/shared/observability").LogForwarder.forwardLogs} */
export const forwardLogs: LogForwarder["forwardLogs"] =
	forwarder.forwardLogs;

/** @see {@link import("@seventysixcommerce/shared/observability").LogForwarder.queueLog} */
export const queueLog: LogForwarder["queueLog"] =
	forwarder.queueLog;

/** @see {@link import("@seventysixcommerce/shared/observability").LogForwarder._resetForTesting} */
export const _resetForTesting: LogForwarder["_resetForTesting"] =
	forwarder._resetForTesting;