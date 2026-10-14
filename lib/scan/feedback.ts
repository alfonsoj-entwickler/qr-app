export const SOUND_STORAGE_KEY = "qrvault-sound";

// Sound preference store backed by localStorage, muted by default. If storage
// throws (private mode, blocked site data) the choice lives in memory for this
// page only.
let memorySoundOn = false;
const listeners = new Set<() => void>();

export function readSoundOn(): boolean {
  try {
    return localStorage.getItem(SOUND_STORAGE_KEY) === "on";
  } catch {
    return memorySoundOn;
  }
}

export function writeSoundOn(on: boolean) {
  memorySoundOn = on;
  try {
    localStorage.setItem(SOUND_STORAGE_KEY, on ? "on" : "off");
  } catch {}
  listeners.forEach((listener) => listener());
}

export function subscribeSound(listener: () => void) {
  listeners.add(listener);
  // Keep tabs in sync when another tab changes the preference.
  const onStorage = (event: StorageEvent) => {
    if (event.key === SOUND_STORAGE_KEY) listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

let audioContext: AudioContext | null = null;

// Creates or resumes the AudioContext. Call it from a user gesture so the
// autoplay policy lets the beep play later, outside of a gesture.
export function unlockAudio() {
  try {
    audioContext ??= new AudioContext();
    if (audioContext.state === "suspended") void audioContext.resume();
  } catch {}
}

function beep(context: AudioContext) {
  const duration = 0.12;
  const start = context.currentTime;
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = "sine";
  oscillator.frequency.value = 880;
  // Short fade in and out to avoid clicks at the edges.
  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(0.2, start + 0.01);
  gain.gain.linearRampToValueAtTime(0, start + duration);
  oscillator.connect(gain).connect(context.destination);
  oscillator.start(start);
  oscillator.stop(start + duration);
}

// Vibrates whenever the device supports it; beeps only when sound is on.
// Failures are ignored: feedback must never break a successful read.
export function playSuccessFeedback(soundOn: boolean) {
  try {
    navigator.vibrate?.(100);
  } catch {}
  if (!soundOn) return;
  try {
    unlockAudio();
    if (audioContext) beep(audioContext);
  } catch {}
}
