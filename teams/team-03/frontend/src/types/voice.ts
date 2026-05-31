export type RecordingState = "idle" | "recording" | "stopped" | "processing";

export type VoiceModeState =
  | "idle"
  | "listening"
  | "processing"
  | "speaking"
  | "error";

export type PermissionState = "prompt" | "granted" | "denied" | "unsupported";

export type VoiceRequestStatus = "idle" | "loading" | "retrying" | "success" | "error";

export interface AudioRecorderResult {
  blob: Blob;
  url: string;
  duration: number;
  mimeType: string;
}

export interface VoiceRecorderError {
  code: "PERMISSION_DENIED" | "NOT_FOUND" | "NOT_SUPPORTED" | "UNKNOWN";
  message: string;
}

export interface UseAudioRecorderOptions {
  onRecordingComplete?: (result: AudioRecorderResult) => void;
  onError?: (error: VoiceRecorderError) => void;
  maxDurationSeconds?: number;
}

export interface UseAudioPlayerOptions {
  src?: string | null;
  autoPlay?: boolean;
  muted?: boolean;
  onEnded?: () => void;
}

export interface VoiceInteractionResult {
  transcription: string;
  responseText: string;
  responseAudioUrl: string | null;
}

export interface VoiceControlsState {
  voiceModeEnabled: boolean;
  aiVoiceMuted: boolean;
  language: string;
}

/** Backend POST /api/v1/voice/transcribe */
export interface TranscribeApiResponse {
  text: string;
  language: string;
  confidence: number;
  language_confidence?: number;
  provider: string;
  fallback_used: boolean;
  requested_language?: string | null;
  detected_language?: string | null;
}

/** Backend POST /api/v1/voice/speak request body */
export interface SpeakApiRequest {
  text: string;
  language: string;
}

export interface TranscribeResult {
  text: string;
  language: string;
  confidence: number;
  languageConfidence: number;
  provider: string;
  fallbackUsed: boolean;
  requestedLanguage?: string | null;
  detectedLanguage?: string | null;
}

export interface SpeakResult {
  audioBlob: Blob;
  audioUrl: string;
  durationSeconds: number;
  contentType: string;
}

export interface TranscribeAudioOptions {
  filename?: string;
  language?: string;
  retries?: number;
  timeoutMs?: number;
}

export interface SpeakTextOptions {
  language?: string;
  retries?: number;
}

export interface UseVoiceTranscriptionState {
  status: VoiceRequestStatus;
  isTranscribing: boolean;
  isRetrying: boolean;
  result: TranscribeResult | null;
  error: string | null;
  transcribe: (blob: Blob, mimeType?: string) => Promise<TranscribeResult | null>;
  retry: () => Promise<TranscribeResult | null>;
  reset: () => void;
}

export interface UseVoiceOutputState {
  status: VoiceRequestStatus;
  isLoading: boolean;
  isSpeaking: boolean;
  audioUrl: string | null;
  durationSeconds: number;
  error: string | null;
  speak: (text: string, language?: string) => Promise<SpeakResult | null>;
  retry: () => Promise<SpeakResult | null>;
  stop: () => void;
  reset: () => void;
}
