'use client';

import { XMarkIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  actions,
  maxWidth = 'lg', // sm, md, lg, xl, 2xl, etc.
}) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={cn(
        // Base styles
        'w-full overflow-hidden',
        // Width
        `max-w-${maxWidth}`,
      )}>

        <DialogHeader>
          {title && <DialogTitle>{title}</DialogTitle>}
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        {/* Content */}
        <div className="mt-4">
          {children}
        </div>

        {/* Actions */}
        {actions && (
          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row-reverse sm:mt-4">
            {actions}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// Helper components for consistent button styling
export function ModalPrimaryButton({ children, className, ...props }) {
  return (
    <button
      type="button"
      className={cn(
        // Base styles
        'inline-flex w-full justify-center rounded-md px-3 py-3 text-sm font-semibold shadow-sm sm:w-auto sm:py-2',
        // Colors
        'bg-indigo-600 text-white',
        // States
        'transition-colors duration-200',
        'hover:bg-indigo-500',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        // Custom classes
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function ModalSecondaryButton({ children, className, ...props }) {
  return (
    <button
      type="button"
      className={cn(
        // Base styles
        'inline-flex w-full justify-center rounded-md px-3 py-3 text-sm font-semibold sm:w-auto sm:py-2',
        // Colors
        'bg-white text-gray-900 ring-1 ring-inset ring-gray-300',
        // States
        'transition-colors duration-200',
        'hover:bg-gray-50',
        // Custom classes
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
} 