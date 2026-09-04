"use client";

import { Minus, Plus } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useRef, useState, useEffect } from "react";

const AVATAR_OVERLAP = 12;

const animations = {
  avatar: {
    visible: { opacity: 1, scale: 1, transition: { type: "spring", stiffness: 260, damping: 22, mass: 0.6 } },
    hidden: { opacity: 0, scale: 0.85, transition: { duration: 0.18, ease: "easeOut" } },
  },
  vibration: {
    idle: { x: 0 },
    shake: { x: [-3, 3, -2, 2, 0], transition: { duration: 0.28, ease: "easeOut" } },
  },
};

export default function TeamSelector({
  maxTeamSize = 10,
  value,
  onChange,
  label = "Tele-Ophthalmologists",
  className = "",
}) {
  const [peopleCount, setPeopleCount] = useState(value || 1);
  const [isVibrating, setIsVibrating] = useState(false);
  const directionRef = useRef(1);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (value !== undefined && value !== peopleCount) {
      setPeopleCount(value);
    }
  }, [value, peopleCount]);

  const triggerVibration = () => {
    if (prefersReducedMotion) return;
    setIsVibrating(true);
    setTimeout(() => setIsVibrating(false), 280);
  };

  const handleIncrement = (e) => {
    e.preventDefault();
    if (peopleCount < maxTeamSize) {
      directionRef.current = 1;
      const newCount = peopleCount + 1;
      setPeopleCount(newCount);
      onChange?.(newCount);
    } else {
      triggerVibration();
    }
  };

  const handleDecrement = (e) => {
    e.preventDefault();
    if (peopleCount > 1) {
      directionRef.current = -1;
      const newCount = peopleCount - 1;
      setPeopleCount(newCount);
      onChange?.(newCount);
    } else {
      triggerVibration();
    }
  };

  const handleKeyDown = (e, action) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (action === "increment") handleIncrement(e);
      else handleDecrement(e);
    }
  };

  const counterDistance = prefersReducedMotion ? 0 : 10;
  
  // Generating generic solid color circles instead of fetching images for speed and reliability.
  const getAvatarColor = (idx) => {
    const colors = ["bg-forest", "bg-terracotta", "bg-gold", "bg-sage", "bg-dark-brown", "bg-espresso", "bg-sage-dark", "bg-terracotta-dark", "bg-forest-hover", "bg-charcoal"];
    return colors[idx % colors.length];
  };

  // Generate an array up to maxTeamSize
  const members = Array.from({ length: maxTeamSize }).map((_, i) => ({ id: `member-${i}` }));

  return (
    <div className={`flex w-full flex-col ${className}`}>
      <div className="w-full rounded-2xl border border-border-soft bg-cream p-5 shadow-sm">
        <fieldset>
          <legend className="mb-5 w-full font-bold text-xs text-espresso tracking-wider uppercase">
            {label}
          </legend>

          <div className="mb-7 flex justify-center">
            <div className="flex items-center">
              {members.map((member, index) => (
                <motion.div
                  key={member.id}
                  animate={index < peopleCount ? "visible" : "hidden"}
                  initial={index < peopleCount ? "visible" : "hidden"}
                  variants={animations.avatar}
                  className="flex items-center justify-center"
                  style={{
                    marginLeft: index === 0 ? 0 : -AVATAR_OVERLAP,
                    zIndex: maxTeamSize - index,
                  }}
                >
                  <div className={`w-11 h-11 rounded-full border-2 border-cream ${getAvatarColor(index)} flex items-center justify-center text-cream font-bold text-xs shadow-sm ring-1 ring-border-soft`}>
                    Dr
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <motion.div
            animate={isVibrating ? "shake" : "idle"}
            initial="idle"
            variants={animations.vibration}
            className="flex items-center justify-center gap-5"
          >
            <button
              type="button"
              onClick={handleDecrement}
              onKeyDown={(e) => handleKeyDown(e, "decrement")}
              disabled={peopleCount <= 1}
              aria-label="Decrease team size"
              className="flex w-9 h-9 items-center justify-center rounded-xl border border-border-soft bg-sand/30 text-espresso transition-all hover:bg-sand/60 hover:border-dark-brown/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest active:bg-sand disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Minus aria-hidden="true" className="w-3.5 h-3.5" strokeWidth={2} />
            </button>

            <div className="flex min-w-[64px] flex-col items-center">
              <div className="relative h-9 overflow-hidden">
                <AnimatePresence initial={false} mode="popLayout">
                  <motion.output
                    key={peopleCount}
                    initial={{ opacity: 0, y: directionRef.current * counterDistance }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: directionRef.current * -counterDistance, transition: { duration: 0.14, ease: "easeIn" } }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    aria-live="polite"
                    className="block select-none font-semibold text-3xl text-espresso tabular-nums"
                  >
                    {peopleCount}
                  </motion.output>
                </AnimatePresence>
              </div>
              <span className="text-[11px] text-dark-brown/60">
                {peopleCount === 1 ? "specialist" : "specialists"}
              </span>
            </div>

            <button
              type="button"
              onClick={handleIncrement}
              onKeyDown={(e) => handleKeyDown(e, "increment")}
              disabled={peopleCount >= maxTeamSize}
              aria-label="Increase team size"
              className="flex w-9 h-9 items-center justify-center rounded-xl border border-border-soft bg-sand/30 text-espresso transition-all hover:bg-sand/60 hover:border-dark-brown/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest active:bg-sand disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Plus aria-hidden="true" className="w-3.5 h-3.5" strokeWidth={2} />
            </button>
          </motion.div>
        </fieldset>
      </div>
    </div>
  );
}
