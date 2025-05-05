"use client";

import React, { useEffect, useState, useCallback, useRef, useMemo } from "react";
import {motion, useScroll, useTransform, useSpring} from 'framer-motion'
import Image from "next/image";

const HERO_IMAGES = [
  "https://images.unsplash.com/photo-1614722860207-909e0e8dfd99?q=80&w=2071&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  "https://images.unsplash.com/photo-1614723141070-2eec18977122?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  "https://images.unsplash.com/photo-1642846741306-1d9c79725bf8?q=80&w=1932&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
];

type HeroBackgroundProps = {
  currentImageIndex: number;
  scrollProgress: number;
};

const HeroBackground = React.memo(({ currentImageIndex, scrollProgress }: HeroBackgroundProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll({ target: containerRef });
  const [windowHeight, setWindowHeight] = useState(0);

  // Update window height for parallax
  useEffect(() => {
    const updateHeight = () => setWindowHeight(window.innerHeight);
    updateHeight();
    window.addEventListener("resize", updateHeight);
    return () => window.removeEventListener("resize", updateHeight);
  }, []);

  // Preload all hero images on mount
  const preload = useCallback(() => {
    HERO_IMAGES.forEach((src) => {
      const img = new window.Image();
      img.src = src;
    });
  }, []);

  useEffect(() => {
    preload();
  }, [preload]);

  // Define transform ranges at the top level
  const yRange0 = useTransform(scrollY, [0, windowHeight], [0, windowHeight * 0.3]);
  const yRange1 = useTransform(scrollY, [0, windowHeight], [0, windowHeight * 0.4]);
  const yRange2 = useTransform(scrollY, [0, windowHeight], [0, windowHeight * 0.25]);
  
  // Apply spring physics to make it smooth
  const ySpring0 = useSpring(yRange0, { damping: 20, stiffness: 100 });
  const ySpring1 = useSpring(yRange1, { damping: 20, stiffness: 100 });
  const ySpring2 = useSpring(yRange2, { damping: 20, stiffness: 100 });
  
  // Create array of spring motionValues
  const yOffsets = useMemo(() => {
    return [ySpring0, ySpring1, ySpring2];
  }, [ySpring0, ySpring1, ySpring2]);

  // Use scrollProgress to adjust opacity of background elements based on scroll
  const backgroundOpacity = 1 - scrollProgress * 0.5;
  
  return (
    <div ref={containerRef} className="absolute inset-0 w-full h-full overflow-hidden" style={{ opacity: backgroundOpacity }}>
      {HERO_IMAGES.map((src, index) => (
        <motion.div
          key={src}
          className="absolute inset-0 w-full h-full"
          initial={{ opacity: 0 }}
          animate={{
            opacity: index === currentImageIndex ? 1 : 0,
            scale: index === currentImageIndex ? 1.1 : 1,
            zIndex: index === currentImageIndex ? 2 : 1
          }}
          style={{ y: index === currentImageIndex ? yOffsets[index % 3] : 0 }}
          transition={{
            opacity: { duration: 0.5, ease: "easeInOut" },
            scale: { duration: 8, ease: "easeOut" },
          }}
        >
          <Image
            src={src}
            alt={`Fernando de Noronha - Cena ${index + 1}`}
            className="w-full h-full object-cover"
            width={1920}
            height={1080}
          />
          <div className="absolute inset-0 bg-black/50" />
        </motion.div>
      ))}

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-linear-to-b from-black/40 via-black/20 to-black/60 z-10" />
      {/* Animated shapes */}
      <div className="absolute right-0 top-1/4 w-64 h-64 rounded-full bg-tuca-ocean-blue/20 blur-3xl z-10 opacity-60 animate-pulse" style={{ animationDuration: '8s' }} />
      <div className="absolute left-10 bottom-1/4 w-52 h-52 rounded-full bg-tuca-light-blue/30 blur-3xl z-10 opacity-50 animate-pulse" style={{ animationDuration: '10s', animationDelay: '1s' }} />
      <div className="absolute left-1/4 top-1/3 w-40 h-40 rounded-full bg-tuca-deep-blue/20 blur-3xl z-10 opacity-40 animate-pulse" style={{ animationDuration: '12s', animationDelay: '2s' }} />
    </div>
  );
});

HeroBackground.displayName = 'HeroBackground';
export default HeroBackground;
export { HERO_IMAGES };
