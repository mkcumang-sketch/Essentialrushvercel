"use client";

import React from 'react';
import { motion } from 'framer-motion';

// 🎯 ENTERPRISE LOADING SKELETONS 🎯

export const ProductCardSkeleton = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="bg-white rounded-2xl border border-gray-200 overflow-hidden"
  >
    <div className="aspect-[4/5] bg-gray-100 animate-pulse" />
    <div className="p-6">
      <div className="h-4 bg-gray-200 rounded animate-pulse mb-3 w-3/4" />
      <div className="h-3 bg-gray-200 rounded animate-pulse mb-4 w-1/2" />
      <div className="flex justify-between items-center">
        <div className="h-6 bg-gray-200 rounded animate-pulse w-20" />
        <div className="h-10 bg-gray-200 rounded-full animate-pulse w-24" />
      </div>
    </div>
  </motion.div>
);

export const UserStatsSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
    {[1, 2, 3].map((i) => (
      <motion.div
        key={i}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: i * 0.1 }}
        className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm"
      >
        <div className="h-4 bg-gray-200 rounded animate-pulse mb-4 w-1/2" />
        <div className="h-8 bg-gray-200 rounded animate-pulse mb-2" />
        <div className="h-3 bg-gray-200 rounded animate-pulse w-3/4" />
      </motion.div>
    ))}
  </div>
);

export const TableSkeleton = ({ rows = 5 }: { rows?: number }) => (
  <div className="space-y-3">
    {Array.from({ length: rows }).map((_, i) => (
      <motion.div
        key={i}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: i * 0.05 }}
        className="bg-white rounded-lg border border-gray-200 p-4"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
            <div className="h-3 bg-gray-200 rounded animate-pulse w-1/2" />
          </div>
          <div className="h-8 bg-gray-200 rounded animate-pulse w-20" />
        </div>
      </motion.div>
    ))}
  </div>
);

export const PageLoader = () => (
  <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
      className="text-6xl text-[#D4AF37]"
    >
      ♞
    </motion.div>
  </div>
);

export const FormSkeleton = () => (
  <div className="space-y-6">
    {[1, 2, 3, 4].map((i) => (
      <div key={i} className="space-y-2">
        <div className="h-4 bg-gray-200 rounded animate-pulse w-1/4" />
        <div className="h-10 bg-gray-200 rounded animate-pulse" />
      </div>
    ))}
    <div className="h-12 bg-gray-200 rounded-xl animate-pulse" />
  </div>
);

export const StatsCardSkeleton = () => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm"
  >
    <div className="flex items-center justify-between mb-4">
      <div className="h-4 bg-gray-200 rounded animate-pulse w-20" />
      <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />
    </div>
    <div className="space-y-2">
      <div className="h-8 bg-gray-200 rounded animate-pulse w-24" />
      <div className="h-3 bg-gray-200 rounded animate-pulse w-16" />
    </div>
  </motion.div>
);

// 🎯 COMBINED LOADING COMPONENTS
export const LoadingState = ({ 
  type, 
  count = 1 
}: { 
  type: 'product' | 'stats' | 'table' | 'form' | 'page' | 'stats-card';
  count?: number;
}) => {
  const components = {
    product: <ProductCardSkeleton />,
    stats: <UserStatsSkeleton />,
    table: <TableSkeleton rows={count} />,
    form: <FormSkeleton />,
    page: <PageLoader />,
    'stats-card': <StatsCardSkeleton />
  };

  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i}>
          {components[type]}
        </div>
      ))}
    </div>
  );
};
