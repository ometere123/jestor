import { cn } from "@/lib/utils/cn";
import { forwardRef, type TextareaHTMLAttributes } from "react";

const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "w-full border-2 border-[#121212] bg-white px-3 py-2 text-[#121212] font-mono text-sm resize-none",
        "focus:outline-none focus:ring-2 focus:ring-[#0057FF]",
        "placeholder:text-[#C99A6B] shadow-[2px_2px_0px_#121212]",
        className
      )}
      {...props}
    />
  )
);
Textarea.displayName = "Textarea";
export default Textarea;
