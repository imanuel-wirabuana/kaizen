import { useEffect } from "react"
import { Redirect, Route, Switch, useLocation } from "wouter"
import { useAuth } from "@clerk/clerk-react"
import { RootLayout } from "@/components/layout/root-layout"
import { Toaster } from "@/components/ui/toast"
import { DashboardPage } from "@/pages/dashboard"
import { InboxPage } from "@/pages/inbox"
import { BoardPage } from "@/pages/board"
import { CalendarPage } from "@/pages/calendar"
import { AssistantPage } from "@/pages/assistant"
import { SettingsPage } from "@/pages/settings"
import { MembersPage } from "@/pages/members"
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

  if (!isLoaded) {
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
              <Route path="/members/invite/:id" component={MembersPage} />
              <Route path="/members/:id" component={MembersPage} />

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
