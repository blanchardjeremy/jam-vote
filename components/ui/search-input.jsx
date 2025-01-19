import * as React from "react"
import { cn } from "@/lib/utils"
import { Input } from "./input"
import { MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/24/outline"
import { Button } from "./button"

const SearchInput = React.forwardRef(({ className, value, onChange, ...props }, ref) => {
  return (
    <div className="relative">
      <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
      <Input
        {...props}
        ref={ref}
        value={value}
        onChange={onChange}
        className={cn(
          "pl-9 pr-8", // Add padding for both icons
          className
        )}
      />
      {value && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => onChange({ target: { value: '' } })}
          className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
        >
          <XMarkIcon className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
})
SearchInput.displayName = "SearchInput"

export { SearchInput } 