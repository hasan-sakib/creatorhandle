import type { Control, FieldValues } from "react-hook-form"

import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { TagInput } from "@/components/ui/tag-input"

/**
 * Fields that only matter for the public portfolio: link to the live piece,
 * a thumbnail, and tags. Shared by the Add and Edit project dialogs.
 * The form's values must include live_url, thumbnail_url (strings) and tags (string[]).
 */
// biome-ignore lint/suspicious/noExplicitAny: shared by two forms with different value types
export function ProjectPortfolioFields({ control }: { control: Control<any> }) {
  return (
    <>
      <FormField
        control={control as Control<FieldValues>}
        name="live_url"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Link to the live piece</FormLabel>
            <FormControl>
              <Input inputMode="url" placeholder="https://youtube.com/watch?v=…" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control as Control<FieldValues>}
        name="thumbnail_url"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Thumbnail image link</FormLabel>
            <FormControl>
              <Input inputMode="url" placeholder="https://…/thumbnail.jpg" {...field} />
            </FormControl>
            {field.value ? (
              <img
                src={field.value}
                alt="Thumbnail preview"
                loading="lazy"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  e.currentTarget.style.display = "none"
                }}
                className="mt-2 aspect-video w-40 rounded-md border object-cover"
              />
            ) : null}
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control as Control<FieldValues>}
        name="tags"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Tags</FormLabel>
            <TagInput
              label="Project tags"
              value={field.value ?? []}
              onChange={field.onChange}
              max={6}
              placeholder="e.g. Review, Sponsored"
            />
            <FormDescription>Shown on your public page. Up to 6.</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  )
}
