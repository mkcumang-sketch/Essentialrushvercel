export interface SeoData {
    metaTitle: string;
    metaDescription: string;
    focusKeyword: string;
    slug: string;
    noindex: boolean;
    imageAltTexts: Record<string, string>;
}

export interface SeoEntityData {
    name?: string;
    title?: string;
    description?: string;
    introContent?: string;
    brand?: string;
    category?: string;
    price?: string | number;
    imageUrl?: string;
    images?: string[];
    seo?: SeoData;
}