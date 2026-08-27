"use client";

import React from "react";
import { motion, HTMLMotionProps } from "framer-motion";
import { fadeUpVariants } from "@/lib/motion";

interface MotionWrapperProps extends Omit<HTMLMotionProps<"div">, "viewport"> {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  viewport?: boolean;
}

export default function MotionWrapper({
  children,
  delay = 0,
  className = "",
  viewport = true,
  ...props
}: MotionWrapperProps) {
  return (
    <motion.div
      variants={fadeUpVariants}
      initial="hidden"
      whileInView={viewport ? "visible" : undefined}
      animate={!viewport ? "visible" : undefined}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}