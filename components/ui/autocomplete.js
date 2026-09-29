import { useEffect, useRef, useState } from "react";
import { useCombobox } from "downshift";
import { cn } from "@/lib/utils";
import { Check, Search, X } from "lucide-react";
import { Input } from "./input";

export function AutoComplete({
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
}) {
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
    isItemDisabled: (item) => !!item?.disabled,
    onInputValueChange: ({ inputValue }) => {
      onInputChange?.(inputValue || "");
    },
    onSelectedItemChange: ({ selectedItem }) => {
      if (selectedItem && !selectedItem.disabled) {
        onValueChange?.(selectedItem);
      }
    },
    // Selecting an item shouldn't copy its label into the search box
    stateReducer: (state, { type, changes }) => {
      switch (type) {
        case useCombobox.stateChangeTypes.InputKeyDownEnter:
        case useCombobox.stateChangeTypes.ItemClick:
          return { ...changes, inputValue: "" };
        default:
          return changes;
      }
    },
    itemToString: (item) => item?.label || "",
  });

  const wrapperRef = useRef(null);
  const menuMaxHeight = useVisibleMenuHeight(wrapperRef, isOpen);

  const { ref, ...inputProps } = getInputProps({
    onFocus: () => {
      // On phones, bring the search box to the top of the screen so the
      // results have room above the on-screen keyboard
      if (!window.matchMedia("(max-width: 639px)").matches) return;
      setTimeout(() => {
        const top = wrapperRef.current?.getBoundingClientRect().top;
        if (top > 16) window.scrollBy({ top: top - 16, behavior: "smooth" });
      }, 50);
    },
  });

  return (
    <div ref={wrapperRef} className={cn("relative w-full", maxWidth, className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
        <Input
          ref={ref}
          {...inputProps}
          type="search"
          enterKeyHint="search"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          className={cn("pl-9 pr-10 rounded-full [&::-webkit-search-cancel-button]:hidden", inputClassName)}
          placeholder={placeholder}
        />
        {inputValue && (
          <button
            type="button"
            onClick={() => onInputChange?.("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-accent"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <ul
        {...getMenuProps()}
        style={menuMaxHeight ? { maxHeight: menuMaxHeight } : undefined}
        className={cn(
          "absolute z-50 w-full mt-2 overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md",
          "animate-in fade-in-0 zoom-in-95",
          "max-h-[300px] overflow-y-auto overscroll-contain p-1",
          !isOpen && "hidden"
        )}
      >
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
                        <span className="text-sm text-gray-700 font-medium">{disabledText}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </li>
          ))
        )}
      </ul>
    </div>
  );
}

// Caps the menu height to the space between the input and the bottom of the
// visible viewport, which shrinks when the mobile keyboard is open.
function useVisibleMenuHeight(wrapperRef, isOpen) {
  const [maxHeight, setMaxHeight] = useState(null);

  useEffect(() => {
    const viewport = window.visualViewport;
    if (!isOpen || !viewport) return;

    const update = () => {
      const rect = wrapperRef.current?.getBoundingClientRect();
      if (!rect) return;
      const visibleBottom = viewport.offsetTop + viewport.height;
      setMaxHeight(Math.max(160, Math.min(300, visibleBottom - rect.bottom - 16)));
    };

    update();
    viewport.addEventListener("resize", update);
    viewport.addEventListener("scroll", update);
    window.addEventListener("scroll", update, { passive: true });
    return () => {
      viewport.removeEventListener("resize", update);
      viewport.removeEventListener("scroll", update);
      window.removeEventListener("scroll", update);
    };
  }, [isOpen, wrapperRef]);

  return maxHeight;
}
