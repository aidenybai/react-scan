// MIT License
// Copyright (c) 2024 Kristian Dupont

import { isFirefox, readLocalStorage } from './helpers';

// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:

// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

// Taken from: https://github.com/kristiandupont/react-geiger/blob/main/src/Geiger.tsx

// Simple throttle for high-frequency calls
let lastPlayTime = 0;
const MIN_INTERVAL = 32; // ~30fps throttle

// Pre-calculate common values
const BASE_VOLUME = 0.5;
const FREQ_MULTIPLIER = 200;
const DEFAULT_VOLUME = 0.5;

// Ensure volume is between 0 and 1
const storedVolume = Math.max(
  0,
  Math.min(1, readLocalStorage<number>('react-scan-volume') ?? DEFAULT_VOLUME),
);

// Audio configurations for different browsers
const config = {
  firefox: {
    duration: 0.02,
    oscillatorType: 'sine' as const,
    startFreq: 220,
    endFreq: 110,
    attack: 0.0005,
    volumeMultiplier: storedVolume,
  },
  default: {
    duration: 0.001,
    oscillatorType: 'sine' as const,
    startFreq: 440,
    endFreq: 220,
    attack: 0.0005,
    volumeMultiplier: storedVolume,
  },
} as const; // Make entire config readonly

// Cache the selected config
const audioConfig = isFirefox ? config.firefox : config.default;

/**
 * Plays a Geiger counter-like click sound
 * Cross-browser compatible version (Firefox, Chrome, Safari)
 */
export const playGeigerClickSound = (
  audioContext: AudioContext,
  amplitude: number,
) => {
  const now = performance.now();
  if (now - lastPlayTime < MIN_INTERVAL) {
    return;
  }
  lastPlayTime = now;

  // Cache currentTime for consistent timing
  const currentTime = audioContext.currentTime;
  const { duration, oscillatorType, startFreq, endFreq, attack } = audioConfig;

  // Pre-calculate volume once
  const volume =
    Math.max(BASE_VOLUME, amplitude) * audioConfig.volumeMultiplier;

  // Create and configure nodes in one go
  const oscillator = new OscillatorNode(audioContext, {
    type: oscillatorType,
    frequency: startFreq + amplitude * FREQ_MULTIPLIER,
  });

  const gainNode = new GainNode(audioContext, {
    gain: 0,
  });

  // Schedule all parameters
  oscillator.frequency.exponentialRampToValueAtTime(
    endFreq,
    currentTime + duration,
  );
  gainNode.gain.linearRampToValueAtTime(volume, currentTime + attack);

  // Connect and schedule playback
  oscillator.connect(gainNode).connect(audioContext.destination);

  oscillator.start(currentTime);
  oscillator.stop(currentTime + duration);
};
