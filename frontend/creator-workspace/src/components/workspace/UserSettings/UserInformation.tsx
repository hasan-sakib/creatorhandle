import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
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
  FormLabel,
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
})

type FormData = z.infer<typeof formSchema>

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

    mutation.mutate(updateData)
  }

  const onCancel = () => {
    form.reset()
    toggleEditMode()
  }

  function viewField(label: string, value: string | null | undefined, prefix?: string) {
    return (
      <div>
        <p className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 mb-2">{label}</p>
        <p className={cn("py-2 truncate max-w-sm text-sm", !value && "text-muted-foreground italic")}>
          {value ? (prefix ? `${prefix}${value}` : value) : "Not set"}
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-md">
      <h3 className="text-lg font-semibold py-4">User Information</h3>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <FormField
            control={form.control}
            name="full_name"
            render={({ field }) =>
              editMode ? (
                <FormItem>
                  <FormLabel>Full name</FormLabel>
                  <FormControl><Input type="text" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              ) : viewField("Full name", field.value)
            }
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) =>
              editMode ? (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl><Input type="email" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              ) : (
                <div>
                  <p className="text-sm font-medium mb-2">Email</p>
                  <p className="py-2 truncate max-w-sm text-sm">{field.value}</p>
                </div>
              )
            }
          />

          <FormField
            control={form.control}
            name="username"
            render={({ field }) =>
              editMode ? (
                <FormItem>
                  <FormLabel>Public handle</FormLabel>
                  <FormControl>
                    <Input type="text" placeholder="e.g. johndoe" {...field} />
                  </FormControl>
                  <FormMessage />
                  <p className="text-xs text-muted-foreground">
                    Your profile will be at /creator/{field.value || "yourhandle"}
                  </p>
                </FormItem>
              ) : viewField("Public handle", field.value ? `@${field.value}` : null)
            }
          />

          <FormField
            control={form.control}
            name="bio"
            render={({ field }) =>
              editMode ? (
                <FormItem>
                  <FormLabel>Bio</FormLabel>
                  <FormControl>
                    <textarea
                      className="flex min-h-20 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                      placeholder="Tell people about yourself..."
                      maxLength={300}
                      {...field}
                    />
                  </FormControl>
                  <p className="text-xs text-muted-foreground text-right">{(field.value ?? "").length}/300</p>
                  <FormMessage />
                </FormItem>
              ) : viewField("Bio", field.value)
            }
          />

          <div className="pt-2">
            <p className="text-sm font-semibold mb-3">Social Links</p>
            <div className="flex flex-col gap-4">
              <FormField
                control={form.control}
                name="website"
                render={({ field }) =>
                  editMode ? (
                    <FormItem>
                      <FormLabel>Website</FormLabel>
                      <FormControl><Input type="text" placeholder="https://yoursite.com" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  ) : viewField("Website", field.value)
                }
              />
              <FormField
                control={form.control}
                name="twitter"
                render={({ field }) =>
                  editMode ? (
                    <FormItem>
                      <FormLabel>X / Twitter</FormLabel>
                      <FormControl><Input type="text" placeholder="@handle" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  ) : viewField("X / Twitter", field.value, "@")
                }
              />
              <FormField
                control={form.control}
                name="instagram"
                render={({ field }) =>
                  editMode ? (
                    <FormItem>
                      <FormLabel>Instagram</FormLabel>
                      <FormControl><Input type="text" placeholder="@handle" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  ) : viewField("Instagram", field.value, "@")
                }
              />
              <FormField
                control={form.control}
                name="youtube"
                render={({ field }) =>
                  editMode ? (
                    <FormItem>
                      <FormLabel>YouTube</FormLabel>
                      <FormControl><Input type="text" placeholder="@channel or URL" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  ) : viewField("YouTube", field.value)
                }
              />
              <FormField
                control={form.control}
                name="tiktok"
                render={({ field }) =>
                  editMode ? (
                    <FormItem>
                      <FormLabel>TikTok</FormLabel>
                      <FormControl><Input type="text" placeholder="@handle" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  ) : viewField("TikTok", field.value, "@")
                }
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            {editMode ? (
              <>
                <LoadingButton
                  type="submit"
                  loading={mutation.isPending}
                  disabled={!form.formState.isDirty}
                >
                  Save
                </LoadingButton>
                <Button type="button" variant="outline" onClick={onCancel} disabled={mutation.isPending}>
                  Cancel
                </Button>
              </>
            ) : (
              <Button type="button" onClick={toggleEditMode}>
                Edit
              </Button>
            )}
          </div>
        </form>
      </Form>
    </div>
  )
}

export default UserInformation
