/**
 * Decorative background behind the page: drifting glows in the creator's
 * accent color, a grid, and an optional paper grain. The DOM is the same for
 * every theme; themes only change how visible each layer is (see the
 * --bg-* tokens in styles/creator-themes.css). Hidden from assistive tech, no
 * pointer events. Motion is limited to transform and is disabled for visitors
 * who prefer reduced motion (see .aurora-* in index.css).
 */
const GRAIN =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.8' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 .55 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")"

export function PageBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-0 overflow-hidden"
    >
      <div
        className="absolute inset-0"
        style={{ opacity: "var(--bg-blobs-opacity, 1)" }}
      >
        <div
          className="aurora-blob aurora-a -left-[12vmax] -top-[14vmax] size-[52vmax]"
          style={{
            background:
              "radial-gradient(circle at center, color-mix(in oklch, var(--accent-raw) calc(38% * var(--bg-blob-strength, 1)), transparent), transparent 68%)",
          }}
        />
        <div
          className="aurora-blob aurora-b -right-[16vmax] top-[22vh] size-[46vmax]"
          style={{
            background:
              "radial-gradient(circle at center, color-mix(in oklch, var(--accent-alt) calc(34% * var(--bg-blob-strength, 1)), transparent), transparent 68%)",
          }}
        />
        {/* Third glow is skipped on small screens to keep scrolling smooth */}
        <div
          className="aurora-blob aurora-c -bottom-[18vmax] left-[18vw] hidden size-[44vmax] sm:block"
          style={{
            background:
              "radial-gradient(circle at center, color-mix(in oklch, var(--accent-raw) calc(26% * var(--bg-blob-strength, 1)), transparent), transparent 68%)",
          }}
        />
      </div>
      <div
        className="absolute inset-0 [mask-image:linear-gradient(to_bottom,black,transparent_70%)]"
        style={{
          opacity: "var(--bg-grid-opacity, 1)",
          backgroundImage:
            "var(--bg-grid-image, radial-gradient(circle at 1px 1px, color-mix(in oklch, var(--foreground) 7%, transparent) 1px, transparent 0))",
          backgroundSize: "var(--bg-grid-size, 28px 28px)",
        }}
      />
      <div
        className="absolute inset-0 mix-blend-multiply dark:invert dark:mix-blend-screen"
        style={{
          opacity: "var(--bg-noise-opacity, 0)",
          backgroundImage: GRAIN,
        }}
      />
    </div>
  )
}
