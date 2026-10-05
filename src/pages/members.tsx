import { Mail, Plus, Shield, UserCheck, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface Member {
  id: string
  name: string
  email: string
  role: "Owner" | "Admin" | "Member"
  status: "Active" | "Pending"
  avatar: string
}

const MEMBERS: Member[] = [
  {
    id: "m1",
    name: "Alex Morgan",
    email: "alex@kaizen.app",
    role: "Owner",
    status: "Active",
    avatar: "AM",
  },
  {
    id: "m2",
    name: "Sarah Chen",
    email: "sarah@kaizen.app",
    role: "Admin",
    status: "Active",
    avatar: "SC",
  },
  {
    id: "m3",
    name: "Marcus Miller",
    email: "marcus@kaizen.app",
    role: "Member",
    status: "Active",
    avatar: "MM",
  },
  {
    id: "m4",
    name: "Elena Rostova",
    email: "elena@kaizen.app",
    role: "Member",
    status: "Pending",
    avatar: "ER",
  },
]

export function MembersPage() {
  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Team Members</h1>
          <p className="text-sm text-muted-foreground">
            Manage your workspace collaborators, roles, and invite team members.
          </p>
        </div>

        <Button className="gap-2 self-start sm:self-auto">
          <Plus className="size-4" />
          <span>Invite Member</span>
        </Button>
      </div>

      {/* Members Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 flex items-center justify-between shadow-2xs">
          <div>
            <span className="text-xs text-muted-foreground font-medium">Total Members</span>
            <p className="text-2xl font-bold mt-1">4</p>
          </div>
          <div className="p-2 rounded-md bg-muted text-primary">
            <Users className="size-4" />
          </div>
        </Card>

        <Card className="p-4 flex items-center justify-between shadow-2xs">
          <div>
            <span className="text-xs text-muted-foreground font-medium">Active Collaborators</span>
            <p className="text-2xl font-bold mt-1">3</p>
          </div>
          <div className="p-2 rounded-md bg-muted text-primary">
            <UserCheck className="size-4" />
          </div>
        </Card>

        <Card className="p-4 flex items-center justify-between shadow-2xs">
          <div>
            <span className="text-xs text-muted-foreground font-medium">Workspace Seats</span>
            <p className="text-2xl font-bold mt-1">4 / 10</p>
          </div>
          <div className="p-2 rounded-md bg-muted text-primary">
            <Shield className="size-4" />
          </div>
        </Card>
      </div>

      {/* Members List */}
      <Card className="overflow-hidden shadow-2xs">
        <div className="divide-y divide-border/50">
          {MEMBERS.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-xs shrink-0">
                  {member.avatar}
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold">{member.name}</span>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Mail className="size-3" />
                    <span>{member.email}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Badge variant={member.role === "Owner" ? "default" : "secondary"} className="text-xs">
                  {member.role}
                </Badge>
                <Badge
                  variant={member.status === "Active" ? "outline" : "secondary"}
                  className="text-xs font-normal"
                >
                  {member.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

export default MembersPage
