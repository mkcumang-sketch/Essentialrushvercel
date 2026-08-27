// components/CouponMarketing.tsx
import React, { useState, useEffect } from "react";
import { Copy, Check, Sparkles, Clock, Tag } from "lucide-react";

interface Coupon {
  id: string;
  code: string;
  discount: string;
  title: string;
  description: string;
  expiryDate: string;
  badge?: string;
  isPopular?: boolean;
}

const couponsData: Coupon[] = [
  {
    id: "1",
    code: "FESTIVE50",
    discount: "50% OFF",
    title: "Mega Summer Blowout",
    description: "Valid on all interior designs & premium architecture plans.",
    expiryDate: "2026-09-30T23:59:59",
    badge: "Limited Time",
    isPopular: true,
  },
  {
    id: "2",
    code: "FIRST100",
    discount: "₹1,000 OFF",
    title: "Welcome Bonus",
    description: "Get flat instant off on your first project consultation.",
    expiryDate: "2026-12-31T23:59:59",
    badge: "New Users",
  },
  {
    id: "3",
    code: "FREESHIP",
    discount: "FREE VISIT",
    title: "On-Site Consultation",
    description: "Zero inspection charge for full modular setup bookings.",
    expiryDate: "2026-10-15T23:59:59",
  },
];

export const CouponMarketing: React.FC = () => {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  return (
    <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto mb-10">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-semibold uppercase tracking-wider mb-3">
          <Sparkles className="w-4 h-4" />
          Exclusive Deals & Offers
        </div>
        <h2 className="text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white sm:text-4xl">
          Claim Your Promo Vouchers
        </h2>
        <p className="mt-3 text-base text-neutral-600 dark:text-neutral-400">
          Copy code karo aur checkout ke waqt paste karke instant discount enjoy karo.
        </p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {couponsData.map((coupon) => (
          <div
            key={coupon.id}
            className={`relative flex flex-col justify-between bg-white dark:bg-neutral-900 rounded-2xl border ${
              coupon.isPopular
                ? "border-amber-500/80 shadow-lg shadow-amber-500/10"
                : "border-neutral-200 dark:border-neutral-800 shadow-sm"
            } overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-md`}
          >
            {/* Top Badge */}
            {coupon.badge && (
              <span className="absolute top-3 right-3 text-[11px] font-bold uppercase tracking-wider bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 px-2.5 py-0.5 rounded-md">
                {coupon.badge}
              </span>
            )}

            {/* Content Top */}
            <div className="p-6">
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-black text-2xl tracking-tight mb-1">
                <Tag className="w-5 h-5" />
                {coupon.discount}
              </div>
              <h3 className="font-bold text-lg text-neutral-900 dark:text-white mt-2">
                {coupon.title}
              </h3>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1.5 leading-relaxed">
                {coupon.description}
              </p>
            </div>

            {/* Ticket Divider with Half-Circles */}
            <div className="relative flex items-center justify-center my-1">
              <div className="w-4 h-6 bg-neutral-100 dark:bg-neutral-950 rounded-r-full -ml-0 absolute left-0 border-r border-t border-b border-neutral-200 dark:border-neutral-800" />
              <div className="w-full border-t-2 border-dashed border-neutral-200 dark:border-neutral-800 mx-5" />
              <div className="w-4 h-6 bg-neutral-100 dark:bg-neutral-950 rounded-l-full -mr-0 absolute right-0 border-l border-t border-b border-neutral-200 dark:border-neutral-800" />
            </div>

            {/* Content Bottom: Code & Action */}
            <div className="p-6 pt-4 bg-neutral-50/50 dark:bg-neutral-900/50">
              <div className="flex items-center justify-between gap-3 bg-white dark:bg-neutral-800/90 border border-neutral-200 dark:border-neutral-700/80 rounded-xl p-1.5 pl-3">
                <div className="font-mono font-bold tracking-wider text-sm text-neutral-800 dark:text-neutral-200">
                  {coupon.code}
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(coupon.code)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    copiedCode === coupon.code
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:bg-neutral-800"
                  }`}
                >
                  {copiedCode === coupon.code ? (
                    <>
                      <Check className="w-3.5 h-3.5" /> Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" /> Copy Code
                    </>
                  )}
                </button>
              </div>

              {/* Expiry line */}
              <div className="flex items-center gap-1.5 text-[11px] text-neutral-500 dark:text-neutral-400 mt-3 justify-center">
                <Clock className="w-3 h-3" />
                <span>Expires on {new Date(coupon.expiryDate).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default CouponMarketing;