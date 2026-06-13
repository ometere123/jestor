import { cn } from "@/lib/utils/cn";
import { type ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "danger" | "ghost" | "blue" | "green";
  size?: "sm" | "md" | "lg";
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "relative inline-flex items-center justify-center font-bold uppercase tracking-wider border-2 border-[#121212] transition-all duration-150",
          "active:translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed",
          // shadow offset style
          "shadow-[3px_3px_0px_#121212] hover:shadow-[1px_1px_0px_#121212] hover:translate-x-0.5 hover:translate-y-0.5",
          {
            primary: "bg-[#FFE600] text-[#121212]",
            danger: "bg-[#FF3B30] text-white",
            ghost: "bg-transparent text-[#121212] border-dashed",
            blue: "bg-[#0057FF] text-white",
            green: "bg-[#35E36D] text-[#121212]",
          }[variant],
          {
            sm: "px-3 py-1.5 text-xs",
            md: "px-5 py-2.5 text-sm",
            lg: "px-7 py-3.5 text-base",
          }[size],
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
export default Button;
