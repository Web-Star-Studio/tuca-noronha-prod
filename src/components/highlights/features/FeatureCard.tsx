"use client";

import React from "react";
import { motion, Variants } from "framer-motion";

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  index: number;
}

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      type: "spring",
      stiffness: 100,
      damping: 15,
    },
  },
};

export default function FeatureCard({
  icon,
  title,
  description,
}: FeatureCardProps) {
  return (
    <motion.div
      className="flex flex-col items-center text-center p-8 rounded-2xl transition-all bg-white hover:bg-gray-50 hover:shadow-md"
      variants={cardVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.3, margin: "-20px" }}
      whileHover={{
        y: -8,
        transition: { duration: 0.3 },
      }}
    >
      <div className="mb-6 p-5 rounded-full bg-blue-100 text-blue-600 shadow-sm">
        {icon}
      </div>
      <h3 className="text-xl font-medium mb-3">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </motion.div>
  );
}
