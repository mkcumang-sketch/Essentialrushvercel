"use client";

import React from "react";
import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  trend?: string;
  color?: string;
  trendDirection?: "up" | "down" | "neutral";
  description?: string;
  loading?: boolean;
}

export default function StatCard({
  title,
  value,
  icon,
  trend,
  color = "bg-[#111]",
  trendDirection = "up",
  description,
  loading = false,
}: StatCardProps) {
  const TrendIcon =
    trendDirection === "down"
      ? ArrowDownRight
      : trendDirection === "neutral"
        ? Minus
        : ArrowUpRight;

  const trendColor =
    trendDirection === "down"
      ? "text-red-400 border-red-400/20 bg-red-400/10"
      : trendDirection === "neutral"
        ? "text-gray-400 border-white/10 bg-white/5"
        : "text-emerald-400 border-emerald-400/20 bg-emerald-400/10";

  return (
    <div
      className={`
        ${color}
        group
        relative
        min-h-[190px]
        overflow-hidden
        rounded-[2rem]
        border border-white/10
        p-6 sm:p-7 lg:p-8
        shadow-[0_15px_60px_rgba(0,0,0,0.18)]
        transition-all
        duration-500
        hover:-translate-y-1
        hover:border-white/20
        hover:shadow-[0_25px_80px_rgba(0,0,0,0.3)]
      `}
    >
      {/* Background Glow */}
      <div
        className="
          pointer-events-none
          absolute
          -right-16
          -top-16
          h-44
          w-44
          rounded-full
          bg-white/[0.04]
          blur-3xl
          transition-all
          duration-700
          group-hover:scale-150
          group-hover:bg-white/[0.07]
        "
      />

      {/* Large Background Icon */}
      <div
        className="
          pointer-events-none
          absolute
          -right-3
          -top-5
          flex
          h-32
          w-32
          items-center
          justify-center
          text-white
          opacity-[0.045]
          transition-all
          duration-700
          group-hover:scale-125
          group-hover:-rotate-12
          group-hover:opacity-[0.09]
        "
      >
        <div className="scale-[2.2]">{icon}</div>
      </div>

      {/* Top Shine */}
      <div
        className="
          pointer-events-none
          absolute
          inset-x-0
          top-0
          h-px
          bg-gradient-to-r
          from-transparent
          via-white/20
          to-transparent
        "
      />

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <div className="mb-6 flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            {/* Icon */}
            <div
              className="
                flex
                h-11
                w-11
                shrink-0
                items-center
                justify-center
                rounded-2xl
                border
                border-white/10
                bg-white/[0.05]
                text-white
                shadow-lg
                transition-all
                duration-500
                group-hover:scale-105
                group-hover:bg-white/[0.08]
              "
            >
              {icon}
            </div>

            {/* Title */}
            <div className="min-w-0">
              <p
                className="
                  truncate
                  text-[9px]
                  font-black
                  uppercase
                  tracking-[0.2em]
                  text-white/50
                "
              >
                {title}
              </p>

              {description && (
                <p className="mt-1 truncate text-[8px] text-white/30">
                  {description}
                </p>
              )}
            </div>
          </div>

          {/* Trend */}
          {trend && (
            <span
              className={`
                flex
                shrink-0
                items-center
                gap-1
                rounded-full
                border
                px-2.5
                py-1.5
                text-[8px]
                font-black
                tracking-wide
                shadow-lg
                ${trendColor}
              `}
            >
              <TrendIcon size={10} strokeWidth={3} />
              {trend}
            </span>
          )}
        </div>

        {/* Value */}
        {loading ? (
          <div className="h-10 w-32 animate-pulse rounded-xl bg-white/10" />
        ) : (
          <h3
            className="
              truncate
              text-3xl
              font-serif
              font-black
              italic
              tracking-tighter
              leading-none
              text-white
              transition-all
              duration-500
              group-hover:translate-x-1
            "
            title={value}
          >
            {value}
          </h3>
        )}

        {/* Bottom Indicator */}
        <div className="mt-7 flex items-center gap-2">
          <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/5">
            <div
              className="
                h-full
                w-1/3
                rounded-full
                bg-white/20
                transition-all
                duration-700
                group-hover:w-2/3
              "
            />
          </div>

          <span className="text-[7px] font-bold uppercase tracking-widest text-white/25">
            Live
          </span>
        </div>
      </div>

      {/* Glass Shine */}
      <div
        className="
          pointer-events-none
          absolute
          inset-0
          -translate-x-full
          bg-gradient-to-r
          from-transparent
          via-white/[0.06]
          to-transparent
          transition-transform
          duration-1000
          group-hover:translate-x-full
        "
      />
    </div>
  );
}