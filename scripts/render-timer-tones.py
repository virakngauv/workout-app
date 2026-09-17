#!/usr/bin/env python3
"""Render the bundled soft timer tones without external audio tooling."""

import math
import struct
import wave
from pathlib import Path


SAMPLE_RATE = 44_100
OUTPUT = Path(__file__).resolve().parents[1] / "assets" / "audio"


def render(name: str, frequency: float, duration: float) -> None:
    OUTPUT.mkdir(parents=True, exist_ok=True)
    frames = []
    for index in range(round(SAMPLE_RATE * duration)):
        time = index / SAMPLE_RATE
        attack = min(1.0, time / 0.025)
        release = min(1.0, (duration - time) / 0.08)
        envelope = max(0.0, min(attack, release))
        sample = math.sin(2 * math.pi * frequency * time)
        sample += 0.12 * math.sin(2 * math.pi * frequency * 2 * time)
        frames.append(struct.pack("<h", round(32_767 * 0.2 * envelope * sample)))

    with wave.open(str(OUTPUT / name), "wb") as audio:
        audio.setnchannels(1)
        audio.setsampwidth(2)
        audio.setframerate(SAMPLE_RATE)
        audio.writeframes(b"".join(frames))


render("timer-short.wav", 659.25, 0.14)
render("timer-long.wav", 783.99, 0.7)
