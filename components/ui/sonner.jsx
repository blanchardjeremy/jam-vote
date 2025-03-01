"use client";
import { Toaster as Sonner } from "sonner"

const Toaster = ({
  ...props
}) => {
  // const { theme = "system" } = useTheme()

  return (
    (<Sonner
      // theme={theme}
      className="toaster group"
      // expand={true}
      richColors
      position="top-center"
      duration={3000}
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground hover:group-[.toast]:bg-primary/90 px-3 py-2 text-sm font-medium rounded-md",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props} />)
  );
}

export { Toaster }
