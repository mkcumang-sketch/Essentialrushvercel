"use client";

import React, { useMemo, useState } from "react";
import {
    Image as ImageIcon,
    CheckCircle,
    Zap,
    Copy,
    Check,
    AlertCircle,
    Sparkles,
    Trash2,
    ShieldCheck,
    Info,
    RefreshCcw,
} from "lucide-react";
import type { SeoEntityData } from "@/types/seo";

interface ImageSeoPanelProps {
    entityData: SeoEntityData;
    setEntityData: React.Dispatch<
        React.SetStateAction<SeoEntityData>
    >;
}

interface ImageSeoStatus {
    label: string;
    color: string;
    icon: React.ReactNode;
}

const MAX_ALT_LENGTH = 125;

export default function ImageSeoPanel({
    entityData,
    setEntityData,
}: ImageSeoPanelProps) {
    const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
    const [failedImages, setFailedImages] = useState<
        Record<string, boolean>
    >({});
    const [decorativeImages, setDecorativeImages] = useState<
        Record<string, boolean>
    >({});

    /**
     * Collect all available images while:
     * - removing empty values
     * - removing duplicates
     */
    const allImages = useMemo(() => {
        return Array.from(
            new Set(
                [
                    entityData.imageUrl,
                    ...(entityData.images || []),
                ].filter(
                    (value): value is string =>
                        typeof value === "string" &&
                        value.trim().length > 0
                )
            )
        );
    }, [entityData.imageUrl, entityData.images]);

    const altTexts = entityData.seo?.imageAltTexts || {};

    /**
     * Update a single image alt text.
     */
    const handleAltChange = (
        url: string,
        newAlt: string
    ) => {
        setEntityData((previous) => ({
            ...previous,
            seo: {
                ...(previous.seo || {
                    metaTitle: "",
                    metaDescription: "",
                    focusKeyword: "",
                    slug: "",
                    noindex: false,
                    imageAltTexts: {},
                }),
                imageAltTexts: {
                    ...(previous.seo?.imageAltTexts || {}),
                    [url]: newAlt,
                },
            },
        }));
    };

    /**
     * Remove alt text completely.
     */
    const clearAltText = (url: string) => {
        setEntityData((previous) => {
            const existing =
                previous.seo?.imageAltTexts || {};

            const updated = { ...existing };

            delete updated[url];

            return {
                ...previous,
                seo: {
                    ...(previous.seo || {
                        metaTitle: "",
                        metaDescription: "",
                        focusKeyword: "",
                        slug: "",
                        noindex: false,
                        imageAltTexts: {},
                    }),
                    imageAltTexts: updated,
                },
            };
        });
    };

    /**
     * Generate useful SEO-friendly alt text.
     */
    const generateAltText = (
        index: number
    ) => {
        const productName =
            entityData.name?.trim() ||
            "Luxury Timepiece";

        const keyword =
            entityData.seo?.focusKeyword?.trim();

        if (index === 0) {
            return keyword
                ? `${productName} ${keyword} front view`
                : `${productName} front view`;
        }

        const detailTypes = [
            "detail view",
            "side view",
            "design detail",
            "product close-up",
            "premium finish detail",
        ];

        return keyword
            ? `${productName} ${keyword} ${detailTypes[(index - 1) % detailTypes.length]}`
            : `${productName} ${detailTypes[(index - 1) % detailTypes.length]}`;
    };

    /**
     * Auto-fill one image.
     */
    const autoGenerateAlt = (
        url: string,
        index: number
    ) => {
        handleAltChange(
            url,
            generateAltText(index)
        );
    };

    /**
     * Auto-fill every image.
     */
    const autoGenerateAll = () => {
        allImages.forEach((url, index) => {
            if (!decorativeImages[url]) {
                handleAltChange(
                    url,
                    generateAltText(index)
                );
            }
        });
    };

    /**
     * Copy alt text.
     */
    const copyAltText = async (
        url: string,
        value: string
    ) => {
        if (!value) return;

        try {
            await navigator.clipboard.writeText(value);

            setCopiedUrl(url);

            setTimeout(() => {
                setCopiedUrl(null);
            }, 1500);
        } catch {
            // Clipboard can be unavailable in restricted environments.
        }
    };

    /**
     * Determine SEO quality.
     */
    const getAltStatus = (
        alt: string
    ): ImageSeoStatus => {
        const length = alt.trim().length;

        if (length === 0) {
            return {
                label: "Missing",
                color: "text-red-400",
                icon: <AlertCircle size={12} />,
            };
        }

        if (length < 15) {
            return {
                label: "Too Short",
                color: "text-yellow-400",
                icon: <AlertCircle size={12} />,
            };
        }

        if (length > MAX_ALT_LENGTH) {
            return {
                label: "Too Long",
                color: "text-orange-400",
                icon: <AlertCircle size={12} />,
            };
        }

        return {
            label: "Optimized",
            color: "text-green-400",
            icon: <CheckCircle size={12} />,
        };
    };

    /**
     * Calculate overall SEO score.
     */
    const stats = useMemo(() => {
        const total = allImages.length;

        if (!total) {
            return {
                total: 0,
                optimized: 0,
                missing: 0,
                score: 0,
            };
        }

        const optimized = allImages.filter((url) => {
            if (decorativeImages[url]) return true;

            const alt = altTexts[url] || "";

            return (
                alt.trim().length >= 15 &&
                alt.trim().length <= MAX_ALT_LENGTH
            );
        }).length;

        const missing = allImages.filter((url) => {
            if (decorativeImages[url]) return false;

            return !(altTexts[url] || "").trim();
        }).length;

        return {
            total,
            optimized,
            missing,
            score: Math.round(
                (optimized / total) * 100
            ),
        };
    }, [
        allImages,
        altTexts,
        decorativeImages,
    ]);

    if (allImages.length === 0) {
        return (
            <div className="space-y-6">
                <Header />

                <div className="relative overflow-hidden p-10 bg-black/50 border border-white/10 rounded-2xl text-center">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,240,255,0.08),transparent_60%)]" />

                    <div className="relative">
                        <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                            <ImageIcon
                                size={32}
                                className="text-gray-600"
                            />
                        </div>

                        <h4 className="text-white font-semibold">
                            No Images Available
                        </h4>

                        <p className="text-sm text-gray-500 mt-2 max-w-md mx-auto">
                            Upload product images from the General
                            tab to configure SEO-friendly alt text.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <Header />

            {/* SEO Overview */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <StatCard
                    label="Total Images"
                    value={stats.total}
                    icon={<ImageIcon size={16} />}
                />

                <StatCard
                    label="Optimized"
                    value={stats.optimized}
                    icon={<CheckCircle size={16} />}
                    valueClass="text-green-400"
                />

                <StatCard
                    label="Missing Alt"
                    value={stats.missing}
                    icon={<AlertCircle size={16} />}
                    valueClass={
                        stats.missing > 0
                            ? "text-red-400"
                            : "text-green-400"
                    }
                />

                <StatCard
                    label="SEO Score"
                    value={`${stats.score}%`}
                    icon={<ShieldCheck size={16} />}
                    valueClass={
                        stats.score >= 80
                            ? "text-green-400"
                            : stats.score >= 50
                                ? "text-yellow-400"
                                : "text-red-400"
                    }
                />
            </div>

            {/* Progress */}
            <div className="p-5 rounded-2xl border border-white/10 bg-black/40">
                <div className="flex items-center justify-between mb-3">
                    <div>
                        <p className="text-sm font-semibold text-white">
                            Image SEO Health
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                            Keep every meaningful image descriptive.
                        </p>
                    </div>

                    <span className="text-sm font-bold text-[#00F0FF]">
                        {stats.score}%
                    </span>
                </div>

                <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                    <div
                        className="h-full bg-[#00F0FF] transition-all duration-500"
                        style={{
                            width: `${stats.score}%`,
                        }}
                    />
                </div>
            </div>

            {/* Bulk Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
                <button
                    type="button"
                    onClick={autoGenerateAll}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#00F0FF] text-black text-xs font-black uppercase tracking-wider hover:bg-white transition-colors"
                >
                    <Sparkles size={15} />
                    Auto-Optimize All
                </button>

                <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white/[0.03] border border-white/10 text-xs text-gray-400">
                    <Info size={14} className="text-[#00F0FF]" />
                    Recommended: 15–125 characters
                </div>
            </div>

            {/* Images */}
            <div className="space-y-4">
                {allImages.map((imgUrl, index) => {
                    const currentAlt =
                        altTexts[imgUrl] || "";

                    const status =
                        getAltStatus(currentAlt);

                    const isDecorative =
                        decorativeImages[imgUrl];

                    return (
                        <div
                            key={`${imgUrl}-${index}`}
                            className="group relative overflow-hidden bg-black/60 border border-white/10 rounded-2xl p-4 hover:border-white/20 transition-all"
                        >
                            <div className="flex flex-col lg:flex-row gap-5">
                                {/* Image Preview */}
                                <div className="relative w-full lg:w-36 h-36 shrink-0">
                                    <div className="w-full h-full bg-white/[0.03] rounded-xl overflow-hidden border border-white/10 flex items-center justify-center">
                                        {!failedImages[imgUrl] ? (
                                            <img
                                                src={imgUrl}
                                                alt={
                                                    currentAlt ||
                                                    "Product image preview"
                                                }
                                                className="max-w-full max-h-full object-contain"
                                                onError={() =>
                                                    setFailedImages(
                                                        (previous) => ({
                                                            ...previous,
                                                            [imgUrl]: true,
                                                        })
                                                    )
                                                }
                                            />
                                        ) : (
                                            <div className="text-center p-4">
                                                <AlertCircle
                                                    size={22}
                                                    className="mx-auto text-red-400 mb-2"
                                                />
                                                <span className="text-[10px] text-gray-500">
                                                    Image unavailable
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    <span className="absolute top-2 left-2 px-2 py-1 rounded-md bg-black/80 border border-white/10 text-[9px] font-bold text-gray-300">
                                        #{index + 1}
                                    </span>
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0 space-y-4">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <div>
                                            <label className="text-xs font-bold uppercase tracking-widest text-gray-300">
                                                Alt Text
                                            </label>

                                            <p className="text-[10px] text-gray-600 mt-1">
                                                Describe what is visually
                                                important in this image.
                                            </p>
                                        </div>

                                        {!isDecorative && (
                                            <span
                                                className={`flex items-center gap-1 text-[10px] font-bold ${status.color}`}
                                            >
                                                {status.icon}
                                                {status.label}
                                            </span>
                                        )}
                                    </div>

                                    <div className="relative">
                                        <input
                                            value={
                                                isDecorative
                                                    ? ""
                                                    : currentAlt
                                            }
                                            disabled={isDecorative}
                                            onChange={(e) =>
                                                handleAltChange(
                                                    imgUrl,
                                                    e.target.value
                                                )
                                            }
                                            maxLength={MAX_ALT_LENGTH}
                                            className="w-full bg-[#0d0d0d] border border-white/10 p-4 pr-20 rounded-xl text-sm text-white outline-none focus:border-[#00F0FF]/60 focus:ring-1 focus:ring-[#00F0FF]/20 transition-all disabled:opacity-40"
                                            placeholder={
                                                isDecorative
                                                    ? "Decorative image — alt text not required"
                                                    : "e.g. Luxury automatic watch with black dial front view"
                                            }
                                        />

                                        {!isDecorative && (
                                            <span
                                                className={`absolute right-3 bottom-3 text-[9px] ${
                                                    currentAlt.length >
                                                    MAX_ALT_LENGTH
                                                        ? "text-red-400"
                                                        : "text-gray-600"
                                                }`}
                                            >
                                                {currentAlt.length}/
                                                {MAX_ALT_LENGTH}
                                            </span>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div className="flex flex-wrap items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                autoGenerateAlt(
                                                    imgUrl,
                                                    index
                                                )
                                            }
                                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#00F0FF]/10 border border-[#00F0FF]/20 text-[10px] font-bold text-[#00F0FF] hover:bg-[#00F0FF]/20 transition-colors"
                                        >
                                            <Zap size={12} />
                                            Auto-Fill
                                        </button>

                                        <button
                                            type="button"
                                            disabled={!currentAlt}
                                            onClick={() =>
                                                copyAltText(
                                                    imgUrl,
                                                    currentAlt
                                                )
                                            }
                                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-[10px] font-bold text-gray-400 hover:text-white transition-colors disabled:opacity-30"
                                        >
                                            {copiedUrl === imgUrl ? (
                                                <Check size={12} />
                                            ) : (
                                                <Copy size={12} />
                                            )}

                                            {copiedUrl === imgUrl
                                                ? "Copied"
                                                : "Copy"}
                                        </button>

                                        <button
                                            type="button"
                                            disabled={!currentAlt}
                                            onClick={() =>
                                                clearAltText(
                                                    imgUrl
                                                )
                                            }
                                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-[10px] font-bold text-gray-500 hover:text-red-400 transition-colors disabled:opacity-30"
                                        >
                                            <Trash2 size={12} />
                                            Clear
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                setDecorativeImages(
                                                    (previous) => ({
                                                        ...previous,
                                                        [imgUrl]:
                                                            !previous[
                                                                imgUrl
                                                            ],
                                                    })
                                                )
                                            }
                                            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border text-[10px] font-bold transition-colors ${
                                                isDecorative
                                                    ? "bg-yellow-400/10 border-yellow-400/20 text-yellow-400"
                                                    : "bg-white/5 border-white/10 text-gray-500 hover:text-white"
                                            }`}
                                        >
                                            <ShieldCheck size={12} />
                                            {isDecorative
                                                ? "Decorative"
                                                : "Mark Decorative"}
                                        </button>
                                    </div>

                                    {/* Helper */}
                                    <div className="flex items-start gap-2 text-[10px] text-gray-600">
                                        <Info
                                            size={12}
                                            className="shrink-0 mt-0.5"
                                        />

                                        <span>
                                            Avoid keyword stuffing.
                                            Describe the image naturally
                                            and focus on what a visually
                                            impaired visitor needs to know.
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* SEO Tips */}
            <div className="p-5 bg-[#00F0FF]/5 border border-[#00F0FF]/15 rounded-2xl">
                <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-[#00F0FF]/10 flex items-center justify-center shrink-0">
                        <Sparkles
                            size={16}
                            className="text-[#00F0FF]"
                        />
                    </div>

                    <div>
                        <p className="text-xs font-bold text-[#00F0FF] uppercase tracking-wider">
                            Image SEO Best Practices
                        </p>

                        <ul className="mt-3 space-y-2 text-[11px] text-gray-500">
                            <li>
                                • Describe the actual visual content.
                            </li>
                            <li>
                                • Keep meaningful descriptions concise.
                            </li>
                            <li>
                                • Don't stuff keywords unnaturally.
                            </li>
                            <li>
                                • Don't start with “image of” or “picture of”.
                            </li>
                            <li>
                                • Decorative images can intentionally
                                have empty alt text.
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}

/* -------------------------------------------------------------------------- */
/* Header                                                                     */
/* -------------------------------------------------------------------------- */

function Header() {
    return (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
                <h3 className="text-lg md:text-xl font-bold text-white flex items-center gap-2">
                    <ImageIcon
                        size={20}
                        className="text-[#00F0FF]"
                    />
                    Image SEO & Alt Tags
                </h3>

                <p className="text-xs text-gray-500 mt-1">
                    Optimize product images for accessibility,
                    Google Image Search, and better UX.
                </p>
            </div>

            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-green-400">
                <ShieldCheck size={13} />
                SEO Ready
            </div>
        </div>
    );
}

/* -------------------------------------------------------------------------- */
/* Stat Card                                                                  */
/* -------------------------------------------------------------------------- */

interface StatCardProps {
    label: string;
    value: string | number;
    icon: React.ReactNode;
    valueClass?: string;
}

function StatCard({
    label,
    value,
    icon,
    valueClass = "text-white",
}: StatCardProps) {
    return (
        <div className="p-4 rounded-xl bg-black/40 border border-white/10 hover:border-white/20 transition-colors">
            <div className="flex items-center justify-between">
                <span className="text-gray-600">
                    {icon}
                </span>

                <span
                    className={`text-xl font-black ${valueClass}`}
                >
                    {value}
                </span>
            </div>

            <p className="text-[9px] uppercase tracking-widest font-bold text-gray-500 mt-2">
                {label}
            </p>
        </div>
    );
}