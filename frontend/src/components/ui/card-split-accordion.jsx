'use client';
import React, { useState } from 'react';
import { motion, MotionConfig, useReducedMotion } from 'motion/react';
import { ChevronDown } from 'lucide-react';
import useMeasure from 'react-use-measure';

const springTransition = {
  type: 'spring',
  stiffness: 600,
  damping: 50,
  mass: 1,
};

const fadeTransition = {
  duration: 0.15,
  ease: 'easeOut',
};

const AccordionItem = ({
  item,
  setOpenId,
  index,
  total,
  openIndex,
  reduceMotion,
}) => {
  const [ref, bounds] = useMeasure();
  const isOpen = index === openIndex;

  const isFirst = index === 0;
  const isLast = index === total - 1;
  const isBeforeOpen = index === openIndex - 1;
  const isAfterOpen = index === openIndex + 1;
  const isAlone = (isAfterOpen && isLast) || (isBeforeOpen && isFirst);

  const BORDER_WIDTH = '1px';
  const borderTopWidth = isFirst || isAfterOpen || isOpen ? BORDER_WIDTH : '0px';
  const borderBottomWidth = isLast || isBeforeOpen || isOpen ? BORDER_WIDTH : '0px';

  let borderTopLeftRadius = 0;
  let borderTopRightRadius = 0;
  let borderBottomLeftRadius = 0;
  let borderBottomRightRadius = 0;

  if (isOpen || isAlone) {
    borderTopLeftRadius = 20;
    borderTopRightRadius = 20;
    borderBottomLeftRadius = 20;
    borderBottomRightRadius = 20;
  } else if (isBeforeOpen) {
    borderBottomLeftRadius = 20;
    borderBottomRightRadius = 20;
  } else if (isAfterOpen) {
    borderTopLeftRadius = 20;
    borderTopRightRadius = 20;
  } else if (isFirst) {
    borderTopLeftRadius = 20;
    borderTopRightRadius = 20;
  } else if (isLast) {
    borderBottomLeftRadius = 20;
    borderBottomRightRadius = 20;
  }

  return (
    <MotionConfig transition={reduceMotion ? fadeTransition : springTransition}>
      <motion.li layout={!reduceMotion}>
        <motion.div
          animate={
            reduceMotion
              ? {}
              : {
                  borderTopLeftRadius,
                  borderTopRightRadius,
                  borderBottomLeftRadius,
                  borderBottomRightRadius,
                }
          }
          className="overflow-hidden border border-border-soft bg-sand/30 will-change-transform"
          style={{
            borderTopWidth,
            borderBottomWidth,
            marginBlock: isOpen ? '10px' : '0px',
          }}
        >
          <button
            type="button"
            onClick={() => setOpenId(isOpen ? null : item.id)}
            className="flex w-full cursor-pointer items-center justify-between px-4 py-3 text-left"
          >
            <span className="text-sm font-bold text-espresso md:text-base pr-4">
              {item.title}
            </span>
            <motion.div animate={{ rotate: reduceMotion ? 0 : isOpen ? 180 : 0 }}>
              <ChevronDown className="size-5 text-dark-brown/60 flex-shrink-0" />
            </motion.div>
          </button>

          <motion.div
            initial={false}
            animate={{
              height: isOpen ? bounds.height : 0,
              opacity: isOpen ? 1 : 0,
            }}
            transition={reduceMotion ? fadeTransition : undefined}
            className="overflow-hidden will-change-transform"
          >
            <div ref={ref}>
              <div className="px-4 pb-4 text-xs text-dark-brown/80 leading-relaxed md:text-sm">
                {item.content}
              </div>
            </div>
          </motion.div>
        </motion.div>
      </motion.li>
    </MotionConfig>
  );
};

export const AccordionApp = ({ items = [] }) => {
  const reduceMotion = useReducedMotion();
  const normalizedItems = items.map((item, index) => ({
    id: item.id ?? `faq-${index}`,
    title: item.title,
    content: item.content,
  }));

  const [openId, setOpenId] = useState(null);
  const openIndex = normalizedItems.findIndex((item) => item.id === openId);

  if (normalizedItems.length === 0) {
    return (
      <p className="text-sm text-dark-brown/60 text-center py-4">No FAQ items available.</p>
    );
  }

  return (
    <ul className="w-full space-y-0">
      {normalizedItems.map((item, index) => (
        <AccordionItem
          key={item.id}
          item={item}
          setOpenId={setOpenId}
          index={index}
          total={normalizedItems.length}
          openIndex={openIndex}
          reduceMotion={reduceMotion}
        />
      ))}
    </ul>
  );
};
