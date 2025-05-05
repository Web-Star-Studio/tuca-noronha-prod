"use client";

import React, { useMemo } from "react";
import { motion, Variants } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const HERO_TITLES = [
  "Descubra o Paraíso",
  "Experiências Exclusivas",
  "Águas Cristalinas",
];

const HERO_SUBTITLES = [
  "Fernando de Noronha como você nunca viu antes.",
  "Momentos únicos no arquipélago mais preservado do Brasil.",
  "Mergulhe em um dos mares mais ricos em biodiversidade do mundo.",
];

type HeroContentProps = {
  currentImageIndex: number;
  scrollProgress: number;
};

const textVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: (custom: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: custom * 0.2, duration: 0.8, ease: "easeOut" },
  }),
};

const HeroContent = React.memo(({ currentImageIndex, scrollProgress }: HeroContentProps) => {
  const title = useMemo(() => HERO_TITLES[currentImageIndex], [currentImageIndex]);
  const subtitle = useMemo(() => HERO_SUBTITLES[currentImageIndex], [currentImageIndex]);
  const fadeStyle = useMemo(() => ({ opacity: Math.max(1 - scrollProgress * 2, 0) }), [scrollProgress]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
      className="container mx-auto px-4 sm:px-6 lg:px-8 text-center max-w-4xl relative z-20"
    >
      <motion.h1
        custom={0}
        initial="hidden"
        animate="visible"
        variants={textVariants}
        className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-medium tracking-tight mb-6 text-white text-shadow-lg"
        style={fadeStyle}
      >
        {title}
      </motion.h1>

      <motion.p
        custom={1}
        initial="hidden"
        animate="visible"
        variants={textVariants}
        className="text-lg sm:text-xl md:text-2xl font-light mb-8 md:mb-12 text-white/90 text-shadow-sm leading-relaxed max-w-3xl mx-auto"
        style={fadeStyle}
      >
        {subtitle}
      </motion.p>

      <motion.div
        custom={2}
        initial="hidden"
        animate="visible"
        variants={textVariants}
        className="flex flex-col sm:flex-row gap-5 justify-center items-center"
        style={fadeStyle}
      >
        <Link href="/passeios" passHref>
          <Button
            asChild
            className="rounded-full px-7 py-6 sm:px-8 sm:py-7 bg-white text-foreground hover:bg-white/90 transition-all duration-300 group relative overflow-hidden w-full sm:w-auto min-w-[200px]"
            size="lg"
          >
            <div>
              <span className="relative z-10 font-medium text-base">Explorar Passeios</span>
              <span className="absolute inset-0 bg-blue-400 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-500" />
              <ArrowRight className="ml-2 h-5 w-5 relative z-10 group-hover:translate-x-1 transition-transform" />
            </div>
          </Button>
        </Link>

        <Link href="/pacotes" passHref>
          <Button
            asChild
            className="rounded-full px-7 py-6 sm:px-8 sm:py-7 bg-transparent backdrop-blur-md hover:bg-white/10 text-white border border-white/30 w-full sm:w-auto min-w-[200px]"
            size="lg"
          >
            <span className="font-medium text-base">Ver Pacotes</span>
          </Button>
        </Link>
      </motion.div>
    </motion.div>
  );
});

HeroContent.displayName = 'HeroContent';
export default HeroContent;
export { HERO_TITLES, HERO_SUBTITLES };
