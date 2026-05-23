import { z } from "zod";
import { severities, violationTypes } from "../types/takedown.js";

export const violationWebhookSchema = z.object({
  adId: z.string().trim().min(1, "adId is required"),
  tenantId: z.string().trim().min(1, "tenantId is required"),
  violationType: z.enum(violationTypes),
  severity: z.enum(severities),
  detectedAt: z.string().datetime({
    message: "detectedAt must be a valid ISO 8601 datetime"
  })
});

export type ViolationWebhookPayload = z.infer<typeof violationWebhookSchema>;
