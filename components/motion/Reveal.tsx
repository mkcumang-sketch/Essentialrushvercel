"use client";

import React from "react";
import { motion } from "framer-motion";
import { motionConfig } from "@/lib/motion";

interface RevealProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  width?: "full" | "fit";
}

export function Reveal({ children, delay = 0, className = "", width = "full" }: RevealProps) {
  return (
    <div className={width === "full" ? "w-full" : "w-fit"}>
      <motion.div
        initial={{ opacity: 0, y: motionConfig.distance.medium, filter: "blur(6px)" }}
        whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{
          duration: motionConfig.duration.slow,
          delay: delay,
          ease: motionConfig.ease.easeOut,
        }}
        className={className}
      >
        {children}
      </motion.div>
    </div>
  );
}