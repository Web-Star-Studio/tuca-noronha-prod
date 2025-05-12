"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useScroll, useSpring, useTransform } from "framer-motion";

import HeroBackground from "./HeroBackground";
import HeroContent from "./HeroContent";
import HeroScrollIndicator from "./HeroScrollIndicator";
import HeroIndicators from "./HeroIndicators";

const IMAGE_COUNT = 3;
const ROTATION_INTERVAL_MS = 7000;

const HeroSection = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Framer-motion scroll tracking
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });
  // Transform scroll progress to normalized range
  const transformedProgress = useTransform(scrollYProgress, [0, 1], [0, 1]);
  
  // Apply spring physics to make it smooth
  const scrollProgress = useSpring(transformedProgress, { damping: 20, stiffness: 100 });

  // Auto rotate images with smooth transition between last and first image
  useEffect(() => {
    const rotateImage = () => {
      setCurrentIndex((prev) => {
        // When reaching the last image, immediately prepare for transition to first
        if (prev === IMAGE_COUNT - 1) {
          // Schedule immediate transition to first image
          setTimeout(() => setCurrentIndex(0), 50);
          return prev;
        }
        return prev + 1;
      });
    };
    
    const interval = setInterval(rotateImage, ROTATION_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  // Scroll to next section
  const scrollToNext = useCallback(() => {
    const height = containerRef.current?.offsetHeight ?? 0;
    window.scrollTo({ top: height, behavior: "smooth" });
  }, []);

  // Extract the current numeric value for scrollProgress for components that expect a number
  const [scrollProgressValue, setScrollProgressValue] = useState(0);
  useEffect(() => {
    const unsubscribe = scrollProgress.on("change", (value) => setScrollProgressValue(value));
    return () => unsubscribe();
  }, [scrollProgress]);

  // Memoize props
  const backgroundProps = useMemo(
    () => ({ currentIndex, scrollProgress: scrollProgressValue }),
    [currentIndex, scrollProgressValue]
  );
  const contentProps = backgroundProps;
  const indicatorProps = useMemo(
    () => ({ scrollProgress: scrollProgressValue, scrollToNextSection: scrollToNext }),
    [scrollProgressValue, scrollToNext]
  );
  
  return (
    <section
      ref={containerRef}
      className="relative w-screen h-screen overflow-hidden"
    >
      <HeroBackground currentImageIndex={currentIndex} {...backgroundProps} />

      <div className="absolute inset-0 flex flex-col items-center justify-center z-20 w-full">
        <HeroContent currentImageIndex={currentIndex} {...contentProps} />
        <HeroScrollIndicator {...indicatorProps} />
      </div>

      <HeroIndicators 
        currentImageIndex={currentIndex} 
        setCurrentImageIndex={setCurrentIndex} 
        scrollToNextSection={scrollToNext} 
        scrollProgress={scrollProgressValue} 
      />
    </section>
  );
};

export default React.memo(HeroSection);
