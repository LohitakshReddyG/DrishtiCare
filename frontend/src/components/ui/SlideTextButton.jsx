import React from 'react';
import { motion } from "motion/react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export default function SlideTextButton({
  text = "Continue",
  hoverText,
  icon: Icon,
  className,
  variant = "default",
  ...props
}) {
  const slideText = hoverText ?? text;
  
  const variantStyles = variant === "ghost" 
    ? "border border-border-soft text-espresso hover:bg-sand/30" 
    : "bg-forest text-cream hover:bg-forest-hover shadow-sm hover:shadow border border-sage/40";
    
  return (
    <motion.button 
      className={cn(
        "group relative inline-flex items-center justify-center overflow-hidden rounded-xl font-medium tracking-tight transition-all duration-300",
        variantStyles,
        className
      )}
      whileTap={{ scale: 0.95 }}
      {...props}
    >
      <span className="relative inline-block transition-transform duration-300 ease-in-out group-hover:-translate-y-full">
        <span className="flex items-center justify-center gap-2 opacity-100 transition-opacity duration-300 group-hover:opacity-0">
          {Icon && <Icon className="w-5 h-5 flex-shrink-0" />}
          <span>{text}</span>
        </span>
        <span className="absolute top-full left-0 flex items-center justify-center w-full h-full gap-2 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          {Icon && <Icon className="w-5 h-5 flex-shrink-0" />}
          <span>{slideText}</span>
        </span>
      </span>
    </motion.button>
  );
}
