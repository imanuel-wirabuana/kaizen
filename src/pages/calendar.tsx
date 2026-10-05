import { useState } from "react"
import { Clock, Plus, Video } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface EventItem {
  id: string
  title: string
  time: string
  type: "meeting" | "focus" | "review"
  attendees?: string
}

const SAMPLE_EVENTS: EventItem[] = [
  {
    id: "e1",
    title: "Kaizen Daily Standup & Planning",
    time: "09:30 AM - 10:00 AM",
    type: "meeting",
    attendees: "Team (4)",
  },
  {
    id: "e2",
    title: "Deep Work: Core Architecture Refactor",
    time: "10:30 AM - 01:00 PM",
    type: "focus",
  },
  {
    id: "e3",
    title: "Design Review: Wouter Layout & Dashboard",
    time: "02:30 PM - 03:15 PM",
    type: "review",
    attendees: "Lead Designer",
  },
]

export function CalendarPage() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Calendar</h1>
          <p className="text-sm text-muted-foreground">
            Schedule your focus blocks, meetings, and milestones.
          </p>
        </div>

        <Button className="gap-2 self-start sm:self-auto">
          <Plus className="size-4" />
          <span>New Event</span>
        </Button>
      </div>

      {/* Grid: Calendar widget on left, Event agenda on right */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        <Card className="p-4 md:col-span-5 flex justify-center bg-card shadow-2xs">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            className="rounded-md"
          />
        </Card>

        <div className="md:col-span-7 flex flex-col gap-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="font-semibold text-sm">
              Agenda &bull;{" "}
              {selectedDate
                ? selectedDate.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })
                : "Today"}
            </h2>
            <Badge variant="outline" className="text-xs font-normal">
              {SAMPLE_EVENTS.length} Events
            </Badge>
          </div>

          <div className="flex flex-col gap-2.5">
            {SAMPLE_EVENTS.map((event) => (
              <Card key={event.id} className="p-4 flex items-start justify-between shadow-2xs">
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm text-foreground">{event.title}</span>
                    <Badge
                      variant={event.type === "focus" ? "default" : "secondary"}
                      className="text-[10px] py-0 px-1.5 h-4 capitalize"
                    >
                      {event.type}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="size-3.5" />
                      {event.time}
                    </span>
                    {event.attendees && (
                      <span className="flex items-center gap-1">
                        <Video className="size-3.5" />
                        {event.attendees}
                      </span>
                    )}
                  </div>
                </div>

                <Button variant="outline" size="xs" className="text-xs">
                  Details
                </Button>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default CalendarPage
