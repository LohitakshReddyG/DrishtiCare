import type { Transition, Variant } from 'motion/react';

/** Fade-only variants when prefers-reduced-motion is active */
export const reducedFadeVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

export const reducedInstantVariants = {
  enter: { opacity: 1, y: 0 },
  center: { opacity: 1, y: 0 },
  exit: { opacity: 1, y: 0 },
};

export function motionTransition(
  reduced: boolean,
  normal: Transition,
  fallback: Transition = { duration: 0.15 }
): Transition {
  return reduced ? fallback : normal;
}

export function slideInVariants(
  reduced: boolean,
  y = 10
): { hidden: Variant; visible: Variant } {
  if (reduced) return reducedFadeVariants;
  return {
    hidden: { opacity: 0, y },
    visible: { opacity: 1, y: 0 },
  };
}
