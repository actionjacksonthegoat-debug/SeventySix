import { afterEach, describe, expect, it, vi } from "vitest";

// Mock the OTel SDK before importing the module under test
const mockSdkStart =
	vi.fn();
const mockSdkShutdown =
	vi
		.fn()
		.mockResolvedValue(undefined);
vi.mock("@opentelemetry/sdk-node", () => (
	{
		NodeSDK: class MockNodeSDK
		{
			start = mockSdkStart;
			shutdown = mockSdkShutdown;
		}
	}));

vi.mock("@opentelemetry/auto-instrumentations-node", () => (
	{
		getNodeAutoInstrumentations: vi
			.fn()
			.mockReturnValue([])
	}));

vi.mock("@opentelemetry/exporter-trace-otlp-http", () => (
	{
		OTLPTraceExporter: class MockTraceExporter
		{
		}
	}));

vi.mock("@opentelemetry/exporter-metrics-otlp-http", () => (
	{
		OTLPMetricExporter: class MockMetricExporter
		{
		}
	}));

vi.mock("@opentelemetry/sdk-metrics", () => (
	{
		PeriodicExportingMetricReader: class MockMetricReader
		{
		}
	}));

describe("tanstack telemetry",
	() =>
	{
		afterEach(
			() =>
			{
				vi.clearAllMocks();
				vi.resetModules();
			});

		it("should export initTelemetry function",
			async () =>
			{
				const telemetry =
					await import("~/server/telemetry");
				expect(telemetry.initTelemetry)
					.toBeDefined();
				expect(typeof telemetry.initTelemetry)
					.toBe("function");
			});

		it("should export shutdownTelemetry function",
			async () =>
			{
				const telemetry =
					await import("~/server/telemetry");
				expect(telemetry.shutdownTelemetry)
					.toBeDefined();
				expect(typeof telemetry.shutdownTelemetry)
					.toBe("function");
			});

		it("should not initialize SDK when endpoint is empty",
			async () =>
			{
				const telemetry =
					await import("~/server/telemetry");
				telemetry.initTelemetry("");
				expect(mockSdkStart)
					.not
					.toHaveBeenCalled();
			});

		it("should initialize SDK when endpoint is provided",
			async () =>
			{
				const telemetry =
					await import("~/server/telemetry");
				telemetry.initTelemetry("http://otel-collector:4318");
				expect(mockSdkStart)
					.toHaveBeenCalledOnce();
			});

		it("should not initialize SDK twice",
			async () =>
			{
				const telemetry =
					await import("~/server/telemetry");
				telemetry.initTelemetry("http://otel-collector:4318");
				telemetry.initTelemetry("http://otel-collector:4318");
				expect(mockSdkStart)
					.toHaveBeenCalledOnce();
			});

		it("should shutdown the SDK and allow re-initialization after shutdown",
			async () =>
			{
				const telemetry =
					await import("~/server/telemetry");
				telemetry.initTelemetry("http://otel-collector:4318");
				expect(mockSdkStart)
					.toHaveBeenCalledOnce();

				await telemetry.shutdownTelemetry();
				expect(mockSdkShutdown)
					.toHaveBeenCalledOnce();

				// After shutdown, re-initialization should be allowed
				telemetry.initTelemetry("http://otel-collector:4318");
				expect(mockSdkStart)
					.toHaveBeenCalledTimes(2);
			});

		it("should be a no-op when shutdownTelemetry is called without prior initialization",
			async () =>
			{
				const telemetry =
					await import("~/server/telemetry");

				await telemetry.shutdownTelemetry();

				expect(mockSdkShutdown)
					.not
					.toHaveBeenCalled();
			});
	});
