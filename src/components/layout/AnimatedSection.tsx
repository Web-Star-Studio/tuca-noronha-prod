"use client";

import React from "react";
import { motion, Variants } from "framer-motion";

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8 },
  },
};

export default function AnimatedSection({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      variants={itemVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
      className=""
    >
      {children}
    </motion.div>
  );
}
