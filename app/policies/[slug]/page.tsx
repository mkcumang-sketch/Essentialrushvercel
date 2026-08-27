
import {
    ShieldCheck,
    ArrowLeft,
    Clock,
    Scale,
} from "lucide-react";
import Link from "next/link";
import mongoose, {
    Document,
    Model,
    Schema,
} from "mongoose";

import { notFound } from "next/navigation";
import connectDB from "@/lib/mongodb";

/* =========================================================
   TYPES
========================================================= */

interface LegalPage {
    id?: string;
    title: string;
    slug: string;
    content: string;
}

interface CMSDocument extends Document {
    legalPages: LegalPage[];
}

/* =========================================================
   MONGOOSE SCHEMA
========================================================= */

const LegalPageSchema = new Schema<LegalPage>(
    {
        id: {
            type: String,
        },

        title: {
            type: String,
            required: true,
        },

        slug: {
            type: String,
            required: true,
        },

        content: {
            type: String,
            required: true,
        },
    },
    {
        _id: false,
    }
);

const CmsSchema = new Schema<CMSDocument>(
    {
        legalPages: {
            type: [LegalPageSchema],
            default: [],
        },
    },
    {
        collection: "cms",
        timestamps: true,
    }
);

/* =========================================================
   CMS MODEL
========================================================= */

const CMS: Model<CMSDocument> =
    (mongoose.models.CMS as Model<CMSDocument>) ||
    mongoose.model<CMSDocument>(
        "CMS",
        CmsSchema
    );

/* =========================================================
   PAGE PROPS
========================================================= */

interface PolicyPageProps {
    params: Promise<{
        slug: string;
    }>;
}

/* =========================================================
   POLICY PAGE
========================================================= */

export default async function PolicyPage({
    params,
}: PolicyPageProps) {
    const { slug } = await params;

    /* ---------------------------------------------
       Connect to MongoDB
    --------------------------------------------- */

    await connectDB();

    /* ---------------------------------------------
       Fetch CMS data
       lean() returns a plain JavaScript object
    --------------------------------------------- */

    const cmsData = await CMS.findOne()
        .lean<CMSDocument>()
        .exec();

    /* ---------------------------------------------
       Find policy by slug
    --------------------------------------------- */

    const policy = cmsData?.legalPages?.find(
        (page) => page.slug === slug
    );

    /* =================================================
       POLICY NOT FOUND
    ================================================= */

    if (!policy) {
        return (
            <div className="min-h-screen bg-[#FAFAFA] text-black pb-24">
                {/* =========================================
                   LUXURY HEADER FALLBACK
                ========================================= */}

                <div className="bg-black text-white pt-32 pb-20 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#D4AF37]/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />

                    <div className="max-w-4xl mx-auto px-6 relative z-10">
                        <Link
                            href="/"
                            className="inline-flex items-center gap-2 text-[#D4AF37] text-[10px] font-black uppercase tracking-[5px] mb-12 hover:gap-4 transition-all"
                        >
                            <ArrowLeft size={14} />
                            Back home
                        </Link>

                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 bg-[#D4AF37]/10 text-[#D4AF37] rounded-2xl flex items-center justify-center">
                                <ShieldCheck size={24} />
                            </div>

                            <span className="text-[10px] font-black uppercase tracking-[8px] text-gray-500">
                                Legal Protocol
                            </span>
                        </div>

                        <h1 className="text-5xl md:text-7xl font-serif font-black italic tracking-tighter mb-8 capitalize">
                            {slug.replace(/-/g, " ")}
                        </h1>
                    </div>
                </div>

                {/* =========================================
                   FALLBACK CONTENT
                ========================================= */}

                <div className="max-w-4xl mx-auto px-6 -mt-10 relative z-20">
                    <div className="bg-white rounded-[50px] p-12 md:p-20 shadow-2xl border border-gray-100 text-center">
                        <div className="w-20 h-20 bg-gray-50 text-gray-300 rounded-full flex items-center justify-center mx-auto mb-8">
                            <Scale size={40} />
                        </div>

                        <h2 className="text-3xl font-serif font-black italic tracking-tighter mb-4">
                            Document Under Review
                        </h2>

                        <p className="text-gray-500 max-w-md mx-auto leading-relaxed">
                            The{" "}
                            <span className="text-black font-bold">
                                /{slug}
                            </span>{" "}
                            policy is currently being updated by our legal team.
                            Please check back later for the finalized protocol.
                        </p>

                        <div className="mt-16 pt-12 border-t border-gray-100 flex justify-center">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-black text-[#D4AF37] rounded-full flex items-center justify-center font-bold">
                                    ♞
                                </div>

                                <div className="text-left">
                                    <p className="text-[10px] font-black uppercase tracking-widest">
                                        Essential Rush
                                    </p>

                                    <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest italic">
                                        Vault Integrity Verified
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    /* =================================================
       POLICY FOUND
    ================================================= */

    return (
        <div className="min-h-screen bg-[#FAFAFA] text-black pb-24">
            {/* =========================================
               LUXURY HEADER
            ========================================= */}

            <div className="bg-black text-white pt-32 pb-20 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#D4AF37]/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />

                <div className="max-w-4xl mx-auto px-6 relative z-10">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 text-[#D4AF37] text-[10px] font-black uppercase tracking-[5px] mb-12 hover:gap-4 transition-all"
                    >
                        <ArrowLeft size={14} />
                        Back home
                    </Link>

                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 bg-[#D4AF37]/10 text-[#D4AF37] rounded-2xl flex items-center justify-center">
                            <ShieldCheck size={24} />
                        </div>

                        <span className="text-[10px] font-black uppercase tracking-[8px] text-gray-500">
                            Legal Protocol
                        </span>
                    </div>

                    <h1 className="text-5xl md:text-7xl font-serif font-black italic tracking-tighter mb-8">
                        {policy.title}
                    </h1>

                    <div className="flex flex-wrap gap-8">
                        <div className="flex items-center gap-3">
                            <Clock
                                size={16}
                                className="text-[#D4AF37]"
                            />

                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                                Status: Active
                            </span>
                        </div>

                        <div className="flex items-center gap-3">
                            <Scale
                                size={16}
                                className="text-[#D4AF37]"
                            />

                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                                Legally Binding
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* =========================================
               CONTENT VAULT
            ========================================= */}

            <div className="max-w-4xl mx-auto px-6 -mt-10 relative z-20">
                <div className="bg-white rounded-[50px] p-12 md:p-20 shadow-2xl border border-gray-100">
                    <div
                        className="prose prose-lg max-w-none prose-headings:font-serif prose-headings:font-black prose-headings:italic prose-headings:tracking-tighter prose-p:text-gray-600 prose-p:leading-relaxed prose-strong:text-black prose-strong:font-black prose-li:text-gray-600"
                        dangerouslySetInnerHTML={{
                            __html: policy.content,
                        }}
                    />
                </div>
            </div>
        </div>
    );
}