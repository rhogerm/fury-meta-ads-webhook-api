import { describe, expect, it } from "vitest";
import { violationWebhookSchema } from "../src/schemas/violation.schema.js";

describe("violationWebhookSchema", () => {
  it("accepts a valid payload", () => {
    const result = violationWebhookSchema.safeParse({
      adId: "ad_123",
      tenantId: "tenant_456",
      violationType: "PROHIBITED_TERM",
      severity: "HIGH",
      detectedAt: "2026-05-23T13:00:00.000Z"
    });

    expect(result.success).toBe(true);
  });

  it("rejects invalid enum values and invalid datetime", () => {
    const result = violationWebhookSchema.safeParse({
      adId: "",
      tenantId: "tenant_456",
      violationType: "UNKNOWN",
      severity: "URGENT",
      detectedAt: "23/05/2026"
    });

    expect(result.success).toBe(false);
  });
});
