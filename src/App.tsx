import { Redirect, Route, Switch } from "wouter"
import { useAuth } from "@clerk/clerk-react"
import { RootLayout } from "@/components/layout/root-layout"
import { DashboardPage } from "@/pages/dashboard"
import { InboxPage } from "@/pages/inbox"
import { SearchPage } from "@/pages/search"
import { BoardPage } from "@/pages/board"
import { CalendarPage } from "@/pages/calendar"
import { AssistantPage } from "@/pages/assistant"
import { SettingsPage } from "@/pages/settings"
import { MembersPage } from "@/pages/members"
import { AboutPage } from "@/pages/about"
import { LandingPage } from "@/pages/landing"
import { NotFound } from "@/components/not-found"

export function App() {
  const { isLoaded, isSignedIn } = useAuth()

  if (!isLoaded) {
    return null
  }

  return (
    <Switch>
      {/* Standalone Landing Page at /home */}
      <Route path="/home" component={LandingPage} />

      {/* Authenticated workspace routes wrapped in RootLayout */}
      <Route>
        {!isSignedIn ? (
          <Redirect to="/home" />
        ) : (
          <RootLayout>
            <Switch>
              <Route path="/" component={DashboardPage} />
              <Route path="/inbox/:id?">
                {(params) => (
                  <Redirect to={params.id ? `/zenbox/${params.id}` : "/zenbox"} />
                )}
              </Route>
              <Route path="/zenbox" component={InboxPage} />
              <Route path="/zenbox/:id" component={InboxPage} />
              <Route path="/search" component={SearchPage} />
              <Route path="/boards" component={BoardPage} />
              <Route path="/calendars" component={CalendarPage} />
              <Route path="/assistant" component={AssistantPage} />
              <Route path="/settings" component={SettingsPage} />
              <Route path="/members" component={MembersPage} />
              <Route path="/about" component={AboutPage} />
              <Route component={NotFound} />
            </Switch>
          </RootLayout>
        )}
      </Route>
    </Switch>
  )
}

export default App
