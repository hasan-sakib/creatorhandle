# Portfolio template and themes

Every public profile (`/@username`) uses **one fixed template**. Creators change the
content from the dashboard (Settings > Portfolio) and pick a **theme**; they never
change the structure.

## Structure (identical for everyone)

| id | Nav label | Content |
|---|---|---|
| `home` | Home | Cover, avatar, name, headline, location, languages, availability, socials, stats, CTA |
| `about` | About | About text and a "What I make" row (topics, formats, platforms) |
| `approach` | Approach | Work style: process steps, principles, tools |
| `services` | Services | Work list (the `services` field) |
| `work` | Work | Previous work (Published projects) |
| `brands` | Brands | Brands tied to published projects |
| `contact` | Contact | Contact and media kit |

The navbar and the section list are constants (`components/creator/sections.ts`).
An empty section shows a friendly placeholder; the owner also sees an "Add this in
Settings" link. Legacy `#create` links map to `#about`.

## Themes

`studio` (default), `editorial`, `aurora`, `bold`, `soft`, `mono`. A theme changes colors,
font, corner style, card treatment and background effect, never the markup. Components use
semantic utilities (`surface`, `eyebrow`, `heading`, `rounded-card/-inner/-tile/-pill/-avatar`,
`text-accent-text`) and must not check the theme name (`theme ===`).

Themes are defined in `frontend/creator-site/src/styles/creator-themes.css` as
`[data-theme="x"]` (light) and `.dark [data-theme="x"]` blocks. Themes set surface tokens,
radii, `--surface-*`, `--theme-font-*`, heading and eyebrow style, background layer strengths
and `--accent-text-mix`. They never set `--primary`, `--ring` or `--accent-*`: the creator's
accent (or the theme's default accent when unset) composes on top.

### Light/dark precedence

1. The visitor's own toggle (`ch-profile-mode`, written only by the profile page)
2. The creator's `color_mode` (null/`system` = skip)
3. The visitor's device

The dashboard's `vite-ui-theme` and the landing page are not affected.

### Add a theme

1. Add the light and `.dark` blocks to `creator-themes.css`.
2. Add it to `THEMES` and `FONT_LOADERS` in `creator-site/src/lib/themes.ts` (install the
   `@fontsource-variable/<font>` package; the font is lazy-loaded).
3. Add the swatch to `creator-workspace/src/lib/themePresets.ts`.
4. Add the key to `ThemeKey` in `backend/app/core/validators.py` and `_THEMES` in
   `backend/app/api/routes/public.py`.
5. Regenerate the clients (`bun run generate-client`).
6. Calibrate and check contrast: `bun run test:contrast` in `frontend/creator-site`
   (`-- --calibrate` suggests `--accent-text-mix`). It checks every theme x 10 accents x 2 modes.
7. Screenshot light and dark at 1280 and 390 px.

### Caching

The public response is cacheable for 30 s, so a saved theme can take up to a minute to appear.
The page caches `{theme, mode}` per username (`ch-profile-look:<user>`) so repeat visitors
get the right mode before first paint.
