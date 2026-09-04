"use client";

import { Check, ChevronRight, User2 } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useState } from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const AVATAR_RGB = {
  1: "49, 92, 75",  // forest
  2: "183, 110, 84", // terracotta
  3: "83, 58, 45",   // dark-brown
  4: "156, 175, 150", // sage
};

const avatars = [
  {
    id: 1,
    alt: "Avatar 1",
    svg: (
      <svg aria-label="Avatar 1" fill="none" height="40" viewBox="0 0 36 36" width="40">
        <rect fill="#315C4B" height="36" width="36" rx="18" />
        <circle cx="18" cy="14" r="6" fill="#F8F3EA" />
        <path d="M9 28c0-4.97 4.03-9 9-9s9 4.03 9 9" stroke="#F8F3EA" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 2,
    alt: "Avatar 2",
    svg: (
      <svg aria-label="Avatar 2" fill="none" height="40" viewBox="0 0 36 36" width="40">
        <rect fill="#B76E54" height="36" width="36" rx="18" />
        <circle cx="18" cy="14" r="6" fill="#F8F3EA" />
        <path d="M9 28c0-4.97 4.03-9 9-9s9 4.03 9 9" stroke="#F8F3EA" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 3,
    alt: "Avatar 3",
    svg: (
      <svg aria-label="Avatar 3" fill="none" height="40" viewBox="0 0 36 36" width="40">
        <rect fill="#533A2D" height="36" width="36" rx="18" />
        <circle cx="18" cy="14" r="6" fill="#F8F3EA" />
        <path d="M9 28c0-4.97 4.03-9 9-9s9 4.03 9 9" stroke="#F8F3EA" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 4,
    alt: "Avatar 4",
    svg: (
      <svg aria-label="Avatar 4" fill="none" height="40" viewBox="0 0 36 36" width="40">
        <rect fill="#9CAF96" height="36" width="36" rx="18" />
        <circle cx="18" cy="14" r="6" fill="#F8F3EA" />
        <path d="M9 28c0-4.97 4.03-9 9-9s9 4.03 9 9" stroke="#F8F3EA" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
];

export default function AvatarPicker({ onComplete, className }) {
  const [selectedAvatar, setSelectedAvatar] = useState(avatars[0]);
  const [username, setUsername] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  const handleAvatarSelect = (avatar) => {
    if (avatar.id === selectedAvatar.id) return;
    setSelectedAvatar(avatar);
  };

  const handleSubmit = () => {
    if (username.trim() && onComplete) {
      onComplete({ username: username.trim(), avatarId: selectedAvatar.id });
    }
  };

  const isValid = username.trim().length >= 3;
  const showError = username.trim().length > 0 && username.trim().length < 3;
  const rgb = AVATAR_RGB[selectedAvatar.id];

  return (
    <div className={cn("relative mx-auto w-full max-w-[400px] border border-border-soft bg-cream rounded-xl shadow-sm p-8", className)}>
      <div className="space-y-8">
        <div className="space-y-1 text-center">
          <h2 className="font-semibold text-xl tracking-tight text-espresso">Pick Your Avatar</h2>
          <p className="text-dark-brown/60 text-sm">Choose one to get started</p>
        </div>

        <div className="flex flex-col items-center gap-4">
          <div className="relative h-40 w-40">
            <motion.div
              animate={{ boxShadow: `0 0 0 2px rgba(${rgb}, 0.55), 0 6px 24px rgba(${rgb}, 0.18)` }}
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 rounded-full"
              transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.45, ease: "easeOut" }}
            />
            <div className="relative h-full w-full overflow-hidden rounded-full">
              <AnimatePresence mode="wait">
                <motion.div
                  key={selectedAvatar.id}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  initial={{ opacity: 0 }}
                  className="absolute inset-0 flex items-center justify-center"
                  transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.2, ease: "easeOut" }}
                >
                  <div className="scale-[4] transform">{selectedAvatar.svg}</div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.span
              key={selectedAvatar.id}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              initial={{ opacity: 0 }}
              className="text-[11px] text-dark-brown/60 uppercase tracking-[0.12em]"
              transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.16, ease: "easeOut" }}
            >
              {selectedAvatar.alt}
            </motion.span>
          </AnimatePresence>

          <motion.div
            initial="initial"
            animate="animate"
            variants={{
              initial: { opacity: 0 },
              animate: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.05 } }
            }}
            className="flex gap-3"
          >
            {avatars.map((avatar) => {
              const isSelected = selectedAvatar.id === avatar.id;
              return (
                <motion.button
                  key={avatar.id}
                  aria-label={`Select ${avatar.alt}`}
                  aria-pressed={isSelected}
                  onClick={() => handleAvatarSelect(avatar)}
                  className={cn(
                    "relative h-14 w-14 overflow-hidden rounded-xl border bg-sand/30 transition-[opacity,box-shadow] duration-200 ease-out",
                    isSelected ? "border-forest opacity-100 ring-2 ring-forest/70 ring-offset-2 ring-offset-cream" : "border-border-soft opacity-50 hover:opacity-100"
                  )}
                  type="button"
                  variants={{
                    initial: { opacity: 0, y: 6 },
                    animate: { opacity: 1, y: 0, transition: { duration: 0.28, ease: "easeOut" } }
                  }}
                  whileHover={shouldReduceMotion ? {} : { scale: 1.06 }}
                  whileTap={shouldReduceMotion ? {} : { scale: 0.94 }}
                >
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="scale-[2.3] transform">{avatar.svg}</div>
                  </div>
                  {isSelected && (
                    <div className="absolute -right-0.5 -bottom-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-forest">
                      <Check aria-hidden="true" className="h-3 w-3 text-cream" />
                    </div>
                  )}
                </motion.button>
              );
            })}
          </motion.div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-medium text-sm text-espresso" htmlFor="username">Username</label>
              <span className={cn(
                "text-xs tabular-nums transition-colors duration-200 ease-out",
                username.length >= 18 ? "text-terracotta" : "text-dark-brown/50"
              )}>
                {username.length}/20
              </span>
            </div>
            <div className="relative">
              <input
                autoComplete="username"
                className={cn(
                  "h-10 w-full pl-9 pr-4 rounded-xl border bg-sand/30 text-sm focus:outline-none focus:ring-2",
                  showError ? "border-terracotta/50 focus:ring-terracotta" : "border-border-soft focus:ring-forest"
                )}
                id="username"
                maxLength={20}
                onBlur={() => setIsFocused(false)}
                onChange={(e) => setUsername(e.target.value)}
                onFocus={() => setIsFocused(true)}
                placeholder="your_username…"
                spellCheck={false}
                type="text"
                value={username}
              />
              <User2
                aria-hidden="true"
                className={cn(
                  "absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transition-colors duration-200 ease-out",
                  isFocused ? "text-forest" : "text-dark-brown/50"
                )}
              />
            </div>
            <AnimatePresence>
              {showError && (
                <motion.p
                  animate={{ opacity: 1, y: 0 }}
                  className="ml-0.5 text-terracotta text-xs"
                  exit={{ opacity: 0, y: -4 }}
                  initial={{ opacity: 0, y: -4 }}
                  role="alert"
                  transition={{ duration: 0.15, ease: "easeOut" }}
                >
                  Username must be at least 3 characters
                </motion.p>
              )}
            </AnimatePresence>
          </div>
          <button
            className="group flex items-center justify-center h-11 w-full text-sm font-medium rounded-xl bg-forest text-cream hover:bg-forest-hover transition-colors disabled:opacity-50"
            disabled={!isValid}
            onClick={handleSubmit}
            type="button"
          >
            Get Started
            <ChevronRight aria-hidden="true" className="ml-1 h-4 w-4 transition-transform duration-200 ease-out group-hover:translate-x-0.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
