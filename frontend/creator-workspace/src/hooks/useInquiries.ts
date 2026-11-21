import { useQuery } from "@tanstack/react-query"

import { InquiriesService, type InquiryPublic } from "@/client"

export type InquiryStatus = InquiryPublic["status"]

/** Inquiries belong to the signed-in person, not a workspace. */
export const inquiriesQueryKey = ["inquiries"] as const

export function inquiriesQueryOptions(status?: InquiryStatus) {
  return {
    queryKey: [...inquiriesQueryKey, status ?? "all"],
    queryFn: () =>
      InquiriesService.readInquiries({ status, skip: 0, limit: 100 }),
  }
}

/** Unread count for the sidebar badge; refreshed every minute. */
export function useUnreadInquiries(): number {
  const { data } = useQuery({
    ...inquiriesQueryOptions("new"),
    refetchInterval: 60_000,
  })
  return data?.unread_count ?? 0
}
