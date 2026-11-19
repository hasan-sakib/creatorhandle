#!/usr/bin/env node
/**
 * Contrast check for the creator portfolio themes.
 *
 * Renders the real page in Chromium (API mocked, no backend needed) and, for
 * every theme x accent x light/dark combination, measures the colors the
 * browser actually resolves, then checks WCAG contrast:
 *   - text colors on page background and card:     >= 4.5
 *   - accent-colored text on background, card and
 *     on the accent tints used by chips/nav links: >= 4.5
 *   - button text on the accent fill:              >= 4.5
 *   - focus ring against background and card:      >= 3
 *
 * Usage (a site server must be running, e.g. `bun run dev` or the Docker stack):
 *   BASE_URL=http://localhost:5173 CHROME_PATH=/path/to/chrome \
 *     node scripts/check-contrast.mjs [--calibrate]
 *
 * --calibrate prints, per theme and mode, the largest --accent-text-mix (how
 * much of the accent colors accent text) that passes for ALL accents. Put the
 * result in src/styles/creator-themes.css.
 *
 * Needs the `playwright` package (installed in this workspace) and a Chromium
 * binary (CHROME_PATH; defaults to Playwright's own).
 */
import { ACCENT_PRESETS } from "@creatorhandle/shared/accents"
import { THEMES as THEME_DEFS } from "@creatorhandle/shared/themes"
import { chromium } from "playwright"

const BASE = process.env.BASE_URL ?? "http://localhost:5173"
const calibrate = process.argv.includes("--calibrate")

// Single sources of truth, shared with both apps (Node runs the TypeScript
// source directly: Node 23.6+ strips types natively).
const ACCENTS = Object.fromEntries(
  Object.entries(ACCENT_PRESETS).map(([key, { light, dark }]) => [
    key,
    { light, dark },
  ]),
)
const THEMES = Object.keys(THEME_DEFS)

const profile = (extra = {}) => ({
  username: "contrast",
  full_name: "Contrast Test",
  avatar_url: null,
  cover_image_url: null,
  headline: "Headline",
  location: "Earth",
  languages: ["English"],
  about: "About text",
  bio: null,
  niches: ["A"],
  content_formats: ["B"],
  platforms: ["YouTube"],
  services: [{ title: "S", description: "d" }],
  availability: "open",
  media_kit_url: null,
  accent_color: null,
  theme: null,
  color_mode: null,
  work_steps: [{ title: "Step", description: "d" }],
  work_principles: ["P"],
  work_tools: ["T"],
  website: null,
  twitter: null,
  instagram: null,
  youtube: null,
  tiktok: null,
  contact_email: "a@b.co",
  member_since: "2026-01-01T00:00:00Z",
  stats: { brands_count: 1, projects_count: 1 },
  brands: [],
  projects: [],
  projects_total: 0,
  ...extra,
})

const browser = await chromium.launch(
  process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {},
)
const page = await (
  await browser.newContext({ reducedMotion: "reduce" })
).newPage()
await page.route("**/api/v1/public/contrast", (r) =>
  r.fulfill({ json: profile() }),
)
await page.goto(`${BASE}/@contrast`, { waitUntil: "networkidle" })
await page.waitForSelector("[data-theme]")

// Measure inside the page: resolve any CSS color (incl. color-mix) to RGBA through a canvas.
const measure = (args) =>
  page.evaluate(({ theme, accent, mode, accents, mix }) => {
    const scope = document.querySelector("[data-theme]")
    scope.dataset.theme = theme
    scope.dataset.accent = accent
    scope.style.setProperty("--accent-light", accents[accent].light)
    scope.style.setProperty("--accent-dark", accents[accent].dark)
    if (mix == null) scope.style.removeProperty("--accent-text-mix")
    else scope.style.setProperty("--accent-text-mix", `${mix}%`)
    document.documentElement.classList.remove("light", "dark")
    document.documentElement.classList.add(mode)

    const cv = document
      .createElement("canvas")
      .getContext("2d", { willReadFrequently: true })
    cv.canvas.width = cv.canvas.height = 1
    const probe = document.createElement("div")
    scope.appendChild(probe)
    const rgba = (expr) => {
      probe.style.color = expr
      const resolved = getComputedStyle(probe).color
      cv.clearRect(0, 0, 1, 1)
      cv.fillStyle = "#000"
      cv.fillStyle = resolved
      cv.fillRect(0, 0, 1, 1)
      const d = cv.getImageData(0, 0, 1, 1).data
      return [d[0], d[1], d[2], d[3] / 255]
    }
    const out = {
      fg: rgba("var(--foreground)"),
      bg: rgba("var(--background)"),
      card: rgba("var(--card)"),
      muted: rgba("var(--muted-foreground)"),
      accentText: rgba("var(--accent-text)"),
      primary: rgba("var(--primary)"),
      primaryFg: rgba("var(--primary-foreground)"),
      ring: rgba("var(--ring)"),
      tintBg15: rgba(
        "color-mix(in oklch, var(--primary) 15%, var(--background))",
      ),
      tintCard10: rgba("color-mix(in oklch, var(--primary) 10%, var(--card))"),
    }
    probe.remove()
    return out
  }, args)

const lin = (c) => {
  const v = c / 255
  return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
}
const lum = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
const ratio = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p)
  return (x + 0.05) / (y + 0.05)
}

function checks(c) {
  return [
    ["text on background", ratio(c.fg, c.bg), 4.5],
    ["text on card", ratio(c.fg, c.card), 4.5],
    ["muted text on background", ratio(c.muted, c.bg), 4.5],
    ["muted text on card", ratio(c.muted, c.card), 4.5],
    ["accent text on background", ratio(c.accentText, c.bg), 4.5],
    ["accent text on card", ratio(c.accentText, c.card), 4.5],
    ["accent text on active-link tint", ratio(c.accentText, c.tintBg15), 4.5],
    ["accent text on chip tint", ratio(c.accentText, c.tintCard10), 4.5],
    ["button text on accent fill", ratio(c.primaryFg, c.primary), 4.5],
    ["focus ring on background", ratio(c.ring, c.bg), 3],
    ["focus ring on card", ratio(c.ring, c.card), 3],
  ]
}

let failures = 0
let total = 0
const calibration = []
for (const theme of THEMES) {
  for (const mode of ["light", "dark"]) {
    const bad = []
    for (const accent of Object.keys(ACCENTS)) {
      total++
      const c = await measure({
        theme,
        accent,
        mode,
        accents: ACCENTS,
        mix: null,
      })
      for (const [name, r, min] of checks(c))
        if (r < min) bad.push(`${accent}: ${name} ${r.toFixed(2)} < ${min}`)
    }
    if (bad.length) failures++
    console.log(
      `${bad.length ? "FAIL" : "ok  "} ${theme.padEnd(10)} ${mode.padEnd(5)} ${bad.length ? bad.length + " issue(s)" : ""}`,
    )
    for (const b of bad.slice(0, 12)) console.log(`       ${b}`)
    if (calibrate) {
      // largest mix (most accent color) at which every accent passes the accent-text checks
      let best = null
      for (let mix = 100; mix >= 30; mix -= 5) {
        let ok = true
        for (const accent of Object.keys(ACCENTS)) {
          const c = await measure({
            theme,
            accent,
            mode,
            accents: ACCENTS,
            mix,
          })
          if (
            checks(c).some(
              ([n, r, min]) => n.startsWith("accent text") && r < min,
            )
          ) {
            ok = false
            break
          }
        }
        if (ok) {
          best = mix
          break
        }
      }
      calibration.push({ theme, mode, mix: best })
    }
  }
}
if (calibrate) {
  console.log(
    "\nCalibrated --accent-text-mix (largest passing value for all 10 accents):",
  )
  for (const c of calibration)
    console.log(
      `  ${c.theme.padEnd(10)} ${c.mode.padEnd(5)} ${c.mix == null ? "NONE FOUND" : c.mix + "%"}`,
    )
}
console.log(
  failures === 0
    ? `\nALL OK (${total} theme x accent x mode combinations)`
    : `\n${failures} theme/mode group(s) below the contrast thresholds`,
)
await browser.close()
process.exit(failures === 0 ? 0 : 1)
