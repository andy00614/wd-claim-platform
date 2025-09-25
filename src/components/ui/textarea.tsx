import * as React from "react"

import { cn, enforceEnglishInput } from "@/lib/utils"

function Textarea({ className, onChange, onInput, onBlur, ...props }: React.ComponentProps<"textarea">) {
  const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    enforceEnglishInput(event.target)
    onChange?.(event)
  }

  const handleInput = (event: React.FormEvent<HTMLTextAreaElement>) => {
    enforceEnglishInput(event.currentTarget)
    onInput?.(event)
  }

  const handleBlur = (event: React.FocusEvent<HTMLTextAreaElement>) => {
    enforceEnglishInput(event.target)
    onBlur?.(event)
  }

  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 flex field-sizing-content min-h-16 w-full rounded-md border bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className
      )}
      onChange={handleChange}
      onInput={handleInput}
      onBlur={handleBlur}
      {...props}
    />
  )
}

export { Textarea }
