"use client";

interface ChatEmptyStateProps {
  onSuggestionClick?: (text: string) => void;
}

const SUGGESTIONS = [
  "My cow stopped eating since yesterday",
  "Goat has swelling in the front leg",
  "Buffalo showing fever and weakness",
  "Chicken has difficulty breathing",
];

export function ChatEmptyState({ onSuggestionClick }: ChatEmptyStateProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-12">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-700 text-2xl font-bold text-white shadow-lg">
        PM
      </div>
      <h2 className="mb-2 text-2xl font-semibold tracking-tight">
        How can I help with your livestock?
      </h2>
      <p className="mb-8 max-w-md text-center text-sm text-muted-foreground md:text-base">
        Describe symptoms in any language. PashuMitra AI will triage, ask
        follow-up questions, and suggest next steps.
      </p>
      <div className="grid w-full max-w-2xl gap-2 sm:grid-cols-2">
        {SUGGESTIONS.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            onClick={() => onSuggestionClick?.(suggestion)}
            className="rounded-xl border bg-background px-4 py-3 text-left text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:bg-muted/50 hover:text-foreground"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
}
