import {
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
} from "@clerk/clerk-react"
import { Button } from "@/components/ui/button"
import { LogIn } from "lucide-react"

export function NavUser() {
  return (
    <>
      <SignedOut>
        <SignInButton mode="modal">
          <Button size="icon" className="group-data-[collapsible=icon]:hidden">
            <LogIn />
          </Button>
        </SignInButton>
      </SignedOut>
      <SignedIn>
        <div className="flex items-center justify-center group-data-[collapsible=icon]:p-0">
          <UserButton
            showName
            appearance={{
              elements: {
                userButtonBox:
                  "flex-row-reverse w-full justify-between group-data-[collapsible=icon]:justify-center",
                userButtonOuterIdentifier:
                  "text-xs font-medium text-sidebar-foreground group-data-[collapsible=icon]:hidden",
              },
            }}
          />
        </div>
      </SignedIn>
    </>
  )
}

export default NavUser
