"use client";

import { Camera, ImageIcon, Sparkles } from "lucide-react";
import { useId, useRef, useState, type KeyboardEvent } from "react";
import { useDictionary } from "@/components/i18n-provider";
import { CameraPanel } from "./camera-panel";
import { ImagePanel } from "./image-panel";
import { GeneratorPanel } from "@/components/generator/generator-panel";
import { SoundToggle } from "./sound-toggle";

type Tab = "camera" | "image" | "generate";

const tabs: Tab[] = ["camera", "image", "generate"];
const icons = { camera: Camera, image: ImageIcon, generate: Sparkles };

export function Scanner() {
  const dict = useDictionary();
  const id = useId();
  const [active, setActive] = useState<Tab>("camera");
  const tabRefs = useRef<Record<Tab, HTMLButtonElement | null>>({
    camera: null,
    image: null,
    generate: null,
  });

  const tabId = (tab: Tab) => `${id}-tab-${tab}`;
  const panelId = (tab: Tab) => `${id}-panel-${tab}`;

  function select(tab: Tab) {
    setActive(tab);
    tabRefs.current[tab]?.focus();
  }

  // WAI-ARIA tabs: arrow keys move between tabs and activate them.
  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const index = tabs.indexOf(active);
    const last = tabs.length - 1;
    const next = {
      ArrowRight: index === last ? 0 : index + 1,
      ArrowLeft: index === 0 ? last : index - 1,
      Home: 0,
      End: last,
    }[event.key];
    if (next === undefined) return;
    event.preventDefault();
    select(tabs[next]);
  }

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <div
          role="tablist"
          aria-label={dict.scanner.tabs.label}
          onKeyDown={onKeyDown}
          className="grid flex-1 grid-cols-3 rounded-full border border-line bg-surface p-1 sm:flex-none"
        >
          {tabs.map((tab) => {
            const Icon = icons[tab];
            const selected = tab === active;
            return (
              <button
                key={tab}
                ref={(node) => {
                  tabRefs.current[tab] = node;
                }}
                type="button"
                role="tab"
                id={tabId(tab)}
                aria-selected={selected}
                // The inactive panel is not in the DOM, so only the active tab points to one.
                aria-controls={selected ? panelId(tab) : undefined}
                tabIndex={selected ? 0 : -1}
                onClick={() => setActive(tab)}
                className={`inline-flex h-10 items-center justify-center gap-2 rounded-full px-5 text-sm font-medium ${
                  selected
                    ? "bg-foreground text-background"
                    : "text-muted hover:text-foreground"
                }`}
              >
                <Icon aria-hidden="true" className="size-4" />
                {dict.scanner.tabs[tab]}
              </button>
            );
          })}
        </div>
        <div className="ml-auto">
          <SoundToggle />
        </div>
      </div>
      {/* Only the active panel is mounted, so leaving Camera unmounts it
          and stops the camera. */}
      <div
        key={active}
        role="tabpanel"
        id={panelId(active)}
        aria-labelledby={tabId(active)}
        className="rounded-2xl border border-line bg-surface p-3 sm:p-4"
      >
        {active === "camera" ? (
          <CameraPanel onUseImage={() => select("image")} />
        ) : active === "image" ? (
          <ImagePanel />
        ) : (
          <GeneratorPanel />
        )}
      </div>
    </section>
  );
}
