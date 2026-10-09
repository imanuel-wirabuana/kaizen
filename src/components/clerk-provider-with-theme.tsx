import { type ReactNode, useEffect, useState } from "react"
import { ClerkProvider } from "@clerk/clerk-react"
import { dark } from "@clerk/themes"
import { useTheme } from "@/components/theme-provider"

interface ClerkProviderWithThemeProps {
  children: ReactNode
  publishableKey: string
  proxyUrl?: string
  afterSignOutUrl?: string
}

export function ClerkProviderWithTheme({
  children,
  publishableKey,
  proxyUrl,
  afterSignOutUrl = "/",
}: ClerkProviderWithThemeProps) {
  const { theme } = useTheme()
  const [isDark, setIsDark] = useState(() => {
    if (typeof document !== "undefined") {
      return document.documentElement.classList.contains("dark")
    }
    return false
  })

  useEffect(() => {
    const checkDark = () => {
      setIsDark(document.documentElement.classList.contains("dark"))
    }

    const observer = new MutationObserver(checkDark)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    })

    checkDark()
    return () => observer.disconnect()
  }, [theme])

  return (
    <ClerkProvider
      publishableKey={publishableKey}
      proxyUrl={proxyUrl}
      afterSignOutUrl={afterSignOutUrl}
      appearance={{
        baseTheme: isDark ? dark : undefined,
        variables: {
          colorPrimary: "#dd5927",
          colorText: isDark ? "#ebebeb" : "#454545",
          colorTextSecondary: isDark ? "#999999" : "#767682",
          colorBackground: isDark ? "#2d2d2d" : "#ffffff",
          colorInputBackground: "transparent",
          colorInputText: isDark ? "#ebebeb" : "#454545",
          borderRadius: "0.5rem",
          fontFamily: "'Outfit', sans-serif",
        },
        elements: {
          card: "bg-card text-card-foreground shadow-sm border border-border rounded-xl",
          modalContent:
            "bg-card text-card-foreground border border-border rounded-xl shadow-xl",
          headerTitle: "text-foreground font-semibold text-lg tracking-tight",
          headerSubtitle: "text-muted-foreground text-xs",
          socialButtonsBlockButton:
            "bg-background hover:bg-muted text-foreground border border-input rounded-md font-medium text-xs transition-colors shadow-none",
          socialButtonsBlockButtonText: "text-foreground font-medium text-xs",
          formButtonPrimary:
            "bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-xs rounded-md shadow-none transition-colors h-8",
          formFieldInput:
            "bg-transparent border border-input rounded-md text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring/50 focus:border-ring text-xs h-8",
          formFieldLabel: "text-foreground text-xs font-medium",
          footerActionLink: "text-primary hover:underline text-xs font-medium",
          identityPreviewText: "text-foreground text-xs",
          identityPreviewEditButton: "text-primary hover:underline text-xs",
          dividerLine: "bg-border",
          dividerText: "text-muted-foreground text-xs",
          userButtonPopoverCard:
            "bg-popover text-popover-foreground border border-border shadow-md rounded-xl",
          userButtonPopoverActionButton:
            "hover:bg-muted text-foreground text-xs transition-colors rounded-md",
          userButtonPopoverActionButtonText: "text-foreground text-xs font-normal",
          userButtonPopoverFooter: "border-t border-border bg-popover/50",
          userPreviewMainIdentifier: "text-foreground font-medium text-xs",
          userPreviewSecondaryIdentifier: "text-muted-foreground text-xs",
        },
      }}
    >
      {children}
    </ClerkProvider>
  )
}
