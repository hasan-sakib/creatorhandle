import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

import type { UserPublic, UserUpdateMe } from "@/client"
import { ImageField } from "@/components/ui/image-field"
import { AccentPicker } from "@/components/workspace/UserSettings/AccentPicker"
import {
  ColorModeControl,
  ThemePicker,
} from "@/components/workspace/UserSettings/ThemePicker"
import { blankToNull, imageField } from "@/lib/profileFields"
import {
  type ColorMode,
  DEFAULT_THEME,
  THEME_KEYS,
  THEME_PRESETS,
  type ThemeKey,
} from "@/lib/themePresets"
import type { AccentKey } from "@/providers/accent-color-provider"
import { Field, Section, useSaveProfile } from "./shared"

// ─── Look & feel ────────────────────────────────────────────────────────────

const isThemeKey = (v: string | null | undefined): v is ThemeKey =>
  !!v && (THEME_KEYS as string[]).includes(v)

const lookSchema = z.object({
  cover_image_url: imageField,
  avatar_url: imageField,
  theme: z.enum(THEME_KEYS as [ThemeKey, ...ThemeKey[]]),
  accent_color: z.string(), // "" = match the theme's accent
  color_mode: z.enum(["system", "light", "dark"]),
})
type LookData = z.infer<typeof lookSchema>

export function LookCard({ user }: { user: UserPublic }) {
  const save = useSaveProfile()
  const savedTheme: ThemeKey = isThemeKey(user.theme)
    ? user.theme
    : DEFAULT_THEME
  const savedMode: ColorMode =
    user.color_mode === "light" || user.color_mode === "dark"
      ? user.color_mode
      : "system"
  const form = useForm<LookData>({
    resolver: zodResolver(lookSchema),
    mode: "onBlur",
    values: {
      cover_image_url: user.cover_image_url ?? "",
      avatar_url: user.avatar_url ?? "",
      theme: savedTheme,
      accent_color: user.accent_color ?? "",
      color_mode: savedMode,
    },
  })
  const { errors } = form.formState
  const cover = form.watch("cover_image_url")
  const avatar = form.watch("avatar_url")
  const theme = form.watch("theme")
  const accentValue = form.watch("accent_color")
  const mode = form.watch("color_mode")
  const themeAccent = THEME_PRESETS[theme].defaultAccent
  const effectiveAccent = (accentValue || themeAccent) as AccentKey

  const onSubmit = form.handleSubmit((d) => {
    const patch: UserUpdateMe = {}
    if (blankToNull(d.cover_image_url) !== (user.cover_image_url ?? null))
      patch.cover_image_url = blankToNull(d.cover_image_url)
    if (blankToNull(d.avatar_url) !== (user.avatar_url ?? null))
      patch.avatar_url = blankToNull(d.avatar_url)
    if (d.theme !== savedTheme) patch.theme = d.theme
    const accent = (d.accent_color || null) as UserUpdateMe["accent_color"]
    if (accent !== (user.accent_color ?? null)) patch.accent_color = accent
    if (d.color_mode !== savedMode)
      patch.color_mode = d.color_mode === "system" ? null : d.color_mode
    save.mutate(patch)
  })

  return (
    <Section
      id="card-look"
      title="Look & feel"
      description="Pick a theme for your page. Themes change colors, fonts and corner style, never the layout: every page has the same sections."
      form={form}
      saving={save.isPending}
      onSubmit={onSubmit}
    >
      <div className="space-y-2">
        <p className="text-sm font-medium" id="theme-label">
          Theme
        </p>
        <ThemePicker
          label="Theme"
          value={theme}
          accent={effectiveAccent}
          mode={mode as ColorMode}
          onChange={(k) => form.setValue("theme", k, { shouldDirty: true })}
        />
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium">Accent color</p>
        <AccentPicker
          label="Accent color"
          matchTheme={themeAccent}
          value={(accentValue || null) as AccentKey | null}
          onChange={(k) =>
            form.setValue("accent_color", k ?? "", { shouldDirty: true })
          }
        />
        <p className="text-xs text-muted-foreground">
          Used for buttons, links and the glow. “Auto” uses the theme's own
          accent.
        </p>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium">Light or dark</p>
        <ColorModeControl
          label="Default light or dark mode"
          value={mode as ColorMode}
          onChange={(m) =>
            form.setValue("color_mode", m, { shouldDirty: true })
          }
        />
        <p className="text-xs text-muted-foreground">
          The mode your page starts in. Visitors can still switch with the
          toggle in the menu.
        </p>
      </div>

      <Field
        label="Cover image"
        hint="Wide image at the top of your page. Around 1600×600 works well."
        error={errors.cover_image_url?.message}
      >
        <ImageField
          kind="cover"
          label="Cover image"
          value={cover}
          onChange={(v) =>
            form.setValue("cover_image_url", v, {
              shouldDirty: true,
              shouldValidate: true,
            })
          }
          previewClassName="aspect-[8/3] w-56"
        />
      </Field>

      <Field
        label="Profile photo"
        hint="A square photo of you or your logo. The theme decides its corner shape."
        error={errors.avatar_url?.message}
      >
        <ImageField
          kind="avatar"
          label="Profile photo"
          value={avatar}
          onChange={(v) =>
            form.setValue("avatar_url", v, {
              shouldDirty: true,
              shouldValidate: true,
            })
          }
          previewClassName="size-24 rounded-full"
        />
      </Field>
    </Section>
  )
}
