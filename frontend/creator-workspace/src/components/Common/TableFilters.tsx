import { Search } from "lucide-react"

import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface FilterOption {
  label: string
  value: string
}

interface TableFiltersProps {
  searchValue: string
  onSearchChange: (value: string) => void
  searchPlaceholder?: string
  filterOptions?: FilterOption[]
  filterValue?: string
  onFilterChange?: (value: string) => void
  filterPlaceholder?: string
  secondaryFilterOptions?: FilterOption[]
  secondaryFilterValue?: string
  onSecondaryFilterChange?: (value: string) => void
  secondaryFilterPlaceholder?: string
}

export function TableFilters({
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search...",
  filterOptions,
  filterValue,
  onFilterChange,
  filterPlaceholder = "Filter by status",
  secondaryFilterOptions,
  secondaryFilterValue,
  onSecondaryFilterChange,
  secondaryFilterPlaceholder = "Filter",
}: TableFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative flex-1 min-w-48">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        <Input
          className="pl-9"
          placeholder={searchPlaceholder}
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      {filterOptions && onFilterChange && filterValue !== undefined && (
        <Select value={filterValue} onValueChange={onFilterChange}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder={filterPlaceholder} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            {filterOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      {secondaryFilterOptions && onSecondaryFilterChange && secondaryFilterValue !== undefined && (
        <Select value={secondaryFilterValue} onValueChange={onSecondaryFilterChange}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder={secondaryFilterPlaceholder} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            {secondaryFilterOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  )
}
