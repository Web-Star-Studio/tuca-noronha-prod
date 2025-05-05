"use client";

import React from "react";
import { motion, Variants } from "framer-motion";

const sectionVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
    },
  },
};

export default function AnimatedContainer({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      variants={sectionVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      className="space-y-0"
    >
      {children}
    </motion.div>
  );
}
