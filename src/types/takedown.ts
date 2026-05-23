export const violationTypes = [
  "PROHIBITED_TERM",
  "BRAND_VIOLATION",
  "COMPLIANCE_FAIL"
] as const;

export const severities = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;

export type ViolationType = (typeof violationTypes)[number];
export type Severity = (typeof severities)[number];

export type TakedownJobData = {
  adId: string;
  tenantId: string;
  violationType: ViolationType;
  severity: Severity;
  detectedAt: string;
};

export type TakedownJobResult = {
  metaApiStatus: number;
  processedAt: string;
};
