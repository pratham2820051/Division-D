export { VoiceRecorder } from "./VoiceRecorder";
export { VoiceVisualizer } from "./VoiceVisualizer";
export { VoicePlayer } from "./VoicePlayer";
export { VoiceControls } from "./VoiceControls";
export { VoiceMode } from "./VoiceMode";
export { VoiceStatusIndicator } from "./VoiceStatusIndicator";
export { RecordingTimer } from "./RecordingTimer";
export { VoiceInteractionExample } from "./VoiceInteractionExample";

export { useAudioRecorder } from "@/hooks/use-audio-recorder";
export { useAudioPlayer } from "@/hooks/use-audio-player";
export { useVoiceMode } from "@/hooks/use-voice-mode";

export { useVoiceInput } from "@/hooks/use-voice-input";
export { useVoiceTranscription } from "@/hooks/use-voice-transcription";
export { useVoiceOutput } from "@/hooks/use-voice-output";

export type {
  RecordingState,
  VoiceModeState,
  PermissionState,
  AudioRecorderResult,
  VoiceRecorderError,
  VoiceInteractionResult,
  VoiceControlsState,
  TranscribeResult,
  SpeakResult,
  VoiceRequestStatus,
} from "@/types/voice";
