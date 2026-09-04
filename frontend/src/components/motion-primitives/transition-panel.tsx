'use client';
import {
  AnimatePresence,
  Transition,
  Variant,
  motion,
  MotionProps,
  useReducedMotion,
} from 'motion/react';
import { cn } from '@/lib/utils';
import { motionTransition, reducedInstantVariants } from '@/lib/motion';

export type TransitionPanelProps = {
  children: React.ReactNode[];
  className?: string;
  transition?: Transition;
  activeIndex: number;
  variants?: { enter: Variant; center: Variant; exit: Variant };
} & MotionProps;

export function TransitionPanel({
  children,
  className,
  transition = { duration: 0.2, ease: 'easeInOut' },
  variants = {
    enter: { opacity: 0, y: 10 },
    center: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 },
  },
  activeIndex,
  ...motionProps
}: TransitionPanelProps) {
  const reduceMotion = useReducedMotion();
  const resolvedVariants = reduceMotion ? reducedInstantVariants : variants;
  const resolvedTransition = motionTransition(
    reduceMotion,
    transition,
    { duration: 0.12, ease: 'easeOut' }
  );

  return (
    <div className={cn('relative', className)}>
      <AnimatePresence initial={false} mode="popLayout" custom={motionProps.custom}>
        <motion.div
          key={activeIndex}
          variants={resolvedVariants}
          transition={resolvedTransition}
          initial="enter"
          animate="center"
          exit="exit"
          {...motionProps}
        >
          {children[activeIndex]}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
