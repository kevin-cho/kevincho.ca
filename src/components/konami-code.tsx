"use client";

import { useEffect } from "react";

// ↑ ↑ ↓ ↓ ← → ← → B A
const sequence = [
  "arrowup",
  "arrowup",
  "arrowdown",
  "arrowdown",
  "arrowleft",
  "arrowright",
  "arrowleft",
  "arrowright",
  "b",
  "a",
];

/** Easter egg: typing the Konami code opens the Mario item block game. Renders nothing. */
export function KonamiCode() {
  useEffect(() => {
    let index = 0;

    function handleKeyDown(e: KeyboardEvent) {
      const key = e.key.toLowerCase();
      if (key === sequence[index]) {
        index++;
      } else {
        // A wrong key can still be the start of a new attempt
        index = key === sequence[0] ? 1 : 0;
      }
      if (index === sequence.length) {
        index = 0;
        // Full page load: the game is a static file in public/, not a Next.js route
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination
        window.location.assign("/mario-item-block");
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return null;
}
