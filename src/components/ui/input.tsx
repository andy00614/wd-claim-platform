import * as React from "react"

import { cn, enforceEnglishInput } from "@/lib/utils"

function Input({ className, type, onChange, onInput, onBlur, ...props }: React.ComponentProps<"input">) {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    enforceEnglishInput(event.target)
    onChange?.(event)
  }

  const handleInput = (event: React.FormEvent<HTMLInputElement>) => {
    enforceEnglishInput(event.currentTarget)
    onInput?.(event)
  }

  const handleBlur = (event: React.FocusEvent<HTMLInputElement>) => {
    enforceEnglishInput(event.target)
    onBlur?.(event)
  }

  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        className
      )}
      onChange={handleChange}
      onInput={handleInput}
      onBlur={handleBlur}
      {...props}
    />
  )
}

export { Input }
