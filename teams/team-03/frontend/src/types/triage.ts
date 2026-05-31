import type { Severity } from "./chat";

export interface TriageResult {
  disease: string | null;
  confidence: number;
  severity: Severity;
  first_aid: string | null;
}
