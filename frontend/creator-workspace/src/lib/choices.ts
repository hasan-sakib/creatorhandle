// Fixed choices for workspace resources. The backend rejects anything else
// (see backend/app/models/{task,project,brand}.py); `satisfies` keeps these
// lists in step with the generated client types.
import type { BrandCreate, ProjectCreate, TaskCreate } from "@/client"

type Choice<T> = NonNullable<T>

export const TASK_STATUSES = [
  "To Do",
  "In Progress",
  "Done",
] as const satisfies readonly Choice<TaskCreate["status"]>[]

export const TASK_PRIORITIES = [
  "Low",
  "Medium",
  "High",
] as const satisfies readonly Choice<TaskCreate["priority"]>[]

export const PROJECT_TYPES = [
  "YouTube",
  "TikTok",
  "Instagram",
  "Twitch",
  "Blog",
  "Other",
] as const satisfies readonly Choice<ProjectCreate["type"]>[]

export const PROJECT_STATUSES = [
  "Planning",
  "In Progress",
  "Review",
  "Published",
  "Cancelled",
] as const satisfies readonly Choice<ProjectCreate["platform_status"]>[]

export const BRAND_STATUSES = [
  "active",
  "inactive",
] as const satisfies readonly Choice<BrandCreate["status"]>[]

export type TaskStatus = (typeof TASK_STATUSES)[number]
