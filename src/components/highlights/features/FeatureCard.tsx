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
  hidden: { opacity: 0, y: 20 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.5,
      ease: "easeOut"
    },
  }),
};

export default function FeatureCard({
  icon,
  title,
  description,
  index,
}: FeatureCardProps) {
  return (
    <motion.div
      className="flex flex-col items-center text-center p-8 rounded-2xl transition-all bg-white hover:bg-gray-50 hover:shadow-md"
      custom={index}
      variants={cardVariants}
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