"use client";

import { Volume2, VolumeX } from "lucide-react";
import { useSyncExternalStore } from "react";
import { useDictionary } from "@/components/i18n-provider";
import {
  readSoundOn,
  subscribeSound,
  unlockAudio,
  writeSoundOn,
} from "@/lib/scan/feedback";

export function SoundToggle() {
  const dict = useDictionary();
  // The server (and hydration) render muted; React then switches to the
  // stored value without a hydration mismatch.
  const soundOn = useSyncExternalStore(
    subscribeSound,
    readSoundOn,
    () => false,
  );
  const Icon = soundOn ? Volume2 : VolumeX;

  function toggle() {
    // Turning sound on is a user gesture, so unlock audio for later beeps.
    if (!soundOn) unlockAudio();
    writeSoundOn(!soundOn);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      // Toggle buttons keep a fixed label; aria-pressed carries the state.
      aria-label={dict.scanner.sound.label}
      aria-pressed={soundOn}
      title={dict.scanner.sound.label}
      className="inline-flex size-11 items-center justify-center rounded-full text-muted hover:bg-surface hover:text-foreground aria-pressed:text-foreground"
    >
      <Icon aria-hidden="true" className="size-5" />
    </button>
  );
}
