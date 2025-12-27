import Link from 'next/link'
import { Button } from './ui/button'
import { ThemeToggle } from './theme-toggle'

export default function Navbar() {
  return (
    <nav className="px-6 py-2 flex items-center justify-between text-muted-foreground">
      <div>
        <Link href="/">
          <h1 className="font-bold text-lg">Kaizen</h1>
        </Link>
      </div>

      <div>{/* <ThemeToggle /> */}</div>
    </nav>
  )
}
