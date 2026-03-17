import React from "react";
import { motion, HTMLMotionProps } from "motion/react";
import { cn } from "../../lib/utils";

export const Card = React.forwardRef<HTMLDivElement, HTMLMotionProps<"div">>(
  ({ className, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "rounded-3xl glass-card p-6 transition-all duration-300",
          className,
        )}
        {...props}
      />
    );
  },
);
Card.displayName = "Card";
