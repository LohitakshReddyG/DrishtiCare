'use client';
import { cn } from '@/lib/utils';
import { motion, SpringOptions, useSpring, useTransform, useReducedMotion } from 'motion/react';
import { useEffect, useState } from 'react';

export type AnimatedNumberProps = {
  value: number;
  className?: string;
  springOptions?: SpringOptions;
  as?: React.ElementType;
};

export function AnimatedNumber({
  value,
  className,
  springOptions = { stiffness: 90, damping: 50 },
  as = 'span',
}: AnimatedNumberProps) {
  const reduceMotion = useReducedMotion();
  const MotionComponent = motion.create(as as keyof JSX.IntrinsicElements);
  const spring = useSpring(value, springOptions);
  const display = useTransform(spring, (current) =>
    Math.round(current).toLocaleString()
  );
  const [text, setText] = useState(() => Math.round(value).toLocaleString());

  useEffect(() => {
    if (reduceMotion) {
      setText(Math.round(value).toLocaleString());
      return;
    }
    spring.set(value);
  }, [spring, value, reduceMotion]);

  useEffect(() => {
    if (reduceMotion) return;
    const unsubscribe = display.on('change', (v) => setText(v));
    return () => unsubscribe();
  }, [display, reduceMotion]);

  return (
    <MotionComponent className={cn('tabular-nums', className)}>
      {text}
    </MotionComponent>
  );
}
