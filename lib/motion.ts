import { Variants, Transition } from 'framer-motion';

// ============================================================
// CENTRALIZED MOTION CONFIGURATION & TOKENS
// ============================================================
export const motionConfig = {
  duration: {
    instant: 0.15,
    fast: 0.25,
    normal: 0.45,
    slow: 0.8,
    cinematic: 1.2,
  },
  ease: {
    standard: [0.25, 1, 0.5, 1] as [number, number, number, number],
    easeOut: [0.16, 1, 0.3, 1] as [number, number, number, number],
    easeInOut: [0.65, 0, 0.35, 1] as [number, number, number, number],
    luxury: [0.22, 1, 0.36, 1] as [number, number, number, number],
  },
  distance: {
    small: 15,
    medium: 30,
    large: 60,
  },
};

// Spring physics configurations
export const SPRING_CONFIG: Transition = {
  type: "spring",
  stiffness: 300,
  damping: 25,
  mass: 0.8,
};

export const GENTLE_SPRING: Transition = {
  type: "spring",
  stiffness: 200,
  damping: 30,
  mass: 1,
};

export const BOUNCE_SPRING: Transition = {
  type: "spring",
  stiffness: 400,
  damping: 15,
  mass: 0.5,
};

// ============================================================
// GLOBAL MOTION VARIANTS
// ============================================================

export const fadeVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { duration: motionConfig.duration.normal, ease: motionConfig.ease.easeOut }
  },
  exit: { 
    opacity: 0,
    transition: { duration: motionConfig.duration.fast, ease: motionConfig.ease.easeOut }
  }
};

export const fadeUpVariants: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: motionConfig.duration.slow, ease: motionConfig.ease.easeOut }
  },
  exit: { 
    opacity: 0, 
    y: -20,
    transition: { duration: motionConfig.duration.fast, ease: motionConfig.ease.easeOut }
  }
};

export const fadeDownVariants: Variants = {
  hidden: { opacity: 0, y: -40 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: motionConfig.duration.slow, ease: motionConfig.ease.easeOut }
  },
  exit: { 
    opacity: 0, 
    y: 20,
    transition: { duration: motionConfig.duration.fast, ease: motionConfig.ease.easeOut }
  }
};

export const scaleVariants: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: SPRING_CONFIG
  },
  exit: { 
    opacity: 0, 
    scale: 0.9,
    transition: { duration: motionConfig.duration.fast }
  }
};

export const revealVariants: Variants = {
  hidden: { opacity: 0, clipPath: 'inset(0 100% 0 0)' },
  visible: { 
    opacity: 1, 
    clipPath: 'inset(0 0 0 0)',
    transition: { duration: motionConfig.duration.cinematic, ease: motionConfig.ease.easeOut }
  },
  exit: { 
    opacity: 0, 
    clipPath: 'inset(0 0 0 100%)',
    transition: { duration: motionConfig.duration.slow, ease: motionConfig.ease.easeOut }
  }
};

export const imageRevealVariants: Variants = {
  hidden: { opacity: 0, scale: 1.1 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: { duration: 1.2, ease: motionConfig.ease.easeOut }
  }
};

export const staggerContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

export const staggerItemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: motionConfig.duration.normal, ease: motionConfig.ease.easeOut }
  }
};

export const modalVariants: Variants = {
  hidden: { opacity: 0, scale: 0.9, y: 20 },
  visible: { 
    opacity: 1, 
    scale: 1, 
    y: 0,
    transition: SPRING_CONFIG
  },
  exit: { 
    opacity: 0, 
    scale: 0.9, 
    y: 20,
    transition: { duration: motionConfig.duration.fast }
  }
};

export const drawerVariants: Variants = {
  hidden: { x: '100%' },
  visible: { 
    x: 0,
    transition: { type: "spring", stiffness: 300, damping: 30 }
  },
  exit: { 
    x: '100%',
    transition: { duration: motionConfig.duration.normal, ease: motionConfig.ease.easeOut }
  }
};

export const pageTransitionVariants: Variants = {
  hidden: { opacity: 0, y: 20, scale: 0.98 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { duration: motionConfig.duration.normal, ease: motionConfig.ease.easeOut }
  },
  exit: { 
    opacity: 0, 
    y: -20, 
    scale: 0.98,
    transition: { duration: motionConfig.duration.fast, ease: motionConfig.ease.easeOut }
  }
};

export const productCardVariants: Variants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: SPRING_CONFIG
  },
  hover: {
    y: -4,
    scale: 1.015,
    transition: { duration: motionConfig.duration.fast, ease: motionConfig.ease.easeOut }
  }
};

export const buttonVariants: Variants = {
  initial: { scale: 1 },
  hover: { 
    scale: 1.02,
    y: -1,
    transition: { duration: motionConfig.duration.instant, ease: motionConfig.ease.easeOut }
  },
  tap: { 
    scale: 0.98,
    transition: { duration: motionConfig.duration.instant }
  }
};

export const reducedMotionVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { duration: 0.01 }
  },
  exit: { 
    opacity: 0,
    transition: { duration: 0.01 }
  }
};

export const useReducedMotion = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

export const getMotionVariants = (variants: Variants): Variants => {
  if (useReducedMotion()) {
    return reducedMotionVariants;
  }
  return variants;
};

export const fadeInUp = {
  variants: fadeUpVariants,
  initial: "hidden",
  whileInView: "visible",
  viewport: { once: true, margin: "-50px" }
};

export const fadeInScale = {
  variants: scaleVariants,
  initial: "hidden",
  whileInView: "visible",
  viewport: { once: true, margin: "-50px" }
};

export const staggerFadeIn = {
  variants: staggerContainerVariants,
  initial: "hidden",
  whileInView: "visible",
  viewport: { once: true, margin: "-50px" }
};
export const scrollRevealVariants = fadeUpVariants;