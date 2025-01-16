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
    default: "text-gray-400 hover:text-indigo-600 hover:bg-indigo-50",
    success: "text-gray-400 hover:text-green-600 hover:bg-green-50",
    danger: "text-gray-400 hover:text-red-600 hover:bg-red-50",
  };

  const activeStyles = {
    default: "text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50",
    success: "text-green-600 hover:text-green-700 hover:bg-green-50",
    danger: "text-red-600 hover:text-red-700 hover:bg-red-50",
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