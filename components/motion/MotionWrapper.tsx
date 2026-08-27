"use client";

import React from 'react';
import { motion, MotionProps } from 'framer-motion';
import { 
  fadeUpVariants, 
  scaleVariants, 
  staggerContainerVariants,
  scrollRevealVariants,
  useReducedMotion,
  reducedMotionVariants
} from '@/lib/motion';

interface MotionWrapperProps extends MotionProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'fadeUp' | 'scale' | 'stagger' | 'scrollReveal';
  delay?: number;
  duration?: number;
  viewport?: boolean;
  once?: boolean;
}

export function MotionWrapper({
  children,
  className = '',
  variant = 'fadeUp',
  delay = 0,
  duration,
  viewport = true,
  once = true,
  ...props
}: MotionWrapperProps) {
  const prefersReducedMotion = useReducedMotion();
  
  const variants = {
    fadeUp: fadeUpVariants,
    scale: scaleVariants,
    stagger: staggerContainerVariants,
    scrollReveal: scrollRevealVariants
  };

  const selectedVariants = prefersReducedMotion ? reducedMotionVariants : variants[variant];

  const transition = duration ? { duration } : undefined;

  return (
    <motion.div
      className={className}
      variants={selectedVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      transition={transition}
      viewport={viewport ? { once, margin: "-50px" } : undefined}
      {...props}
    >
      {children}
    </motion.div>
  );
}

// Specific motion components for common use cases

export function FadeUp({ children, className = '', delay = 0, ...props }: Omit<MotionWrapperProps, 'variant'>) {
  return (
    <MotionWrapper variant="fadeUp" className={className} delay={delay} {...props}>
      {children}
    </MotionWrapper>
  );
}

export function ScaleIn({ children, className = '', delay = 0, ...props }: Omit<MotionWrapperProps, 'variant'>) {
  return (
    <MotionWrapper variant="scale" className={className} delay={delay} {...props}>
      {children}
    </MotionWrapper>
  );
}

export function StaggerContainer({ children, className = '', ...props }: Omit<MotionWrapperProps, 'variant' | 'viewport'>) {
  return (
    <MotionWrapper variant="stagger" className={className} viewport={false} {...props}>
      {children}
    </MotionWrapper>
  );
}

export function ScrollReveal({ children, className = '', ...props }: Omit<MotionWrapperProps, 'variant'>) {
  return (
    <MotionWrapper variant="scrollReveal" className={className} {...props}>
      {children}
    </MotionWrapper>
  );
}