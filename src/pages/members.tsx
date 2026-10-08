import { useState } from "react"
import { useUser } from "@clerk/clerk-react"
import { Mail, Plus, Search, Shield, UserCheck, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useActiveWorkspace } from "@/stores/workspace-store"

interface Member {
  id: string
  name: string
  email: string
  role: "Owner" | "Admin" | "Member"
  status: "Active" | "Pending"
  avatar: string
  isCurrentUser?: boolean
}

const DEFAULT_MEMBERS: Member[] = [
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
  const { user } = useUser()
  const activeWorkspace = useActiveWorkspace()

  const [searchQuery, setSearchQuery] = useState("")
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState<"Admin" | "Member">("Member")
  const [membersList, setMembersList] = useState<Member[]>(DEFAULT_MEMBERS)

  const currentUserMember: Member = {
    id: "current-user",
    name: user?.fullName || user?.username || "Workspace Owner",
    email: user?.primaryEmailAddress?.emailAddress || "owner@kaizen.app",
    role: "Owner",
    status: "Active",
    avatar:
      user?.firstName && user?.lastName
        ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
        : "ME",
    isCurrentUser: true,
  }

  const allMembers = [currentUserMember, ...membersList]

  const filteredMembers = allMembers.filter((m) => {
    const q = searchQuery.toLowerCase().trim()
    if (!q) return true
    return m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q)
  })

  const totalMembers = allMembers.length
  const activeCollaborators = allMembers.filter((m) => m.status === "Active").length

  const handleSendInvite = (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteEmail.trim() || !inviteEmail.includes("@")) {
      toast.error("Invalid email", {
        description: "Please enter a valid email address.",
      })
      return
    }

    const initials = inviteEmail.slice(0, 2).toUpperCase()
    const newMember: Member = {
      id: `m-${Date.now()}`,
      name: inviteEmail.split("@")[0],
      email: inviteEmail.trim(),
      role: inviteRole,
      status: "Pending",
      avatar: initials,
    }

    setMembersList((prev) => [...prev, newMember])
    setInviteDialogOpen(false)
    setInviteEmail("")

    toast.success("Invitation sent", {
      description: `Invited ${newMember.email} as ${newMember.role} to ${activeWorkspace?.name || "Kaizen"}.`,
    })
  }

  return (
    <div className="flex flex-col gap-6 w-full p-4">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Team Members</h1>
          <p className="text-sm text-muted-foreground">
            Manage your workspace collaborators, roles, and invitations for{" "}
            <span className="font-medium text-foreground">
              {activeWorkspace?.name || "Kaizen"}
            </span>
            .
          </p>
        </div>

        <Button
          onClick={() => setInviteDialogOpen(true)}
          className="gap-2 self-start sm:self-auto cursor-pointer"
        >
          <Plus className="size-4" />
          <span>Invite Member</span>
        </Button>
      </div>

      {/* Members Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 flex items-center justify-between shadow-2xs">
          <div>
            <span className="text-xs text-muted-foreground font-medium">
              Total Members
            </span>
            <p className="text-2xl font-bold mt-1">{totalMembers}</p>
          </div>
          <div className="p-2 rounded-md bg-muted text-primary">
            <Users className="size-4" />
          </div>
        </Card>

        <Card className="p-4 flex items-center justify-between shadow-2xs">
          <div>
            <span className="text-xs text-muted-foreground font-medium">
              Active Collaborators
            </span>
            <p className="text-2xl font-bold mt-1">{activeCollaborators}</p>
          </div>
          <div className="p-2 rounded-md bg-muted text-primary">
            <UserCheck className="size-4" />
          </div>
        </Card>

        <Card className="p-4 flex items-center justify-between shadow-2xs">
          <div>
            <span className="text-xs text-muted-foreground font-medium">
              Workspace Seats
            </span>
            <p className="text-2xl font-bold mt-1">{totalMembers} / 10</p>
          </div>
          <div className="p-2 rounded-md bg-muted text-primary">
            <Shield className="size-4" />
          </div>
        </Card>
      </div>

      {/* Search & Members List */}
      <Card className="overflow-hidden shadow-2xs border-border/80">
        <div className="p-3 border-b border-border/50 bg-card">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search members by name or email..."
              className="pl-9 h-9 text-xs bg-muted/30"
            />
          </div>
        </div>

        <div className="divide-y divide-border/50">
          {filteredMembers.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted-foreground">
              No team members match &ldquo;{searchQuery}&rdquo;.
            </div>
          ) : (
            filteredMembers.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-xs shrink-0">
                    {member.avatar}
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-semibold">{member.name}</span>
                      {member.isCurrentUser && (
                        <Badge variant="outline" className="text-[10px] py-0 px-1.5 font-normal">
                          You
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Mail className="size-3" />
                      <span>{member.email}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Badge
                    variant={member.role === "Owner" ? "default" : "secondary"}
                    className="text-xs"
                  >
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
            ))
          )}
        </div>
      </Card>

      {/* Invite Member Dialog */}
      <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleSendInvite}>
            <DialogHeader>
              <DialogTitle>Invite Team Member</DialogTitle>
              <DialogDescription>
                Send an invitation link to collaborate on {activeWorkspace?.name || "Kaizen"}.
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-4 py-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="invite-email" className="text-xs font-medium text-foreground">
                  Email Address
                </label>
                <Input
                  id="invite-email"
                  type="email"
                  placeholder="collaborator@company.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="text-xs"
                  autoFocus
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-foreground">Role</label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant={inviteRole === "Member" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setInviteRole("Member")}
                    className="text-xs cursor-pointer"
                  >
                    Member
                  </Button>
                  <Button
                    type="button"
                    variant={inviteRole === "Admin" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setInviteRole("Admin")}
                    className="text-xs cursor-pointer"
                  >
                    Admin
                  </Button>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setInviteDialogOpen(false)}
                className="cursor-pointer"
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" className="cursor-pointer">
                Send Invitation
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default MembersPage
