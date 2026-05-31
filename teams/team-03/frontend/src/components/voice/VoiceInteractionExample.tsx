"use client";

/**
 * Example usage of the full voice interaction system.
 * Drop into any page or integrate into ChatInterface.
 */
import { useState } from "react";

import { VoiceMode } from "@/components/voice/VoiceMode";
import { VoiceRecorder } from "@/components/voice/VoiceRecorder";
import type { LanguageCode } from "@/types/translation";

export function VoiceInteractionExample() {
  const [language] = useState<LanguageCode>("en");
  const [lastTranscript, setLastTranscript] = useState("");

  return (
    <div className="mx-auto grid max-w-4xl gap-6 p-4 md:grid-cols-2 md:p-6">
      <section>
        <h2 className="mb-3 text-lg font-semibold">Voice Mode (ChatGPT-style)</h2>
        <VoiceMode
          language={language}
          onTranscription={setLastTranscript}
        />
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="mb-3 text-lg font-semibold">Standalone Recorder</h2>
          <VoiceRecorder
            onTranscription={setLastTranscript}
            onRecordingComplete={(result) => {
              console.log("Recording complete:", result.duration, "seconds");
            }}
          />
        </div>

        {lastTranscript && (
          <div className="rounded-xl border bg-muted/30 p-4 text-sm">
            <p className="mb-2 font-medium">Last transcription</p>
            <p className="text-muted-foreground">
              <span className="font-medium text-foreground">You: </span>
              {lastTranscript}
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
