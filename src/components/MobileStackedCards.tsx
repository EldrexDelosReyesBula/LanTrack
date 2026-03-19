import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Card } from "./ui/Card";

interface StackedCardProps {
  cards: React.ReactNode[];
}

export function MobileStackedCards({ cards }: StackedCardProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % cards.length);
  };

  return (
    <div className="relative h-48 w-full md:hidden mt-8" onClick={handleNext}>
      <AnimatePresence>
        {cards.map((card, index) => {
          // Calculate relative position
          let relativeIndex = index - currentIndex;
          if (relativeIndex < 0) relativeIndex += cards.length;

          // Only show top 3 cards
          if (relativeIndex > 2) return null;

          const isTop = relativeIndex === 0;
          const scale = 1 - relativeIndex * 0.05;
          const yOffset = relativeIndex * -16;
          const zIndex = cards.length - relativeIndex;
          const opacity = 1 - relativeIndex * 0.2;

          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{
                opacity,
                scale,
                y: yOffset,
                zIndex,
              }}
              exit={{ opacity: 0, scale: 0.8, y: -20 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="absolute top-0 left-0 w-full cursor-pointer"
              style={{ transformOrigin: "top center" }}
            >
              {card}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
