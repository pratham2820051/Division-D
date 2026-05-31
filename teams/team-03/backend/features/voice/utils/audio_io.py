"""Generate minimal valid WAV audio for mock TTS."""

import io
import math
import struct
import wave


def generate_sine_wav(
    duration_sec: float = 1.0,
    sample_rate: int = 16000,
    frequency_hz: float = 440.0,
    amplitude: float = 0.3,
) -> bytes:
    """Generate a short sine-wave WAV (placeholder until real TTS)."""
    n_samples = int(sample_rate * duration_sec)
    buffer = io.BytesIO()

    with wave.open(buffer, "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(sample_rate)

        frames = bytearray()
        for i in range(n_samples):
            sample = amplitude * math.sin(2 * math.pi * frequency_hz * i / sample_rate)
            frames.extend(struct.pack("<h", int(sample * 32767)))

        wf.writeframes(bytes(frames))

    return buffer.getvalue()
