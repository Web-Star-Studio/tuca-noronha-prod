"use client";

import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { HERO_IMAGES } from "./HeroBackground";

type HeroIndicatorsProps = {
  currentImageIndex: number;
  setCurrentImageIndex: (index: number) => void;
  scrollProgress: number;
  scrollToNextSection: () => void;
}

function HeroIndicators({
    currentImageIndex, setCurrentImageIndex, scrollProgress, scrollToNextSection,
}: HeroIndicatorsProps) {
    const indicators = useMemo(
        () => HERO_IMAGES.map((_, index) => (
            <button
                key={index}
                onClick={() => setCurrentImageIndex(index)}
                className={`h-2.5 rounded-full transition-all duration-500 ${index === currentImageIndex
                        ? "bg-white w-12"
                        : "bg-white/40 w-2.5 hover:bg-white/70"}`}
                aria-label={`Go to slide ${index + 1}`} />
        )),
        [currentImageIndex, setCurrentImageIndex]
    );

    return (
        <motion.div
            className="absolute bottom-8 md:bottom-12 left-1/2 -translate-x-1/2 flex space-x-3 z-20"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1 - scrollProgress * 2, y: 0 }}
            transition={{ delay: 1, duration: 0.6 }}
        >
            {indicators}
        </motion.div>
    );
}

HeroIndicators.displayName = 'HeroIndicators';
export default React.memo(HeroIndicators);
