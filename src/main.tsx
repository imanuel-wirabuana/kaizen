import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

import "./index.css"
import App from "./App.tsx"
import { QueryClientProvider } from "@tanstack/react-query"
import { queryClient } from "@/lib/query-client"
import { ThemeProvider } from "@/components/theme-provider.tsx"
import { ClerkProviderWithTheme } from "@/components/clerk-provider-with-theme.tsx"

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!PUBLISHABLE_KEY) {
  throw new Error(
    "Missing VITE_CLERK_PUBLISHABLE_KEY in .env.local. Add your key from https://dashboard.clerk.com"
  )
}

// Auto-route through /__clerk proxy for production keys, or use explicit VITE_CLERK_PROXY_URL
const PROXY_URL =
  import.meta.env.VITE_CLERK_PROXY_URL ||
  (PUBLISHABLE_KEY.startsWith("pk_live_") ? "/__clerk" : undefined)

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <ClerkProviderWithTheme
          publishableKey={PUBLISHABLE_KEY}
          proxyUrl={PROXY_URL}
          afterSignOutUrl="/"
        >
          <App />
        </ClerkProviderWithTheme>
      </ThemeProvider>
    </QueryClientProvider>
  </StrictMode>
)
