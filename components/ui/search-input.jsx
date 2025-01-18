import * as React from "react"
import { cn } from "@/lib/utils"
import { Input } from "./input"
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline"

const SearchInput = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <div className="relative">
      <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
      <Input
        {...props}
        ref={ref}
        className={cn(
          "pl-9", // Add padding for the search icon
          className
        )}
      />
    </div>
  )
})
SearchInput.displayName = "SearchInput"

export { SearchInput } 