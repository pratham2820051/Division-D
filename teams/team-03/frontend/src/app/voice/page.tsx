import { VoiceInteractionExample } from "@/components/voice/VoiceInteractionExample";

export default function VoiceDemoPage() {
  return (
    <main className="min-h-screen bg-background py-8">
      <div className="mb-6 px-4 text-center">
        <h1 className="text-2xl font-bold">Voice Interaction Demo</h1>
        <p className="text-sm text-muted-foreground">
          Production-ready voice UI connected to the backend API
        </p>
      </div>
      <VoiceInteractionExample />
    </main>
  );
}
