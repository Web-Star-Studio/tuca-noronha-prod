"use client";

import React from "react";
import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";

type HeroScrollIndicatorProps = {
  scrollProgress: number;
  scrollToNextSection: () => void;
};

const HeroScrollIndicator: React.FC<HeroScrollIndicatorProps> = ({
  scrollProgress,
  scrollToNextSection,
}) => {
  return (
    <motion.div
      animate={{
        opacity: 1 - scrollProgress * 3,
        y: scrollProgress * 50,
      }}
      onClick={scrollToNextSection}
      whileHover={{ y: 5 }}
      transition={{ duration: 0.2 }}
      className="absolute bottom-12 md:bottom-16 lg:bottom-24 left-1/2 -translate-x-1/2 flex flex-col items-center cursor-pointer z-20"
    >
      <motion.div
        className="text-white/90 text-sm font-light mb-3 tracking-wide"
        initial={{ opacity: 0, y: -5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.5, duration: 0.5 }}
      >
        Role para explorar
      </motion.div>
      <motion.div
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 1.7, duration: 0.5 }}
      >
        <ChevronDown className="text-white h-6 w-6 animate-bounce" />
      </motion.div>
    </motion.div>
  );
};

export default React.memo(HeroScrollIndicator);
