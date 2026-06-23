import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { type TaskPublic, ProjectsService, TasksService } from "@/client"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import useCustomToast from "@/hooks/useCustomToast"
import { handleError } from "@/utils"

const formSchema = z.object({
  title: z.string().min(1, { message: "Title is required" }),
  status: z.string().optional(),
  priority: z.string().optional(),
  due_date: z.string().optional(),
  description: z.string().optional(),
  project_id: z.string().nullable().optional(),
})

type FormData = z.infer<typeof formSchema>

interface TaskEditDialogProps {
  task: TaskPublic
  open: boolean
  onOpenChange: (open: boolean) => void
}

const STATUSES = ["To Do", "In Progress", "Done"]
const PRIORITIES = ["Low", "Medium", "High"]

export function TaskEditDialog({ task, open, onOpenChange }: TaskEditDialogProps) {
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useCustomToast()

  const { data: projectsData } = useQuery({
    queryKey: ["projects"],
    queryFn: () => ProjectsService.readProjects({ skip: 0, limit: 100 }),
    enabled: open,
  })

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: {
      title: task.title,
      status: task.status ?? "To Do",
      priority: task.priority ?? "Medium",
      due_date: task.due_date ?? "",
      description: task.description ?? "",
      project_id: task.project_id ?? null,
    },
  })

  const mutation = useMutation({
    mutationFn: (data: FormData) =>
      TasksService.updateTask({
        id: task.id,
        requestBody: {
          title: data.title,
          status: data.status || undefined,
          priority: data.priority || undefined,
          due_date: data.due_date || undefined,
          description: data.description || undefined,
          project_id: data.project_id || null,
        },
      }),
    onSuccess: () => {
      showSuccessToast("Task updated successfully")
      onOpenChange(false)
    },
    onError: handleError.bind(showErrorToast),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] })
    },
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <Form {...form}>
          <form onSubmit={form.handleSubmit((d) => mutation.mutate(d))}>
            <DialogHeader>
              <DialogTitle>Edit Task</DialogTitle>
              <DialogDescription>Update the task details below.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <Input placeholder="Task title" type="text" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Select priority" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {PRIORITIES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="due_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Due Date</FormLabel>
                    <FormControl><Input type="date" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="project_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project</FormLabel>
                    <Select
                      onValueChange={(v) => field.onChange(v === "__none__" ? null : v)}
                      value={field.value ?? "__none__"}
                    >
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Link to a project (optional)" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="__none__">None</SelectItem>
                        {projectsData?.data.map((p) => (
                          <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Input placeholder="Task description" type="text" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline" disabled={mutation.isPending}>Cancel</Button>
              </DialogClose>
              <LoadingButton type="submit" loading={mutation.isPending}>Save</LoadingButton>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
