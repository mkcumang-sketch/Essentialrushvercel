"use client";

import React from "react";
import { motion, HTMLMotionProps } from "framer-motion";
import { motionConfig } from "@/lib/motion";

interface MotionButtonProps extends HTMLMotionProps<"button"> {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "gold";
}

export function MotionButton({
  children,
  variant = "primary",
  className = "",
  ...props
}: MotionButtonProps) {
  const baseStyles =
    "relative inline-flex items-center justify-center px-8 py-4 rounded-full text-[10px] font-black uppercase tracking-[3px] transition-colors overflow-hidden";

  const variantStyles = {
    primary: "bg-black text-white hover:bg-[#D4AF37] hover:text-black",
    secondary:
      "bg-white/10 text-white border border-white/20 backdrop-blur-md hover:bg-white hover:text-black",
    gold: "bg-[#D4AF37] text-black hover:bg-white hover:text-black shadow-[0_0_30px_rgba(212,175,55,0.3)]",
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      transition={{
        duration: motionConfig.duration.fast,
        ease: motionConfig.ease.easeOut,
      }}
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      <span className="relative z-10 flex items-center gap-2">{children}</span>
    </motion.button>
  );
}