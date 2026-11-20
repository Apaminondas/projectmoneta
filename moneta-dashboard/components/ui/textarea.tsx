import * as React from "react"
import { cn } from "cn"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-20 w-full resize-none py-2 rounded-lg border border-input bg-secondary/40 px-3 text-sm text-foreground placeholder:text-muted-foreground transition-colors duration-150 outline-none focus:border-ring focus:ring-1 focus:ring-ring focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring aria-invalid:border-destructive aria-invalid:ring-destructive/20 disabled:cursor-not-allowed disabled:opacity-60",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
