"use client";

import { Globe, ChevronDown } from "lucide-react";

import { SUPPORTED_LANGUAGES } from "@/lib/languages";
import { cn } from "@/lib/utils";
import type { LanguageCode } from "@/types/translation";

interface TranslationDropdownProps {
  value: LanguageCode;
  onChange: (code: LanguageCode) => void;
  className?: string;
}

export function TranslationDropdown({
  value,
  onChange,
  className,
}: TranslationDropdownProps) {
  const selected = SUPPORTED_LANGUAGES.find((l) => l.code === value);

  return (
    <div className={cn("relative inline-flex items-center", className)}>
      <Globe className="pointer-events-none absolute left-3 h-4 w-4 text-muted-foreground" />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as LanguageCode)}
        aria-label="Select chat language"
        className={cn(
          "h-9 appearance-none rounded-lg border border-input bg-background",
          "pl-9 pr-8 text-sm font-medium text-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          "cursor-pointer transition-colors hover:bg-muted/50",
        )}
      >
        {SUPPORTED_LANGUAGES.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.label} — {lang.nativeLabel}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 h-4 w-4 text-muted-foreground" />
      {selected && value !== "en" && (
        <span className="ml-2 hidden text-xs text-muted-foreground sm:inline">
          Translating to {selected.nativeLabel}
        </span>
      )}
    </div>
  );
}
