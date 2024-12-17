// MIT License

// Copyright (c) 2024 Kristian Dupont

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

/**
 * Plays a Geiger counter-like click sound
 * Optimized for render tracking with minimal changes
 */
export const playGeigerClickSound = (
  audioContext: AudioContext,
  amplitude: number,
) => {
  // Simple throttle to prevent audio overlap
  const now = performance.now();
  if (now - lastPlayTime < MIN_INTERVAL) {
    return;
  }
  lastPlayTime = now;

  // Cache currentTime for consistent timing
  const currentTime = audioContext.currentTime;
  const volume = Math.max(0.5, amplitude);
  const duration = 0.001;
  const startFrequency = 440 + amplitude * 200;

  const oscillator = audioContext.createOscillator();
  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(startFrequency, currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(
    220,
    currentTime + duration,
  );

  const gainNode = audioContext.createGain();
  gainNode.gain.setValueAtTime(volume, currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, duration / 2);

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.start();
  oscillator.stop(currentTime + duration);
};
