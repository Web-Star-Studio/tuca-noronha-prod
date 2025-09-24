"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ReactNode } from "react";
import {
  ExclamationTriangleIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";

// Enhanced Loading Spinner
interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "default" | "gradient" | "pulse" | "dots";
  message?: string;
  className?: string;
}

export const LoadingSpinner = ({
  size = "md",
  variant = "default",
  message,
  className = "",
}: LoadingSpinnerProps) => {
  const sizeClasses = {
    sm: "w-6 h-6",
    md: "w-8 h-8",
    lg: "w-12 h-12",
    xl: "w-16 h-16",
  };

  const renderSpinner = () => {
    switch (variant) {
      case "gradient":
        return (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className={`${sizeClasses[size]} rounded-full bg-gradient-to-r from-blue-500 to-purple-600`}
            style={{
              background: "conic-gradient(from 0deg, #3b82f6, #8b5cf6, #3b82f6)",
            }}
          >
            <div
              className="w-full h-full rounded-full bg-white"
              style={{ margin: "2px" }}
            />
          </motion.div>
        );

      case "pulse":
        return (
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [1, 0.7, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className={`${sizeClasses[size]} rounded-full bg-blue-500`}
          />
        );

      case "dots":
        return (
          <div className="flex space-x-2">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                animate={{
                  y: [0, -8, 0],
                  opacity: [0.7, 1, 0.7],
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  delay: i * 0.2,
                }}
                className="w-3 h-3 rounded-full bg-blue-500"
              />
            ))}
          </div>
        );

      default:
        return (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className={`${sizeClasses[size]} border-4 border-blue-200 border-t-blue-600 rounded-full`}
          />
        );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`flex flex-col items-center justify-center space-y-4 ${className}`}
    >
      {renderSpinner()}
      {message && (
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-sm text-gray-600 text-center max-w-md"
        >
          {message}
        </motion.p>
      )}
    </motion.div>
  );
};

// Enhanced Skeleton Loader
interface SkeletonProps {
  variant?: "text" | "circle" | "rectangle" | "card" | "list";
  lines?: number;
  className?: string;
  animate?: boolean;
}

export const Skeleton = ({
  variant = "text",
  lines = 1,
  className = "",
  animate = true,
}: SkeletonProps) => {
  const baseClasses = animate
    ? "animate-pulse bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%]"
    : "bg-gray-200";

  const renderSkeleton = () => {
    switch (variant) {
      case "circle":
        return <div className={`rounded-full ${baseClasses} ${className}`} />;

      case "rectangle":
        return <div className={`rounded-md ${baseClasses} ${className}`} />;

      case "card":
        return (
          <div className={`space-y-4 ${className}`}>
            <div className={`h-48 rounded-lg ${baseClasses}`} />
            <div className="space-y-2">
              <div className={`h-4 rounded ${baseClasses}`} />
              <div className={`h-4 rounded w-3/4 ${baseClasses}`} />
              <div className={`h-4 rounded w-1/2 ${baseClasses}`} />
            </div>
          </div>
        );

      case "list":
        return (
          <div className={`space-y-3 ${className}`}>
            {Array.from({ length: lines }).map((_, i) => (
              <div key={i} className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-full ${baseClasses}`} />
                <div className="flex-1 space-y-2">
                  <div className={`h-4 rounded ${baseClasses}`} />
                  <div className={`h-3 rounded w-2/3 ${baseClasses}`} />
                </div>
              </div>
            ))}
          </div>
        );

      default: // text
        return (
          <div className={`space-y-2 ${className}`}>
            {Array.from({ length: lines }).map((_, i) => (
              <div
                key={i}
                className={`h-4 rounded ${baseClasses} ${
                  i === lines - 1 ? "w-3/4" : "w-full"
                }`}
              />
            ))}
          </div>
        );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {renderSkeleton()}
    </motion.div>
  );
};

// Enhanced Progress Bar
interface ProgressBarProps {
  progress: number;
  variant?: "default" | "gradient" | "banded";
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  label?: string;
  className?: string;
}

export const ProgressBar = ({
  progress,
  variant = "default",
  size = "md",
  showLabel = false,
  label,
  className = "",
}: ProgressBarProps) => {
  const sizeClasses = {
    sm: "h-2",
    md: "h-3",
    lg: "h-4",
  };

  const getVariantClasses = () => {
    switch (variant) {
      case "gradient":
        return "bg-gradient-to-r from-blue-500 to-purple-600";
      case "banded":
        return "bg-gradient-to-r from-blue-500 to-blue-400";
      default:
        return "bg-blue-500";
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {(showLabel || label) && (
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-700">
            {label || "Progress"}
          </span>
          <span className="text-sm text-gray-500">{Math.round(progress)}%</span>
        </div>
      )}
      <div className={`w-full bg-gray-200 rounded-full ${sizeClasses[size]}`}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className={`${sizeClasses[size]} rounded-full ${getVariantClasses()}`}
        />
      </div>
    </div>
  );
};

// Enhanced Error State
interface ErrorStateProps {
  title?: string;
  message?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  variant?: "error" | "warning" | "info";
  className?: string;
}

export const ErrorState = ({
  title = "Algo deu errado",
  message = "Ocorreu um erro inesperado. Tente novamente.",
  action,
  variant = "error",
  className = "",
}: ErrorStateProps) => {
  const getIcon = () => {
    switch (variant) {
      case "warning":
        return <ExclamationTriangleIcon className="w-12 h-12 text-yellow-500" />;
      case "info":
        return <InformationCircleIcon className="w-12 h-12 text-blue-500" />;
      default:
        return <ExclamationTriangleIcon className="w-12 h-12 text-red-500" />;
    }
  };

  const getColors = () => {
    switch (variant) {
      case "warning":
        return {
          bg: "from-yellow-50 to-orange-50",
          border: "border-yellow-200",
          title: "text-yellow-800",
          message: "text-yellow-600",
        };
      case "info":
        return {
          bg: "from-blue-50 to-cyan-50",
          border: "border-blue-200",
          title: "text-blue-800",
          message: "text-blue-600",
        };
      default:
        return {
          bg: "from-red-50 to-pink-50",
          border: "border-red-200",
          title: "text-red-800",
          message: "text-red-600",
        };
    }
  };

  const colors = getColors();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`text-center py-12 ${className}`}
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        className={`w-20 h-20 mx-auto mb-6 bg-gradient-to-br ${colors.bg} rounded-full flex items-center justify-center border ${colors.border}`}
      >
        {getIcon()}
      </motion.div>
      <motion.h3
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className={`text-2xl font-bold mb-3 ${colors.title}`}
      >
        {title}
      </motion.h3>
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className={`${colors.message} mb-6 max-w-md mx-auto`}
      >
        {message}
      </motion.p>
      {action && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={action.onClick}
          className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg"
        >
          <ArrowPathIcon className="w-4 h-4 mr-2" />
          {action.label}
        </motion.button>
      )}
    </motion.div>
  );
};

// Enhanced Empty State
interface EmptyStateProps {
  title?: string;
  message?: string;
  icon?: ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export const EmptyState = ({
  title = "Nenhum item encontrado",
  message = "Não há itens para exibir no momento.",
  icon,
  action,
  className = "",
}: EmptyStateProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`text-center py-12 ${className}`}
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center"
      >
        {icon || (
          <InformationCircleIcon className="w-10 h-10 text-gray-400" />
        )}
      </motion.div>
      <motion.h3
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-xl font-semibold text-gray-900 mb-3"
      >
        {title}
      </motion.h3>
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="text-gray-600 mb-6 max-w-md mx-auto"
      >
        {message}
      </motion.p>
      {action && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={action.onClick}
          className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg"
        >
          {action.label}
        </motion.button>
      )}
    </motion.div>
  );
};

// Enhanced Success State
interface SuccessStateProps {
  title?: string;
  message?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export const SuccessState = ({
  title = "Sucesso!",
  message = "Operação realizada com sucesso.",
  action,
  className = "",
}: SuccessStateProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 200 }}
      className={`text-center py-12 ${className}`}
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
        className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-green-100 to-emerald-200 rounded-full flex items-center justify-center border border-green-200"
      >
        <CheckCircleIcon className="w-12 h-12 text-green-600" />
      </motion.div>
      <motion.h3
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-2xl font-bold text-green-800 mb-3"
      >
        {title}
      </motion.h3>
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="text-green-600 mb-6 max-w-md mx-auto"
      >
        {message}
      </motion.p>
      {action && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={action.onClick}
          className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-medium rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-200 shadow-lg"
        >
          {action.label}
        </motion.button>
      )}
    </motion.div>
  );
};

// Enhanced Transition Wrapper
interface TransitionWrapperProps {
  children: ReactNode;
  variant?: "fade" | "slide" | "scale" | "blur";
  direction?: "up" | "down" | "left" | "right";
  duration?: number;
  delay?: number;
  className?: string;
}

export const TransitionWrapper = ({
  children,
  variant = "fade",
  direction = "up",
  duration = 0.5,
  delay = 0,
  className = "",
}: TransitionWrapperProps) => {
  const getInitial = () => {
    switch (variant) {
      case "slide":
        return {
          opacity: 0,
          x: direction === "left" ? -50 : direction === "right" ? 50 : 0,
          y: direction === "up" ? 50 : direction === "down" ? -50 : 0,
        };
      case "scale":
        return { opacity: 0, scale: 0.8 };
      case "blur":
        return { opacity: 0, filter: "blur(10px)" };
      default:
        return { opacity: 0 };
    }
  };

  const getAnimate = () => {
    switch (variant) {
      case "slide":
        return { opacity: 1, x: 0, y: 0 };
      case "scale":
        return { opacity: 1, scale: 1 };
      case "blur":
        return { opacity: 1, filter: "blur(0px)" };
      default:
        return { opacity: 1 };
    }
  };

  return (
    <motion.div
      initial={getInitial()}
      animate={getAnimate()}
      transition={{ duration, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

// Enhanced Page Transition
interface PageTransitionProps {
  children: ReactNode;
}

export const PageTransition = ({ children }: PageTransitionProps) => {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};
