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
import { Button } from "@/components/ui/button";

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
        'w-full overflow-hidden p-6',
        // Width
        `max-w-${maxWidth}`,
        // Height and scroll
        'max-h-[calc(100vh-4rem)] overflow-y-auto',
      )}>
        <DialogHeader className="bg-background pb-4">
          {title && <DialogTitle>{title}</DialogTitle>}
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        {/* Content */}
        <div className="">
          {children}
        </div>

        {/* Actions */}
        {actions && (
          <div className="bg-background pt-4 mt-0 flex flex-col-reverse gap-3 sm:flex-row-reverse sm:mt-0">
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
    <Button
      variant="primary"
      className={cn(className)}
      {...props}
    >
      {children}
    </Button>
  );
}

export function ModalSecondaryButton({ children, className, ...props }) {
  return (
    <Button
      variant="outline"
      className={cn(className)}
      {...props}
    >
      {children}
    </Button>
  );
} 