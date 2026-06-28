"use client";

import * as React from "react";
import { format } from "date-fns";
import type { DayButton } from "react-day-picker";
import type { Task } from "@/lib/types";
import { getEventDotsForDay } from "@/lib/tasks/category-colors";
import { cn } from "@/lib/utils";
import { Calendar, CalendarDayButton } from "@/components/ui/calendar";

type AgendaCalendarProps = Extract<
  React.ComponentProps<typeof Calendar>,
  { mode: "single" }
> & {
  eventsByDate: Map<string, Task[]>;
};

function AgendaDayButton({
  eventsByDate,
  ...props
}: React.ComponentProps<typeof DayButton> & {
  eventsByDate: Map<string, Task[]>;
}) {
  const dateKey = format(props.day.date, "yyyy-MM-dd");
  const dayEvents = eventsByDate.get(dateKey) ?? [];
  const { dots, overflow } = getEventDotsForDay(dayEvents);

  return (
    <CalendarDayButton
      {...props}
      className={cn(props.className, dayEvents.length > 0 && "pb-3")}
    >
      {props.children}
      {dayEvents.length > 0 && (
        <span className="absolute inset-x-0 bottom-1 flex items-center justify-center gap-0.5">
          {dots.map((color, i) => (
            <span
              key={i}
              className={cn("size-1.5 shrink-0 rounded-full", color)}
            />
          ))}
          {overflow > 0 && (
            <span className="text-[9px] leading-none font-medium text-muted-foreground">
              +{overflow}
            </span>
          )}
        </span>
      )}
    </CalendarDayButton>
  );
}

export function AgendaCalendar({ eventsByDate, ...props }: AgendaCalendarProps) {
  const map = eventsByDate;

  return (
    <Calendar
      {...props}
      components={{
        DayButton: (dayProps) => (
          <AgendaDayButton {...dayProps} eventsByDate={map} />
        ),
      }}
    />
  );
}
