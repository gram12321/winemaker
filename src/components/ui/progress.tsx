import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";

import { cn } from "../../lib/core/utils/utils";

/**
 * Progress bar component
 * Used to display work progress for activities
 */
const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> & {
    /**
     * Optional indicator class name for styling the progress bar
     */
    indicatorClassName?: string;
    /**
     * Whether to show the percentage text inside the progress bar
     */
    showPercentage?: boolean;
    /**
     * Optional text to display instead of or alongside the percentage
     */
    labelText?: string;
    /**
     * Color variant for the progress bar
     */
    variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
    /**
     * Size variant for the progress bar
     */
    size?: 'sm' | 'md' | 'lg';
  }
>(({ 
  className, 
  value = 0, 
  indicatorClassName, 
  showPercentage = false, 
  labelText, 
  variant = 'default', 
  size = 'md',
  ...props 
}, ref) => {
  const variantStyles = {
    default: "bg-primary",
    success: "bg-green-500",
    warning: "bg-yellow-500",
    danger: "bg-red-500",
    info: "bg-blue-500",
  };

  const sizeStyles = {
    sm: "h-2",
    md: "h-4",
    lg: "h-6",
  };
  
  const textSizeStyles = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  const displayValue = Math.round(value || 0);
  
  return (
    <ProgressPrimitive.Root
      ref={ref}
      className={cn(
        "relative w-full overflow-hidden rounded-full bg-secondary",
        sizeStyles[size],
        className
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className={cn(
          "h-full w-full flex-1 transition-all",
          variantStyles[variant],
          indicatorClassName
        )}
        style={{ transform: `translateX(-${100 - displayValue}%)` }}
      >
        {(showPercentage || labelText) && (
          <div className={cn(
            "absolute inset-0 flex items-center justify-center text-white font-medium",
            textSizeStyles[size]
          )}>
            {labelText ? labelText : `${displayValue}%`}
          </div>
        )}
      </ProgressPrimitive.Indicator>
    </ProgressPrimitive.Root>
  );
});

Progress.displayName = ProgressPrimitive.Root.displayName;

export { Progress };

/**
 * Work progress component specifically for displaying work activities
 */
export const WorkProgress: React.FC<{
  /**
   * Current progress value (0-100)
   */
  value: number;
  /**
   * Label text to display (optional)
   */
  label?: string;
  /**
   * Whether to show the percentage text
   */
  showPercentage?: boolean;
  /**
   * Whether the progress is indeterminate
   */
  indeterminate?: boolean;
  /**
   * Optional className for styling
   */
  className?: string;
}> = ({ 
  value, 
  label, 
  showPercentage = true, 
  indeterminate = false,
  className 
}) => {
  // Determine color based on progress
  const getColorVariant = (progress: number): 'default' | 'success' | 'warning' | 'danger' | 'info' => {
    if (progress < 25) return 'danger';
    if (progress < 50) return 'warning';
    if (progress < 75) return 'info';
    return 'success';
  };

  return (
    <div className={cn("w-full space-y-1", className)}>
      {label && (
        <div className="flex justify-between text-sm">
          <span>{label}</span>
          {showPercentage && <span>{Math.round(value)}%</span>}
        </div>
      )}
      {indeterminate ? (
        <div className="h-4 w-full bg-secondary animate-pulse rounded-full">
          <div className="h-full bg-blue-500 rounded-full animate-progress-indeterminate" />
        </div>
      ) : (
        <Progress 
          value={value} 
          variant={getColorVariant(value)}
          showPercentage={showPercentage && !label}
          size="md"
        />
      )}
    </div>
  );
}; 