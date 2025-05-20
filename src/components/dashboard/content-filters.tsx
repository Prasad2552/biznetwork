import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { CalendarIcon } from 'lucide-react'
import { format } from "date-fns"

interface ContentFiltersProps {
  onDateSelect: (date: Date | undefined) => void
  onTypeFilter: (type: string) => void
  selectedDate?: Date
}

export function ContentFilters({ onDateSelect, onTypeFilter, selectedDate }: ContentFiltersProps) {
  return (
    <div className="flex items-center gap-4 mb-6">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-[240px] justify-start text-left font-normal">
            <CalendarIcon className="mr-2 h-4 w-4" />
            {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={onDateSelect}
            initialFocus
          />
        </PopoverContent>
      </Popover>
      <div className="flex gap-2">
        <Button variant="outline" onClick={() => onTypeFilter('all')}>
          All
        </Button>
        <Button variant="outline" onClick={() => onTypeFilter('video')}>
          Videos
        </Button>
        <Button variant="outline" onClick={() => onTypeFilter('blog')}>
          Blogs
        </Button>
        <Button variant="outline" onClick={() => onTypeFilter('document')}>
          Documents
        </Button>
      </div>
    </div>
  )
}
