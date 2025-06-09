"use client";

import { motion } from "framer-motion";
import { cardStyles } from "@/lib/ui-config";
import { StatCardProps } from '../types/dashboard';

const StatCard: React.FC<StatCardProps> = ({ 
  icon: Icon, 
  title, 
  value, 
  color, 
  bgColor, 
  children 
}) => {
  return (
    <motion.div
      className={`${cardStyles.base} ${cardStyles.hover.lift} ${bgColor} p-4 flex flex-col`}
      whileHover={{ y: -5, boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-between mb-2">
        <div className={`w-10 h-10 rounded-full ${color} flex items-center justify-center`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
        <span className="text-xs font-medium text-gray-500 uppercase">{title}</span>
      </div>
      <div className="flex flex-col space-y-1">
        <div className="text-2xl font-bold">{value}</div>
        {children}
      </div>
    </motion.div>
  );
};

export default StatCard; 