"use client"

import {
  Calendar as AriaCalendar,
  CalendarGrid,
  CalendarCell,
  CalendarGridHeader,
  CalendarHeaderCell,
  CalendarGridBody,
  Heading,
  CalendarProps,
  DateValue,
} from "react-aria-components"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

function Calendar<T extends DateValue>({
  className,
  ...props
}: CalendarProps<T> & { className?: string }) {
  return (
    <AriaCalendar {...props} className={cn("w-fit", className)}>
      <header className="flex items-center justify-between pb-4">
        <Button
          variant="outline"
          size="icon"
          slot="previous"
          className="h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Heading className="text-sm font-medium" />
        <Button
          variant="outline"
          size="icon"
          slot="next"
          className="h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </header>
      <CalendarGrid className="w-full border-collapse space-y-1">
        <CalendarGridHeader>
          {(day) => (
            <CalendarHeaderCell className="w-9 rounded-md text-[0.8rem] font-normal text-muted-foreground">
              {day}
            </CalendarHeaderCell>
          )}
        </CalendarGridHeader>
        <CalendarGridBody>
          {(date) => (
            <CalendarCell
              date={date}
              className="h-9 w-9 cursor-pointer rounded-md p-0 text-center text-sm outline-none ring-primary-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 selected:bg-primary selected:text-primary-foreground hover:bg-accent hover:text-accent-foreground pressed:bg-primary pressed:text-primary-foreground aria-selected:opacity-100 data-[disabled]:text-muted-foreground data-[disabled]:opacity-50 data-[unavailable]:text-muted-foreground data-[unavailable]:line-through"
            />
          )}
        </CalendarGridBody>
      </CalendarGrid>
    </AriaCalendar>
  )
}

export { Calendar }
