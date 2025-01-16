import { useCombobox } from "downshift";
import { cn } from "@/lib/utils";
import { Check, Search, XCircle } from "lucide-react";
import { Input } from "./input";
import { forwardRef } from "react";

export const AutoComplete = forwardRef(({
  value,
  onValueChange,
  inputValue,
  onInputChange,
  options = [],
  isLoading,
  emptyMessage = "No items.",
  placeholder = "Search...",
  renderOption,
  className,
  inputClassName,
  disabledText = "Disabled",
  maxWidth = "max-w-full",
}, forwardedRef) => {
  const {
    isOpen,
    getMenuProps,
    getInputProps,
    getItemProps,
    highlightedIndex,
  } = useCombobox({
    items: options || [],
    inputValue: inputValue || "",
    selectedItem: options ? options.find(item => item.value === value) || null : null,
    onInputValueChange: ({ inputValue }) => {
      onInputChange?.(inputValue || "");
    },
    onSelectedItemChange: ({ selectedItem }) => {
      if (selectedItem && !selectedItem.disabled) {
        onValueChange?.(selectedItem);
      }
    },
    itemToString: (item) => item?.label || "",
  });

  const { ref: downshiftRef, ...inputProps } = getInputProps();

  // Merge the refs
  const mergedRef = (el) => {
    downshiftRef(el);
    if (typeof forwardedRef === 'function') {
      forwardedRef(el);
    } else if (forwardedRef) {
      forwardedRef.current = el;
    }
  };

  return (
    <div className={cn("relative w-full", maxWidth, className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
        <Input
          ref={mergedRef}
          {...inputProps}
          className={cn("pl-9", inputClassName)}
          placeholder={placeholder}
        />
      </div>

      <ul
        {...getMenuProps()}
        className={cn(
          "absolute z-50 w-full mt-2 overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md",
          "animate-in fade-in-0 zoom-in-95",
          "max-h-[300px] overflow-y-auto",
          !isOpen && "hidden"
        )}
      >
        <div className="p-1">
          {isLoading ? (
            <li className="relative flex cursor-default select-none items-center gap-2 rounded-sm px-3 py-2.5 text-sm outline-none text-muted-foreground">
              <div className="h-2 w-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Loading...
            </li>
          ) : options?.length === 0 ? (
            <li className="relative flex cursor-default select-none items-center rounded-sm px-3 py-2.5 text-sm outline-none text-muted-foreground">
              {emptyMessage}
            </li>
          ) : (
            (options || []).map((item, index) => (
              <li
                key={item.value}
                {...getItemProps({ item, index })}
                className={cn(
                  "relative flex w-full select-none items-center rounded-sm px-3 py-3 text-base outline-none",
                  "transition-colors duration-100",
                  item.disabled ? "cursor-not-allowed opacity-50 bg-muted" : "cursor-default",
                  !item.disabled && highlightedIndex === index && "bg-accent text-accent-foreground",
                  value === item.value && "font-medium",
                  !item.disabled && "hover:bg-accent hover:text-accent-foreground"
                )}
              >
                {renderOption ? (
                  renderOption(item, value === item.value)
                ) : (
                  <div className="flex w-full items-center justify-between">
                    <div className="flex items-center">
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4 shrink-0 opacity-0",
                          value === item.value && "opacity-100"
                        )}
                      />
                      <span className="flex-1 truncate">{item.label}</span>
                      {item.disabled && (
                        <div className="ml-2 inline-flex items-center gap-1">
                          {/* <XCircle className="h-3.5 w-3.5 flex-shrink-0 text-gray-500" /> */}
                          <span className="text-sm text-gray-700 font-medium">{disabledText}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </li>
            ))
          )}
        </div>
      </ul>
    </div>
  );
});

AutoComplete.displayName = "AutoComplete";