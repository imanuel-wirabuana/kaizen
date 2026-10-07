import { Link } from "wouter"
import { SignedIn, SignedOut, SignInButton } from "@clerk/clerk-react"
import { ArrowRight } from "lucide-react"
import { Button, buttonVariants } from "@/components/ui/button"
import { NavUser } from "@/components/layout/nav-user"
import GradientWaves from "@/components/GradientWaves"
import { useIsDark } from "@/hooks/use-is-dark"

export function LandingPage() {
  const isDark = useIsDark()

  return (
    <div className="relative flex min-h-svh flex-col overflow-x-hidden bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50">
        <div className="container mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
          <div className="flex items-center gap-2.5">
            <span className="text-sm font-semibold tracking-tight text-primary">
              Kaizen
            </span>
          </div>

          <div className="flex items-center gap-4">
            <NavUser />
          </div>
        </div>
      </header>

      {/* Hero & Interactive Waves Container */}
      <div className="relative flex flex-1 flex-col items-center justify-center">
        {/* Gradient Waves Canvas Layer */}
        <div className="pointer-events-auto absolute inset-0 z-0 overflow-hidden [mask-image:linear-gradient(to_bottom,black_75%,transparent_100%)]">
          <GradientWaves
            horizonColor={isDark ? "#09090b" : "#ffffff"}
            waveColor={isDark ? "#27272a" : "#e4e4e7"}
            crestColor={isDark ? "#fafafa" : "#18181b"}
            speed={0.35}
            amplitude={2.6}
            waveScale={0.65}
            waveRatio={0.9}
            swell={30}
            turbulence={18}
            tilt={1.12}
            zoom={1.05}
            height={5.2}
            fogDepth={16}
            detail="medium"
            brightness={1}
            opacity={1}
            mouseInteraction
            parallaxStrength={0.45}
            grain={false}
            grainIntensity={0}
            className="h-full w-full"
          />
        </div>

        {/* Hero Content Layer */}
        <main className="relative z-10 container mx-auto flex max-w-4xl flex-1 flex-col items-center justify-center px-6 py-20 text-center">
          {/* Action CTAs */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3.5">
            <SignedOut>
              <SignInButton mode="modal" fallbackRedirectUrl="/">
                <Button
                  size="lg"
                  className="h-11 gap-2 px-7 text-sm font-medium shadow-md"
                >
                  Start Your Journey
                  <ArrowRight className="size-4" />
                </Button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <Link
                href="/"
                className={buttonVariants({
                  size: "lg",
                  className: "h-11 gap-2 px-7 text-sm font-medium shadow-md",
                })}
              >
                Go to Workspace
                <ArrowRight className="size-4" />
              </Link>
            </SignedIn>
          </div>
        </main>
      </div>

      {/* Footer */}
      <footer className="relative z-10 bg-transparent py-5 text-center text-xs text-muted-foreground">
        <div className="container mx-auto flex max-w-5xl flex-col items-center justify-between gap-2 px-6 sm:flex-row">
          <span>Kaizen Workspace 1.0.0</span>
          <span>Small changes &bull; Remarkable results</span>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage
