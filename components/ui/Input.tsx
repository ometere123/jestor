import { cn } from "@/lib/utils/cn";
import { forwardRef, type InputHTMLAttributes } from "react";

const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "w-full border-2 border-[#121212] bg-white px-3 py-2 text-[#121212] font-mono text-sm",
        "focus:outline-none focus:ring-2 focus:ring-[#0057FF] focus:ring-offset-0",
        "placeholder:text-[#C99A6B] shadow-[2px_2px_0px_#121212]",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";
export default Input;
