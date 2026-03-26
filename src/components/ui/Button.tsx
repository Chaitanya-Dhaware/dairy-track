import * as React from "react"
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "danger" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    
    const baseStyles = "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";
    
    const variants: Record<string, string> = {
      default: "bg-primary text-white hover:bg-primary/90 shadow-sm",
      danger: "bg-danger text-white hover:bg-[#c94d4d] shadow-sm",
      outline: "border border-gray-200 bg-white hover:bg-gray-100 hover:text-gray-900",
      ghost: "hover:bg-gray-100 hover:text-gray-900",
    };

    const sizes: Record<string, string> = {
      default: "h-12 px-4 py-2",
      sm: "h-9 rounded-md px-3",
      lg: "h-14 rounded-xl px-8 text-lg font-semibold",
      icon: "h-10 w-10",
    };

    const compClass = cn(
      baseStyles,
      variants[variant],
      sizes[size],
      className
    );

    return (
      <button className={compClass} ref={ref} {...props} />
    )
  }
)
Button.displayName = "Button"

export { Button }
