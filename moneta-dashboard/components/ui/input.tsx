import * as React from "react"
import { cn } from "cn"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-11 sm:h-9 w-full min-w-0 py-1 file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground rounded-lg border border-input bg-secondary/40 px-3 text-sm text-foreground placeholder:text-muted-foreground transition-colors duration-150 outline-none focus:border-ring focus:ring-1 focus:ring-ring focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring aria-invalid:border-destructive aria-invalid:ring-destructive/20 disabled:cursor-not-allowed disabled:opacity-60",
        className
      )}
      {...props}
    />
  )
}

export { Input }
