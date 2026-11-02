import type { Metadata } from "next";
import Link from "next/link";
import { FaArrowLeft } from "react-icons/fa";

export const metadata: Metadata = {
  title: "Mario Item Block · Kevin Cho",
  description: "Make Mario jump and hit the item block",
};

export default function MarioItemBlock() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-16">
      <Link
        href="/"
        aria-label="Back to home"
        title="Back to home"
        className="absolute top-4 left-4 flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-current"
      >
        <FaArrowLeft aria-hidden className="size-4" />
      </Link>
      {/* The game is a static page in public/ (git submodule). Its assets use
          relative paths, so it has to load from its own folder; an iframe
          keeps this page's URL as /mario-item-block. Sized to the 150×250 game
          plus the page's default 8px body margin. color-scheme matches the
          game page's (light), so in dark mode the browser keeps the iframe's
          background transparent instead of painting it white. */}
      <iframe
        src="/mario-item-block/index.html"
        title="Mario item block game"
        width={166}
        height={266}
        className="border-0 scheme-light"
      />
      <p className="text-sm text-muted-foreground">Click to jump</p>
    </main>
  );
}
