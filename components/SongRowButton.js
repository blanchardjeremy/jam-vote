import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function SongRowButton({ 
  icon: Icon,
  onClick,
  tooltip,
  variant = 'default', // default, success, danger
  disabled,
  href,
  isLoading,
  className = '',
}) {
  const baseStyles = "p-1 rounded-lg transition-all duration-150 ease-in-out";
  const variantStyles = {
    default: "text-muted-foreground hover:text-foreground hover:bg-muted",
    success: "text-success hover:text-success hover:bg-success-muted",
    danger: "text-destructive-foreground hover:text-destructive hover:bg-destructive/10",
  };

  const activeStyles = {
    default: "text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50",
    success: "text-success hover:text-success hover:bg-success-muted",
    danger: "text-destructive hover:text-destructive hover:bg-destructive/10",
  };

  const styles = `
    ${baseStyles}
    ${variantStyles[variant]}
    ${isLoading ? 'opacity-75' : ''}
    ${className}
  `;

  const ButtonOrLink = href ? 'a' : 'button';
  const linkProps = href ? { href, target: "_blank", rel: "noopener noreferrer" } : {};

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <ButtonOrLink
          onClick={onClick}
          disabled={disabled || isLoading}
          className={styles}
          {...linkProps}
        >
          <Icon className="h-6 w-6" />
        </ButtonOrLink>
      </TooltipTrigger>
      <TooltipContent>
        <p>{tooltip}</p>
      </TooltipContent>
    </Tooltip>
  );
} 