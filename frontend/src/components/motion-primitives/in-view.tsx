'use client';
import { ReactNode, useRef, useState } from 'react';
import {
  motion,
  useInView,
  Variant,
  Transition,
  UseInViewOptions,
  useReducedMotion,
} from 'motion/react';
import { motionTransition, reducedFadeVariants, slideInVariants } from '@/lib/motion';

export type InViewProps = {
  children: ReactNode;
  variants?: {
    hidden: Variant;
    visible: Variant;
  };
  transition?: Transition;
  viewOptions?: UseInViewOptions;
  as?: React.ElementType;
  once?: boolean;
};

export function InView({
  children,
  variants,
  transition = { duration: 0.2 },
  viewOptions,
  as = 'div',
  once,
}: InViewProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, viewOptions);
  const reduceMotion = useReducedMotion();
  const [isViewed, setIsViewed] = useState(false);

  const resolvedVariants = reduceMotion
    ? reducedFadeVariants
    : variants ?? slideInVariants(false);

  const resolvedTransition = motionTransition(reduceMotion, transition);

  const MotionComponent = motion[as as keyof typeof motion] as typeof as;

  return (
    <MotionComponent
      ref={ref}
      initial="hidden"
      onAnimationComplete={() => {
        if (once) setIsViewed(true);
      }}
      animate={isInView || isViewed ? 'visible' : 'hidden'}
      variants={resolvedVariants}
      transition={resolvedTransition}
    >
      {children}
    </MotionComponent>
  );
}
