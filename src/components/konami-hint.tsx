import Link from "next/link";
import { FaArrowDown, FaArrowLeft, FaArrowRight, FaArrowUp } from "react-icons/fa";

const arrows = [FaArrowUp, FaArrowUp, FaArrowDown, FaArrowDown, FaArrowLeft, FaArrowRight, FaArrowLeft, FaArrowRight];

/**
 * Hint for the Konami code easter egg (see KonamiCode). It's also a link to the
 * game, so it works on phones, which have no arrow keys.
 */
export function KonamiHint() {
  return (
    <Link
      href="/mario-item-block"
      aria-label="Mario item block game"
      title="↑ ↑ ↓ ↓ ← → ← → B A"
      className="flex items-center gap-1.5 rounded-md p-1 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
    >
      {arrows.map((Arrow, i) => (
        <Arrow key={i} aria-hidden className="size-3" />
      ))}
      <span aria-hidden>B</span>
      <span aria-hidden>A</span>
    </Link>
  );
}
