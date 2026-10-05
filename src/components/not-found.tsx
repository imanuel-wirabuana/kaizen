import { Link } from "wouter"
import { ArrowLeft, FileQuestion, Home } from "lucide-react"
import { Button, buttonVariants } from "@/components/ui/button"

export function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center px-4">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/80 text-muted-foreground mb-6 ring-1 ring-border/60">
        <FileQuestion className="h-8 w-8 text-primary" />
      </div>

      <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
        404 Error
      </span>
      <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Page not found</h1>
      <p className="mt-3 max-w-md text-sm text-muted-foreground leading-relaxed">
        Sorry, we couldn&apos;t find the page you&apos;re looking for. It might have been removed,
        renamed, or didn&apos;t exist in the first place.
      </p>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Button variant="outline" onClick={() => window.history.back()} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Go back
        </Button>
        <Link href="/" className={buttonVariants({ variant: "default" })}>
          <Home className="h-4 w-4 mr-1.5" />
          Back to home
        </Link>
      </div>
    </div>
  )
}

export default NotFound
