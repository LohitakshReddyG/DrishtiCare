import { motion } from "motion/react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export default function Loader({
  title = "Configuring...",
  subtitle = "Please wait",
  size = "md",
  className,
  ...props
}) {
  const sizeConfig = {
    sm: {
      container: "w-16 h-16",
      titleClass: "text-sm/tight font-medium",
      subtitleClass: "text-xs/relaxed",
      spacing: "space-y-1",
      maxWidth: "max-w-48",
    },
    md: {
      container: "w-24 h-24",
      titleClass: "text-base/snug font-medium",
      subtitleClass: "text-sm/relaxed",
      spacing: "space-y-2",
      maxWidth: "max-w-56",
    },
    lg: {
      container: "w-32 h-32",
      titleClass: "text-lg/tight font-semibold",
      subtitleClass: "text-base/relaxed",
      spacing: "space-y-3",
      maxWidth: "max-w-64",
    },
  };
  const config = sizeConfig[size] || sizeConfig.md;

  // Use the forest green color for the loader rings (#315C4B -> rgb(49, 92, 75))
  const ringColor = "rgb(49, 92, 75)";
  const ringColorLight = "rgba(49, 92, 75, 0.5)";

  return (
    <div
      className={cn("flex flex-col items-center justify-center gap-6 p-6", className)}
      {...props}
    >
      <motion.div
        animate={{ scale: [1, 1.02, 1] }}
        className={cn("relative", config.container)}
        transition={{ duration: 4, repeat: Infinity, ease: [0.4, 0, 0.6, 1] }}
      >
        <motion.div
          animate={{ rotate: [0, 360] }}
          className="absolute inset-0 rounded-full"
          style={{
            background: `conic-gradient(from 0deg, transparent 0deg, ${ringColor} 90deg, transparent 180deg)`,
            mask: "radial-gradient(circle at 50% 50%, transparent 35%, black 37%, black 39%, transparent 41%)",
            WebkitMask: "radial-gradient(circle at 50% 50%, transparent 35%, black 37%, black 39%, transparent 41%)",
            opacity: 0.8,
          }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        />
        <motion.div
          animate={{ rotate: [0, 360] }}
          className="absolute inset-0 rounded-full"
          style={{
            background: `conic-gradient(from 0deg, transparent 0deg, ${ringColor} 120deg, ${ringColorLight} 240deg, transparent 360deg)`,
            mask: "radial-gradient(circle at 50% 50%, transparent 42%, black 44%, black 48%, transparent 50%)",
            WebkitMask: "radial-gradient(circle at 50% 50%, transparent 42%, black 44%, black 48%, transparent 50%)",
            opacity: 0.9,
          }}
          transition={{ duration: 2.5, repeat: Infinity, ease: [0.4, 0, 0.6, 1] }}
        />
        <motion.div
          animate={{ rotate: [0, -360] }}
          className="absolute inset-0 rounded-full"
          style={{
            background: `conic-gradient(from 180deg, transparent 0deg, ${ringColorLight} 45deg, transparent 90deg)`,
            mask: "radial-gradient(circle at 50% 50%, transparent 52%, black 54%, black 56%, transparent 58%)",
            WebkitMask: "radial-gradient(circle at 50% 50%, transparent 52%, black 54%, black 56%, transparent 58%)",
            opacity: 0.35,
          }}
          transition={{ duration: 4, repeat: Infinity, ease: [0.4, 0, 0.6, 1] }}
        />
        <motion.div
          animate={{ rotate: [0, 360] }}
          className="absolute inset-0 rounded-full"
          style={{
            background: `conic-gradient(from 270deg, transparent 0deg, rgba(49, 92, 75, 0.4) 20deg, transparent 40deg)`,
            mask: "radial-gradient(circle at 50% 50%, transparent 61%, black 62%, black 63%, transparent 64%)",
            WebkitMask: "radial-gradient(circle at 50% 50%, transparent 61%, black 62%, black 63%, transparent 64%)",
            opacity: 0.5,
          }}
          transition={{ duration: 3.5, repeat: Infinity, ease: "linear" }}
        />
      </motion.div>

      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className={cn("text-center", config.spacing, config.maxWidth)}
        initial={{ opacity: 0, y: 8 }}
        transition={{ delay: 0.1, duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
      >
        <motion.h2
          animate={{ opacity: 1, y: 0 }}
          className={cn(config.titleClass, "text-espresso tracking-tight")}
          initial={{ opacity: 0, y: 8 }}
          transition={{ delay: 0.2, duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
        >
          <motion.span
            animate={{ opacity: [0.9, 0.7, 0.9] }}
            transition={{ duration: 3, repeat: Infinity, ease: [0.4, 0, 0.6, 1] }}
          >
            {title}
          </motion.span>
        </motion.h2>
        {subtitle && (
          <motion.p
            animate={{ opacity: 1, y: 0 }}
            className={cn(config.subtitleClass, "text-espresso/70")}
            initial={{ opacity: 0, y: 4 }}
            transition={{ delay: 0.3, duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
          >
            <motion.span
              animate={{ opacity: [0.7, 0.5, 0.7] }}
              transition={{ duration: 4, repeat: Infinity, ease: [0.4, 0, 0.6, 1] }}
            >
              {subtitle}
            </motion.span>
          </motion.p>
        )}
      </motion.div>
    </div>
  );
}
