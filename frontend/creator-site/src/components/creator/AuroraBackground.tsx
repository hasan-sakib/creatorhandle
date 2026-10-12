/**
 * Soft drifting glows in the creator's accent color, behind the page.
 * Decorative only: hidden from assistive tech, no pointer events. Motion is
 * limited to transform and is disabled for visitors who prefer reduced motion
 * (see .aurora-* in index.css).
 */
export function AuroraBackground() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-0 overflow-hidden">
      <div
        className="aurora-blob aurora-a -left-[12vmax] -top-[14vmax] size-[52vmax]"
        style={{
          background:
            "radial-gradient(circle at center, color-mix(in oklch, var(--accent-raw) 38%, transparent), transparent 68%)",
        }}
      />
      <div
        className="aurora-blob aurora-b -right-[16vmax] top-[22vh] size-[46vmax]"
        style={{
          background:
            "radial-gradient(circle at center, color-mix(in oklch, var(--accent-alt) 34%, transparent), transparent 68%)",
        }}
      />
      {/* Third glow is skipped on small screens to keep scrolling smooth */}
      <div
        className="aurora-blob aurora-c -bottom-[18vmax] left-[18vw] hidden size-[44vmax] sm:block"
        style={{
          background:
            "radial-gradient(circle at center, color-mix(in oklch, var(--accent-raw) 26%, transparent), transparent 68%)",
        }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,color-mix(in_oklch,var(--foreground)_7%,transparent)_1px,transparent_0)] [background-size:28px_28px] [mask-image:linear-gradient(to_bottom,black,transparent_70%)]" />
    </div>
  )
}
