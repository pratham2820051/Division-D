import type { Severity } from "@/types/chat";

const labels: Record<NonNullable<Severity>, string> = {
  self_treatable: "Self-Treatable",
  urgent: "Urgent",
  critical: "Critical",
};

export function SeverityBadge({ severity }: { severity: Severity }) {
  if (!severity) return null;
  return (
    <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-medium">
      {labels[severity]}
    </span>
  );
}
