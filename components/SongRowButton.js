import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export default function SongRowButton({ 
  icon: Icon,
  onClick,
  tooltip,
  variant = 'default', // default, success, danger
  disabled,
  href,
  isLoading,
  className = '',
  onTouchStart,
  onTouchEnd,
}) {
  const baseStyles = "p-0.5 sm:p-1 rounded-md transition-all duration-150 ease-in-out";
  const variantStyles = {
    default: "text-muted-foreground hover:text-foreground hover:bg-muted",
    success: "text-muted-foreground hover:text-success hover:bg-success-muted",
    danger: "text-muted-foreground hover:text-destructive hover:bg-destructive/10",
  };

  const styles = cn(`
    ${baseStyles}
    ${variantStyles[variant]}
    ${isLoading ? 'opacity-75' : ''}
    ${className}
  `);

  const ButtonOrLink = href ? 'a' : 'button';
  const linkProps = href ? { href, target: "_blank", rel: "noopener noreferrer" } : {};

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <ButtonOrLink
            onClick={onClick}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
            disabled={disabled || isLoading}
            className={styles}
            {...linkProps}
          >
            <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
          </ButtonOrLink>
        </TooltipTrigger>
        <TooltipContent>
          <p>{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
} 