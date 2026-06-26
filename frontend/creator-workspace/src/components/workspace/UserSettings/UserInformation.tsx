import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { AtSign, Camera, Globe, Mail, Music2, Pencil, Youtube } from "lucide-react"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { UsersService, type UserUpdateMe } from "@/client"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { LoadingButton } from "@/components/ui/loading-button"
import useAuth from "@/hooks/useAuth"
import useCustomToast from "@/hooks/useCustomToast"
import { cn } from "@/lib/utils"
import { handleError } from "@/utils"

const formSchema = z.object({
  full_name: z.string().max(255).optional(),
  email: z.email({ message: "Invalid email address" }),
  username: z
    .string()
    .max(30)
    .regex(/^[a-z0-9-]*$/, { message: "Only lowercase letters, numbers, and hyphens" })
    .optional()
    .or(z.literal("")),
  bio: z.string().max(300).optional().or(z.literal("")),
  website: z.string().max(255).optional().or(z.literal("")),
  twitter: z.string().max(100).optional().or(z.literal("")),
  instagram: z.string().max(100).optional().or(z.literal("")),
  youtube: z.string().max(100).optional().or(z.literal("")),
  tiktok: z.string().max(100).optional().or(z.literal("")),
  contact_email: z.string().max(255).optional().or(z.literal("")),
})

type FormData = z.infer<typeof formSchema>

const SOCIAL_FIELDS = [
  { name: "website" as const, label: "Website", Icon: Globe, placeholder: "https://yoursite.com" },
  { name: "twitter" as const, label: "X / Twitter", Icon: AtSign, placeholder: "@handle" },
  { name: "instagram" as const, label: "Instagram", Icon: Camera, placeholder: "@handle" },
  { name: "youtube" as const, label: "YouTube", Icon: Youtube, placeholder: "@channel or URL" },
  { name: "tiktok" as const, label: "TikTok", Icon: Music2, placeholder: "@handle" },
  { name: "contact_email" as const, label: "Public contact email", Icon: Mail, placeholder: "hello@yoursite.com" },
]

const UserInformation = () => {
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useCustomToast()
  const [editMode, setEditMode] = useState(false)
  const { user: currentUser } = useAuth()

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: {
      full_name: currentUser?.full_name ?? undefined,
      email: currentUser?.email,
      username: currentUser?.username ?? "",
      bio: currentUser?.bio ?? "",
      website: currentUser?.website ?? "",
      twitter: currentUser?.twitter ?? "",
      instagram: currentUser?.instagram ?? "",
      youtube: currentUser?.youtube ?? "",
      tiktok: currentUser?.tiktok ?? "",
      contact_email: (currentUser as { contact_email?: string | null })?.contact_email ?? "",
    },
  })

  const toggleEditMode = () => setEditMode(!editMode)

  const mutation = useMutation({
    mutationFn: (data: UserUpdateMe) =>
      UsersService.updateUserMe({ requestBody: data }),
    onSuccess: () => {
      showSuccessToast("Profile updated successfully")
      toggleEditMode()
    },
    onError: handleError.bind(showErrorToast),
    onSettled: () => {
      queryClient.invalidateQueries()
    },
  })

  const onSubmit = (data: FormData) => {
    const updateData: UserUpdateMe = {}

    if (data.full_name !== currentUser?.full_name) updateData.full_name = data.full_name
    if (data.email !== currentUser?.email) updateData.email = data.email
    const newUsername = data.username || null
    if (newUsername !== (currentUser?.username ?? null)) updateData.username = newUsername
    const newBio = data.bio || null
    if (newBio !== (currentUser?.bio ?? null)) updateData.bio = newBio
    const newWebsite = data.website || null
    if (newWebsite !== (currentUser?.website ?? null)) updateData.website = newWebsite
    const newTwitter = data.twitter || null
    if (newTwitter !== (currentUser?.twitter ?? null)) updateData.twitter = newTwitter
    const newInstagram = data.instagram || null
    if (newInstagram !== (currentUser?.instagram ?? null)) updateData.instagram = newInstagram
    const newYoutube = data.youtube || null
    if (newYoutube !== (currentUser?.youtube ?? null)) updateData.youtube = newYoutube
    const newTiktok = data.tiktok || null
    if (newTiktok !== (currentUser?.tiktok ?? null)) updateData.tiktok = newTiktok
    const newContactEmail = data.contact_email || null
    const currentContactEmail = (currentUser as { contact_email?: string | null })?.contact_email ?? null
    if (newContactEmail !== currentContactEmail) updateData.contact_email = newContactEmail

    mutation.mutate(updateData)
  }

  const onCancel = () => {
    form.reset()
    toggleEditMode()
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-3xl">

        {/* ── User Information card ── */}
        <section className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="flex items-start justify-between mb-6">
            <h2 className="text-lg font-semibold">User Information</h2>
            {!editMode && (
              <Button
                type="button"
                size="sm"
                className="rounded-full gap-1.5"
                onClick={toggleEditMode}
              >
                <Pencil className="w-3.5 h-3.5" />
                Edit
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="full_name"
              render={({ field }) => (
                <FormItem>
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">Full name</p>
                  {editMode ? (
                    <FormControl><Input type="text" {...field} /></FormControl>
                  ) : (
                    <p className={cn("text-base font-medium", !field.value && "text-sm text-muted-foreground italic font-normal")}>
                      {field.value || "Not set"}
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">Email</p>
                  {editMode ? (
                    <FormControl><Input type="email" {...field} /></FormControl>
                  ) : (
                    <p className="text-base font-medium truncate">{field.value}</p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">Public handle</p>
                  {editMode ? (
                    <>
                      <FormControl>
                        <Input type="text" placeholder="e.g. johndoe" {...field} />
                      </FormControl>
                      <p className="text-xs text-muted-foreground">
                        Profile: /creator/{field.value || "yourhandle"}
                      </p>
                    </>
                  ) : (
                    <p className={cn(
                      "text-base font-medium",
                      field.value ? "text-primary" : "text-sm text-muted-foreground italic font-normal",
                    )}>
                      {field.value ? `@${field.value}` : "Not set"}
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">Bio</p>
                  {editMode ? (
                    <>
                      <FormControl>
                        <textarea
                          className="flex min-h-20 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                          placeholder="Tell people about yourself..."
                          maxLength={300}
                          {...field}
                        />
                      </FormControl>
                      <p className="text-xs text-muted-foreground text-right">{(field.value ?? "").length}/300</p>
                    </>
                  ) : (
                    <p className={cn("text-sm leading-relaxed", !field.value && "text-muted-foreground italic")}>
                      {field.value || "Not set"}
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {editMode && (
            <div className="flex gap-3 mt-6 pt-5 border-t">
              <LoadingButton
                type="submit"
                loading={mutation.isPending}
                disabled={!form.formState.isDirty}
                className="rounded-full"
              >
                Save changes
              </LoadingButton>
              <Button
                type="button"
                variant="outline"
                className="rounded-full"
                onClick={onCancel}
                disabled={mutation.isPending}
              >
                Cancel
              </Button>
            </div>
          )}
        </section>

        {/* ── Social Links card ── */}
        <section className="rounded-xl border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-6">Social Links</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {SOCIAL_FIELDS.map(({ name, label, Icon, placeholder }) => (
              <FormField
                key={name}
                control={form.control}
                name={name}
                render={({ field }) => (
                  <FormItem className="flex items-start gap-3 p-4 rounded-lg bg-muted/40 border m-0">
                    <Icon className="w-5 h-5 text-muted-foreground mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1.5">{label}</p>
                      {editMode ? (
                        <FormControl>
                          <Input
                            type={name === "contact_email" ? "email" : "text"}
                            placeholder={placeholder}
                            className="h-8 text-sm"
                            {...field}
                          />
                        </FormControl>
                      ) : (
                        <p className={cn("text-sm font-medium truncate", !field.value && "text-muted-foreground italic font-normal")}>
                          {field.value || "Not set"}
                        </p>
                      )}
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />
            ))}
          </div>
        </section>

      </form>
    </Form>
  )
}

export default UserInformation
