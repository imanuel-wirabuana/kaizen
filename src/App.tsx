import { useEffect, useState } from "react"
import { Redirect, Route, Switch, useLocation } from "wouter"
import { useAuth } from "@clerk/clerk-react"
import { Button } from "@/components/ui/button"
import { AlertCircleIcon, RotateCwIcon } from "lucide-react"
import { RootLayout } from "@/components/layout/root-layout"
import { Toaster } from "@/components/ui/toast"
import { DashboardPage } from "@/pages/dashboard"
import { InboxPage } from "@/pages/inbox"
import { BoardPage } from "@/pages/board"
import { CalendarPage } from "@/pages/calendar"
import { AssistantPage } from "@/pages/assistant"
import { SettingsPage } from "@/pages/settings"
import { MembersPage } from "@/pages/members"
import { MemberPermissionsPage } from "@/pages/member-permissions"
import { AboutPage } from "@/pages/about"
import { LandingPage } from "@/pages/landing"
import { NotFound } from "@/components/not-found"

function InviteCaptureRoute({ params }: { params: { code: string } }) {
  const [, setLocation] = useLocation()

  useEffect(() => {
    if (params?.code) {
      try {
        localStorage.setItem("kaizen_pending_invite", params.code)
        sessionStorage.setItem("kaizen_pending_invite", params.code)
      } catch {
        // Ignore storage exceptions
      }
      setLocation(`/?invite=${encodeURIComponent(params.code)}`)
    }
  }, [params?.code, setLocation])

  return null
}

export function App() {
  const { isLoaded, isSignedIn } = useAuth()
  const [loadTimedOut, setLoadTimedOut] = useState(false)

  useEffect(() => {
    if (isLoaded) return
    const timer = setTimeout(() => {
      setLoadTimedOut(true)
    }, 7000)
    return () => clearTimeout(timer)
  }, [isLoaded])

  if (!isLoaded) {
    if (loadTimedOut) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-background p-6">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 text-center shadow-lg">
            <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <AlertCircleIcon className="size-6" />
            </div>
            <h2 className="text-base font-semibold text-foreground">
              Authentication Loading Delayed
            </h2>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              Clerk authentication is taking longer than expected to initialize. If deployed on Vercel with a proxy, ensure <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] text-foreground">CLERK_SECRET_KEY</code> is configured in your Vercel Project Settings.
            </p>
            <div className="mt-5 flex justify-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.reload()}
              >
                <RotateCwIcon className="mr-1.5 size-3.5" />
                Retry
              </Button>
            </div>
          </div>
        </div>
      )
    }
    return null
  }

  const searchParams =
    typeof window !== "undefined" ? window.location.search : ""

  return (
    <>
      <Switch>
      {/* Invite capture routes */}
      <Route path="/join/:code" component={InviteCaptureRoute} />
      <Route path="/invite/:code" component={InviteCaptureRoute} />

      {/* Standalone Landing Page at /home */}
      <Route path="/home" component={LandingPage} />

      {/* Authenticated workspace routes wrapped in RootLayout */}
      <Route>
        {!isSignedIn ? (
          <Redirect to={`/home${searchParams}`} />
        ) : (
          <RootLayout>
            <Switch>
              <Route path="/" component={DashboardPage} />
              <Route path="/search">
                <Redirect to="/" />
              </Route>

              {/* zenbox */}
              <Route path="/zenbox" component={InboxPage} />
              <Route path="/zenbox/:id" component={InboxPage} />

              {/* boards */}
              <Route path="/boards" component={BoardPage} />
              <Route path="/boards/:id" component={BoardPage} />

              {/* calendar */}
              <Route path="/calendars" component={CalendarPage} />
              <Route path="/calendars/:id" component={CalendarPage} />

              {/* assistant */}
              <Route path="/assistant" component={AssistantPage} />
              <Route path="/assistant/:id" component={AssistantPage} />

              {/* settings */}
              <Route path="/settings" component={SettingsPage} />

              {/* members */}
              <Route path="/members" component={MembersPage} />
              <Route path="/members/:id" component={MemberPermissionsPage} />

              {/* about */}
              <Route path="/about" component={AboutPage} />

              {/* not found */}
              <Route component={NotFound} />
            </Switch>
          </RootLayout>
        )}
      </Route>
    </Switch>
    <Toaster />
  </>
)
}

export default App
