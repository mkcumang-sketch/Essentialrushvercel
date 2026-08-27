"use client";

import React, { useEffect, useState } from 'react';
import { motion, useSpring, useMotionValue } from 'framer-motion';

// =========================================================
// LUXURY CUSTOM CURSOR
// =========================================================
export function CustomCursor() {
    const [isHovering, setIsHovering] = useState(false);
    const [isVisible, setIsVisible] = useState(false);

    const cursorX = useMotionValue(-100);
    const cursorY = useMotionValue(-100);

    // Apple-tier smooth spring physics
    const springConfig = { damping: 28, stiffness: 400, mass: 0.5 };
    const cursorXSpring = useSpring(cursorX, springConfig);
    const cursorYSpring = useSpring(cursorY, springConfig);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        // Only initialize custom cursor on devices with a fine pointer (desktop/mouse)
        const isTouchDevice = window.matchMedia('(pointer: coarse)').matches;
        if (isTouchDevice) return;

        setIsVisible(true);

        const moveCursor = (e: MouseEvent) => {
            cursorX.set(e.clientX);
            cursorY.set(e.clientY);
        };

        // Event Delegation: Highly performant, handles dynamically loaded React elements!
        const handleMouseOver = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            // Look up the DOM tree to see if we are hovering over an interactive element
            if (target.closest('a, button, input, textarea, select, [role="button"], [data-cursor-hover]')) {
                setIsHovering(true);
            }
        };

        const handleMouseOut = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (target.closest('a, button, input, textarea, select, [role="button"], [data-cursor-hover]')) {
                setIsHovering(false);
            }
        };

        // Passive listeners ensure we don't block the main scrolling thread
        window.addEventListener('mousemove', moveCursor, { passive: true });
        window.addEventListener('mouseover', handleMouseOver, { passive: true });
        window.addEventListener('mouseout', handleMouseOut, { passive: true });

        return () => {
            window.removeEventListener('mousemove', moveCursor);
            window.removeEventListener('mouseover', handleMouseOver);
            window.removeEventListener('mouseout', handleMouseOut);
        };
    }, [cursorX, cursorY]);

    if (!isVisible) return null;

    return (
        <>
            {/* Main inner dot (fast response) */}
            <motion.div
                className="fixed top-0 left-0 pointer-events-none z-[9999] mix-blend-difference"
                style={{
                    x: cursorXSpring,
                    y: cursorYSpring,
                }}
            >
                <motion.div
                    className="rounded-full bg-white"
                    animate={{
                        width: isHovering ? 64 : 12,
                        height: isHovering ? 64 : 12,
                        x: isHovering ? -32 : -6,
                        y: isHovering ? -32 : -6,
                        opacity: isHovering ? 0.9 : 1,
                    }}
                    transition={{
                        type: "spring",
                        damping: 25,
                        stiffness: 400,
                        mass: 0.5
                    }}
                />
            </motion.div>

            {/* Outer luxury ring (delayed trailing response) */}
            <motion.div
                className="fixed top-0 left-0 pointer-events-none z-[9998]"
                style={{
                    x: cursorXSpring,
                    y: cursorYSpring,
                }}
            >
                <motion.div
                    className="rounded-full border border-[#D4AF37]"
                    animate={{
                        width: isHovering ? 80 : 32,
                        height: isHovering ? 80 : 32,
                        x: isHovering ? -40 : -16,
                        y: isHovering ? -40 : -16,
                        opacity: isHovering ? 0 : 0.4, // Fades out cleanly when hovering over a button
                        borderWidth: 1,
                    }}
                    transition={{
                        type: "spring",
                        damping: 30,
                        stiffness: 250,
                        mass: 0.8
                    }}
                />
            </motion.div>

            {/* Hide default system cursor universally */}
            <style dangerouslySetInnerHTML={{
                __html: `
                @media (pointer: fine) {
                    *, *::before, *::after {
                        cursor: none !important;
                    }
                }
            `}} />
        </>
    );
}

// =========================================================
// MAGNETIC BUTTON EFFECT HOOK (Exported utility)
// =========================================================
export function useMagneticEffect() {
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const springConfig = { damping: 20, stiffness: 300, mass: 0.5 };
    const xSpring = useSpring(x, springConfig);
    const ySpring = useSpring(y, springConfig);

    const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const distanceX = (e.clientX - centerX) * 0.2; // 20% magnetic pull strength
        const distanceY = (e.clientY - centerY) * 0.2;

        x.set(distanceX);
        y.set(distanceY);
    };

    const handleMouseLeave = () => {
        x.set(0);
        y.set(0);
    };

    return { x: xSpring, y: ySpring, handleMouseMove, handleMouseLeave };
}