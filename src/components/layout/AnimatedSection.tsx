"use client";

import React from "react";
import { motion, Variants } from "framer-motion";

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6 },
  },
};

export default function AnimatedSection({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      variants={itemVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.05, margin: "0px 0px -200px 0px" }}
    >
      {children}
    </motion.div>
  );
}