import * as React from "react"
import { cn } from "cn"

export interface SwitchProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onChange"> {
  checked?: boolean
  defaultChecked?: boolean
  onCheckedChange?: (checked: boolean) => void
  size?: "sm" | "default"
}

const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(
  (
    {
      className,
      checked: controlledChecked,
      defaultChecked = false,
      onCheckedChange,
      disabled = false,
      size = "default",
      onClick,
      ...props
    },
    ref
  ) => {
    const isControlled = controlledChecked !== undefined
    const [internalChecked, setInternalChecked] = React.useState(defaultChecked)
    const isChecked = isControlled ? Boolean(controlledChecked) : internalChecked

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (disabled) return
      e.stopPropagation()
      const nextChecked = !isChecked
      if (!isControlled) {
        setInternalChecked(nextChecked)
      }
      onCheckedChange?.(nextChecked)
      onClick?.(e)
    }

    return (
      <button
        ref={ref}
        type="button"
        role="switch"
        aria-checked={isChecked}
        data-slot="switch"
        data-size={size}
        data-state={isChecked ? "checked" : "unchecked"}
        data-checked={isChecked ? "" : undefined}
        data-unchecked={!isChecked ? "" : undefined}
        disabled={disabled}
        onClick={handleClick}
        className={cn(
          "peer group/switch relative inline-flex shrink-0 cursor-pointer items-center rounded-full border border-transparent transition-colors outline-none",
          "focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30",
          "disabled:cursor-not-allowed disabled:opacity-50",
          size === "sm" ? "h-[14px] w-[24px]" : "h-[18px] w-[32px]",
          isChecked ? "bg-primary" : "bg-input dark:bg-muted-foreground/30",
          className
        )}
        {...props}
      >
        <span
          data-slot="switch-thumb"
          data-state={isChecked ? "checked" : "unchecked"}
          data-checked={isChecked ? "" : undefined}
          data-unchecked={!isChecked ? "" : undefined}
          className={cn(
            "pointer-events-none block rounded-full bg-background shadow-xs ring-0 transition-transform duration-200 ease-in-out dark:bg-foreground",
            size === "sm" ? "size-2.5" : "size-3.5",
            isChecked
              ? size === "sm"
                ? "translate-x-[11px] bg-primary-foreground dark:bg-primary-foreground"
                : "translate-x-[16px] bg-primary-foreground dark:bg-primary-foreground"
              : size === "sm"
                ? "translate-x-[1.5px]"
                : "translate-x-[2px]"
          )}
        />
      </button>
    )
  }
)

Switch.displayName = "Switch"

export { Switch }
