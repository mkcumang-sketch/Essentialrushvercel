export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import mongoose, { Model } from "mongoose";

/* ==========================================================================
   TYPES
   ========================================================================== */

interface IProductSEO {
    noindex?: boolean;
    metaTitle?: string;
    metaDescription?: string;
    imageAltTexts?: Record<string, string>;
    focusKeyword?: string;
    canonicalUrl?: string;
}

interface IProduct {
    _id: mongoose.Types.ObjectId;
    name?: string;
    slug?: string;
    imageUrl?: string;
    images?: string[];
    seo?: IProductSEO;
}

interface SeoIssues {
    title: boolean;
    desc: boolean;
    alt: boolean;
    keyword: boolean;
    canonical: boolean;
}

interface AttentionItem {
    id: string;
    name: string;
    slug: string;
    score: number;
    issues: SeoIssues;
}

interface ScoreDistribution {
    critical: number;
    warning: number;
    healthy: number;
    excellent: number;
}

interface SeoAnalytics {
    totalProducts: number;

    totalIndexed: number;
    totalNoindex: number;

    avgScore: number;
    indexedAvgScore: number;

    missingMetaTitle: number;
    missingMetaDesc: number;
    missingAltText: number;

    shortMetaTitle: number;
    longMetaTitle: number;

    shortMetaDesc: number;
    longMetaDesc: number;

    missingFocusKeyword: number;
    missingCanonical: number;

    totalImages: number;
    optimizedImages: number;
    imageCoverage: number;

    metadataCoverage: number;

    scoreDistribution: ScoreDistribution;

    needsAttention: AttentionItem[];

    opportunities: {
        metaTitles: number;
        metaDescriptions: number;
        imageAltText: number;
        focusKeywords: number;
        canonicals: number;
    };

    generatedAt: string;
}

/* ==========================================================================
   CONSTANTS
   ========================================================================== */

const META_TITLE_MIN = 30;
const META_TITLE_MAX = 60;

const META_DESCRIPTION_MIN = 100;
const META_DESCRIPTION_MAX = 160;

const MAX_ATTENTION_ITEMS = 50;

/* ==========================================================================
   PRODUCT SCHEMA
   ========================================================================== */

const productSchema = new mongoose.Schema<IProduct>(
    {
        name: String,

        slug: String,

        imageUrl: String,

        images: {
            type: [String],
            default: [],
        },

        seo: {
            type: mongoose.Schema.Types.Mixed,
            default: {},
        },
    },
    {
        strict: false,
    }
);

/* ==========================================================================
   PRODUCT MODEL
   ========================================================================== */

const Product: Model<IProduct> =
    (mongoose.models.Product as Model<IProduct>) ||
    mongoose.model<IProduct>("Product", productSchema);

/* ==========================================================================
   DATABASE CONNECTION
   ========================================================================== */

declare global {
    // eslint-disable-next-line no-var
    var __seoMongoConnectionPromise:
        | Promise<typeof mongoose>
        | undefined;
}

async function connectDB(): Promise<typeof mongoose> {
    if (mongoose.connection.readyState === 1) {
        return mongoose;
    }

    const mongoUri = process.env.MONGODB_URI;

    if (!mongoUri) {
        throw new Error(
            "MONGODB_URI is not defined in environment variables."
        );
    }

    /*
     * Reuse an existing connection promise.
     * This prevents multiple simultaneous requests
     * from creating multiple MongoDB connections.
     */
    if (!global.__seoMongoConnectionPromise) {
        global.__seoMongoConnectionPromise = mongoose.connect(
            mongoUri,
            {
                maxPoolSize: 10,
                minPoolSize: 1,
                serverSelectionTimeoutMS: 5000,
                connectTimeoutMS: 5000,
                socketTimeoutMS: 10000,
            }
        );
    }

    try {
        await global.__seoMongoConnectionPromise;
    } catch (error) {
        global.__seoMongoConnectionPromise = undefined;
        throw error;
    }

    return mongoose;
}

/* ==========================================================================
   HELPERS
   ========================================================================== */

function cleanString(value: unknown): string {
    if (typeof value !== "string") {
        return "";
    }

    return value.trim();
}

/* --------------------------------------------------------------------------
   Safe percentage
   -------------------------------------------------------------------------- */

function percentage(
    value: number,
    total: number,
    fallback = 0
): number {
    if (!total || total <= 0) {
        return fallback;
    }

    return Math.max(
        0,
        Math.min(
            100,
            Math.round((value / total) * 100)
        )
    );
}

/* --------------------------------------------------------------------------
   Product images
   -------------------------------------------------------------------------- */

function getProductImages(product: IProduct): string[] {
    const images: string[] = [];

    if (
        typeof product.imageUrl === "string" &&
        product.imageUrl.trim()
    ) {
        images.push(product.imageUrl.trim());
    }

    if (Array.isArray(product.images)) {
        for (const image of product.images) {
            if (
                typeof image === "string" &&
                image.trim()
            ) {
                images.push(image.trim());
            }
        }
    }

    return Array.from(new Set(images));
}

/* --------------------------------------------------------------------------
   Meta title validation
   -------------------------------------------------------------------------- */

function validateMetaTitle(title: string) {
    const length = title.length;

    const missing = length === 0;

    const short =
        !missing &&
        length < META_TITLE_MIN;

    const long =
        !missing &&
        length > META_TITLE_MAX;

    return {
        missing,
        short,
        long,
        invalid: short || long,
        issue: missing || short || long,
    };
}

/* --------------------------------------------------------------------------
   Meta description validation
   -------------------------------------------------------------------------- */

function validateMetaDescription(description: string) {
    const length = description.length;

    const missing = length === 0;

    const short =
        !missing &&
        length < META_DESCRIPTION_MIN;

    const long =
        !missing &&
        length > META_DESCRIPTION_MAX;

    return {
        missing,
        short,
        long,
        invalid: short || long,
        issue: missing || short || long,
    };
}

/* --------------------------------------------------------------------------
   Canonical validation
   -------------------------------------------------------------------------- */

function validateCanonical(
    canonical: string
): {
    missing: boolean;
    invalid: boolean;
    issue: boolean;
} {
    if (!canonical) {
        return {
            missing: true,
            invalid: false,
            issue: true,
        };
    }

    try {
        const url = new URL(canonical);

        const validProtocol =
            url.protocol === "http:" ||
            url.protocol === "https:";

        return {
            missing: false,
            invalid: !validProtocol,
            issue: !validProtocol,
        };
    } catch {
        return {
            missing: false,
            invalid: true,
            issue: true,
        };
    }
}

/* --------------------------------------------------------------------------
   Image ALT validation
   -------------------------------------------------------------------------- */

function calculateImageCoverage(
    images: string[],
    altTexts: Record<string, string>
) {
    let optimized = 0;

    for (const image of images) {
        const alt = cleanString(
            altTexts[image]
        );

        if (alt.length > 0) {
            optimized++;
        }
    }

    return {
        total: images.length,
        optimized,
        missing: Math.max(
            0,
            images.length - optimized
        ),
    };
}

/* --------------------------------------------------------------------------
   SEO Score
   -------------------------------------------------------------------------- */

function calculateScore(params: {
    titleIssue: boolean;
    descriptionIssue: boolean;
    altIssue: boolean;
    keywordIssue: boolean;
    canonicalIssue: boolean;
    noindex: boolean;
}): number {
    let score = 100;

    /*
     * Meta title
     */
    if (params.titleIssue) {
        score -= 20;
    }

    /*
     * Meta description
     */
    if (params.descriptionIssue) {
        score -= 20;
    }

    /*
     * Image ALT
     */
    if (params.altIssue) {
        score -= 15;
    }

    /*
     * Focus keyword
     */
    if (params.keywordIssue) {
        score -= 10;
    }

    /*
     * Canonical
     */
    if (params.canonicalIssue) {
        score -= 10;
    }

    /*
     * Intentionally NOT penalizing noindex.
     *
     * A noindex product may be intentional.
     */
    if (params.noindex) {
        score -= 0;
    }

    return Math.max(
        0,
        Math.min(100, score)
    );
}

/* --------------------------------------------------------------------------
   Score bucket
   -------------------------------------------------------------------------- */

function getScoreBucket(
    score: number
): keyof ScoreDistribution {
    if (score >= 90) {
        return "excellent";
    }

    if (score >= 80) {
        return "healthy";
    }

    if (score >= 50) {
        return "warning";
    }

    return "critical";
}

/* --------------------------------------------------------------------------
   Issue count
   -------------------------------------------------------------------------- */

function countIssues(
    issues: SeoIssues
): number {
    return Object.values(issues).filter(
        Boolean
    ).length;
}

/* ==========================================================================
   GET SEO ANALYTICS
   ========================================================================== */

export async function GET() {
    const startedAt = Date.now();

    try {
        /* ------------------------------------------------------------------
           DATABASE
        ------------------------------------------------------------------ */

        await connectDB();

        /* ------------------------------------------------------------------
           FETCH PRODUCTS
        ------------------------------------------------------------------ */

        const products = await Product.find(
            {},
            {
                _id: 1,
                name: 1,
                slug: 1,
                imageUrl: 1,
                images: 1,
                seo: 1,
            }
        )
            .lean<IProduct[]>()
            .exec();

        /* ------------------------------------------------------------------
           COUNTERS
        ------------------------------------------------------------------ */

        let totalIndexed = 0;
        let totalNoindex = 0;

        let totalScore = 0;
        let indexedScore = 0;

        let indexedProducts = 0;

        let missingMetaTitle = 0;
        let missingMetaDesc = 0;
        let missingAltText = 0;

        let shortMetaTitle = 0;
        let longMetaTitle = 0;

        let shortMetaDesc = 0;
        let longMetaDesc = 0;

        let missingFocusKeyword = 0;
        let missingCanonical = 0;

        let totalImages = 0;
        let optimizedImages = 0;

        const needsAttention: AttentionItem[] = [];

        const scoreDistribution: ScoreDistribution = {
            critical: 0,
            warning: 0,
            healthy: 0,
            excellent: 0,
        };

        /* ------------------------------------------------------------------
           PRODUCT ANALYSIS
        ------------------------------------------------------------------ */

        for (const product of products) {
            const seo: IProductSEO =
                product.seo &&
                typeof product.seo === "object"
                    ? product.seo
                    : {};

            /* ==============================================================
               INDEXING
            ============================================================== */

            const noindex =
                seo.noindex === true;

            if (noindex) {
                totalNoindex++;
            } else {
                totalIndexed++;
                indexedProducts++;
            }

            /* ==============================================================
               META TITLE
            ============================================================== */

            const metaTitle = cleanString(
                seo.metaTitle
            );

            const titleStatus =
                validateMetaTitle(
                    metaTitle
                );

            /*
             * IMPORTANT:
             *
             * Missing = only actually missing.
             * Short/long are separate metrics.
             */

            if (titleStatus.missing) {
                missingMetaTitle++;
            }

            if (titleStatus.short) {
                shortMetaTitle++;
            }

            if (titleStatus.long) {
                longMetaTitle++;
            }

            /* ==============================================================
               META DESCRIPTION
            ============================================================== */

            const metaDescription =
                cleanString(
                    seo.metaDescription
                );

            const descriptionStatus =
                validateMetaDescription(
                    metaDescription
                );

            if (
                descriptionStatus.missing
            ) {
                missingMetaDesc++;
            }

            if (
                descriptionStatus.short
            ) {
                shortMetaDesc++;
            }

            if (
                descriptionStatus.long
            ) {
                longMetaDesc++;
            }

            /* ==============================================================
               FOCUS KEYWORD
            ============================================================== */

            const focusKeyword =
                cleanString(
                    seo.focusKeyword
                );

            const keywordIssue =
                focusKeyword.length === 0;

            if (keywordIssue) {
                missingFocusKeyword++;
            }

            /* ==============================================================
               CANONICAL
            ============================================================== */

            const canonicalUrl =
                cleanString(
                    seo.canonicalUrl
                );

            const canonicalStatus =
                validateCanonical(
                    canonicalUrl
                );

            if (
                canonicalStatus.missing
            ) {
                missingCanonical++;
            }

            /* ==============================================================
               IMAGES
            ============================================================== */

            const images =
                getProductImages(
                    product
                );

            totalImages += images.length;

            const altTexts =
                seo.imageAltTexts &&
                typeof seo.imageAltTexts ===
                    "object"
                    ? seo.imageAltTexts
                    : {};

            const imageStats =
                calculateImageCoverage(
                    images,
                    altTexts
                );

            optimizedImages +=
                imageStats.optimized;

            const altIssue =
                imageStats.missing > 0;

            if (altIssue) {
                missingAltText++;
            }

            /* ==============================================================
               SEO SCORE
            ============================================================== */

            const score =
                calculateScore({
                    titleIssue:
                        titleStatus.issue,

                    descriptionIssue:
                        descriptionStatus.issue,

                    altIssue,

                    keywordIssue,

                    canonicalIssue:
                        canonicalStatus.issue,

                    noindex,
                });

            totalScore += score;

            if (!noindex) {
                indexedScore += score;
            }

            /* ==============================================================
               SCORE DISTRIBUTION
            ============================================================== */

            const bucket =
                getScoreBucket(score);

            scoreDistribution[bucket]++;

            /* ==============================================================
               ISSUE OBJECT
            ============================================================== */

            const issues: SeoIssues = {
                title:
                    titleStatus.issue,

                desc:
                    descriptionStatus.issue,

                alt:
                    altIssue,

                keyword:
                    keywordIssue,

                canonical:
                    canonicalStatus.issue,
            };

            const hasIssue =
                Object.values(
                    issues
                ).some(Boolean);

            /* ==============================================================
               NEEDS ATTENTION
            ============================================================== */

            if (
                hasIssue ||
                score < 80
            ) {
                needsAttention.push({
                    id: product._id.toString(),

                    name:
                        cleanString(
                            product.name
                        ) ||
                        "Unnamed Product",

                    slug:
                        cleanString(
                            product.slug
                        ) ||
                        product._id.toString(),

                    score,

                    issues,
                });
            }
        }

        /* ------------------------------------------------------------------
           AVERAGE SCORE
        ------------------------------------------------------------------ */

        const avgScore =
            products.length > 0
                ? Math.round(
                      totalScore /
                          products.length
                  )
                : 0;

        const indexedAvgScore =
            indexedProducts > 0
                ? Math.round(
                      indexedScore /
                          indexedProducts
                  )
                : 0;

        /* ------------------------------------------------------------------
           IMAGE COVERAGE
        ------------------------------------------------------------------ */

        const imageCoverage =
            totalImages > 0
                ? percentage(
                      optimizedImages,
                      totalImages,
                      100
                  )
                : 100;

        /* ------------------------------------------------------------------
           METADATA COVERAGE
        ------------------------------------------------------------------

           A product has complete metadata only when:

           - Meta title exists AND
           - Meta title length is valid AND
           - Meta description exists AND
           - Meta description length is valid
        ------------------------------------------------------------------ */

        const validMetaTitles =
            products.filter(
                (product) => {
                    const seo =
                        product.seo &&
                        typeof product.seo ===
                            "object"
                            ? product.seo
                            : {};

                    const title =
                        cleanString(
                            seo.metaTitle
                        );

                    return (
                        !validateMetaTitle(
                            title
                        ).issue
                    );
                }
            ).length;

        const validMetaDescriptions =
            products.filter(
                (product) => {
                    const seo =
                        product.seo &&
                        typeof product.seo ===
                            "object"
                            ? product.seo
                            : {};

                    const description =
                        cleanString(
                            seo.metaDescription
                        );

                    return (
                        !validateMetaDescription(
                            description
                        ).issue
                    );
                }
            ).length;

        const metadataCoverage =
            products.length > 0
                ? Math.round(
                      ((validMetaTitles +
                          validMetaDescriptions) /
                          (products.length *
                              2)) *
                          100
                  )
                : 100;

        /* ------------------------------------------------------------------
           SORT ATTENTION ITEMS
        ------------------------------------------------------------------ */

        needsAttention.sort(
            (a, b) => {
                /*
                 * 1. Lowest SEO score first
                 */
                if (
                    a.score !==
                    b.score
                ) {
                    return (
                        a.score -
                        b.score
                    );
                }

                /*
                 * 2. More issues first
                 */
                const aIssueCount =
                    countIssues(
                        a.issues
                    );

                const bIssueCount =
                    countIssues(
                        b.issues
                    );

                return (
                    bIssueCount -
                    aIssueCount
                );
            }
        );

        /* ------------------------------------------------------------------
           RESPONSE
        ------------------------------------------------------------------ */

        const response: SeoAnalytics = {
            totalProducts:
                products.length,

            totalIndexed,

            totalNoindex,

            avgScore,

            indexedAvgScore,

            missingMetaTitle,

            missingMetaDesc,

            missingAltText,

            shortMetaTitle,

            longMetaTitle,

            shortMetaDesc,

            longMetaDesc,

            missingFocusKeyword,

            missingCanonical,

            totalImages,

            optimizedImages,

            imageCoverage,

            metadataCoverage,

            scoreDistribution,

            needsAttention:
                needsAttention.slice(
                    0,
                    MAX_ATTENTION_ITEMS
                ),

            opportunities: {
                metaTitles:
                    missingMetaTitle,

                metaDescriptions:
                    missingMetaDesc,

                imageAltText:
                    missingAltText,

                focusKeywords:
                    missingFocusKeyword,

                canonicals:
                    missingCanonical,
            },

            generatedAt:
                new Date().toISOString(),
        };

        /* ------------------------------------------------------------------
           SERVER LOG
        ------------------------------------------------------------------ */

        const duration =
            Date.now() -
            startedAt;

        console.log(
            `[SEO ANALYTICS] ${products.length} products analyzed in ${duration}ms`
        );

        /* ------------------------------------------------------------------
           SUCCESS RESPONSE
        ------------------------------------------------------------------ */

        return NextResponse.json(
            {
                success: true,
                data: response,
            },
            {
                status: 200,
                headers: {
                    "Cache-Control":
                        "no-store, max-age=0",
                },
            }
        );
    } catch (error) {
        /* ------------------------------------------------------------------
           ERROR LOG
        ------------------------------------------------------------------ */

        console.error(
            "[SEO ANALYTICS ERROR]",
            error
        );

        const message =
            error instanceof Error
                ? error.message
                : "Unknown server error";

        /* ------------------------------------------------------------------
           ERROR RESPONSE
        ------------------------------------------------------------------ */

        return NextResponse.json(
            {
                success: false,
                error:
                    "SEO Analytics Failed",
                message,
            },
            {
                status: 500,
                headers: {
                    "Cache-Control":
                        "no-store, max-age=0",
                },
            }
        );
    }
}