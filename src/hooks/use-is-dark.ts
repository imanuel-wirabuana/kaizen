import { useEffect, useState } from "react"
import { useTheme } from "@/components/theme-provider"

export function useIsDark(): boolean {
  const { theme } = useTheme()
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof document !== "undefined") {
      return document.documentElement.classList.contains("dark")
    }
    return false
  })

  useEffect(() => {
    const updateTheme = () => {
      setIsDark(document.documentElement.classList.contains("dark"))
    }

    const observer = new MutationObserver(updateTheme)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    })

    updateTheme()
    return () => observer.disconnect()
  }, [theme])

  return isDark
}
