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
    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center justify-between mb-3">
        <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
          <Icon className="h-5 w-5 text-gray-600" />
        </div>
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">{title}</span>
      </div>
      <div className="flex flex-col space-y-1">
        <div className="text-2xl font-bold text-gray-900">{value}</div>
        {children && (
          <div className="text-sm text-gray-600">{children}</div>
        )}
      </div>
    </div>
  );
};

export default StatCard; 