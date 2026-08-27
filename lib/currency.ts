import { NextRequest } from 'next/server';

export const CURRENCIES = {
    INR: { symbol: '₹', code: 'INR', name: 'Indian Rupee', rate: 1 },
    USD: { symbol: '$', code: 'USD', name: 'US Dollar', rate: 0.012 },
    EUR: { symbol: '€', code: 'EUR', name: 'Euro', rate: 0.011 },
    GBP: { symbol: '£', code: 'GBP', name: 'British Pound', rate: 0.0095 },
    AED: { symbol: 'د.إ', code: 'AED', name: 'UAE Dirham', rate: 0.044 },
} as const;

export type CurrencyCode = keyof typeof CURRENCIES;

const GEO_IP_API = process.env.GEO_IP_API || 'http://ip-api.com/json';
const CURRENCY_API = process.env.CURRENCY_API || 'https://api.exchangerate.host';

export async function detectCountryFromIP(ip: string): Promise<string> {
    try {
        const response = await fetch(`${GEO_IP_API}/${ip}?fields=countryCode`, {
            next: { revalidate: 3600 }
        });
        const data = await response.json();
        return data.countryCode || 'IN';
    } catch (error) {
        console.error('Geo detection error:', error);
        return 'IN';
    }
}

export async function getCurrencyForCountry(countryCode: string): Promise<CurrencyCode> {
    const countryToCurrency: Record<string, CurrencyCode> = {
        'IN': 'INR',
        'US': 'USD', 'CA': 'USD',
        'GB': 'GBP', 'DE': 'EUR', 'FR': 'EUR', 'IT': 'EUR', 'ES': 'EUR', 'NL': 'EUR', 'BE': 'EUR', 'AT': 'EUR', 'PT': 'EUR', 'GR': 'EUR', 'IE': 'EUR', 'FI': 'EUR',
        'AE': 'AED', 'SA': 'AED', 'KW': 'AED', 'QA': 'AED', 'OM': 'AED',
    };
    
    return countryToCurrency[countryCode] || 'INR';
}

export async function detectCurrencyFromRequest(request: Request): Promise<{ currency: CurrencyCode; country: string }> {
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded?.split(',')[0]?.trim() || '127.0.0.1';
    
    const country = await detectCountryFromIP(ip);
    const currency = await getCurrencyForCountry(country);
    
    return { currency, country };
}

export function convertPrice(priceINR: number, targetCurrency: CurrencyCode): string {
    const target = CURRENCIES[targetCurrency];
    if (!target || targetCurrency === 'INR') {
        return `₹${priceINR.toLocaleString('en-IN')}`;
    }
    
    const converted = priceINR * target.rate;
    
    if (targetCurrency === 'USD') {
        return `$${converted.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    }
    if (targetCurrency === 'EUR') {
        return `€${converted.toLocaleString('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    }
    if (targetCurrency === 'GBP') {
        return `£${converted.toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    }
    if (targetCurrency === 'AED') {
        return `د.إ${converted.toLocaleString('ar-AE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    }
    
    return `${target.symbol}${converted.toLocaleString()}`;
}

export function formatPriceWithCurrency(priceINR: number, currency: CurrencyCode): string {
    if (currency === 'INR') {
        return `₹${priceINR.toLocaleString('en-IN')}`;
    }
    return convertPrice(priceINR, currency);
}

export function getCurrencySettings(req: NextRequest) {
    const currencyParam = req.nextUrl.searchParams.get('currency')?.toUpperCase() as CurrencyCode | null;
    if (currencyParam && CURRENCIES[currencyParam]) {
        return currencyParam;
    }
    return 'INR' as CurrencyCode;
}

export async function fetchLiveRates(): Promise<Record<string, number>> {
    try {
        const response = await fetch(`${CURRENCY_API}/latest?base=INR`, {
            next: { revalidate: 300 }
        });
        const data = await response.json();
        return data.rates || {};
    } catch (error) {
        console.error('Currency rate fetch error:', error);
        return {};
    }
}

export const IP_INFO_CACHE = new Map<string, { country: string; currency: CurrencyCode; timestamp: number }>();

export async function getGeoInfo(ip: string): Promise<{ country: string; currency: CurrencyCode }> {
    const cached = IP_INFO_CACHE.get(ip);
    if (cached && Date.now() - cached.timestamp < 3600000) {
        return { country: cached.country, currency: cached.currency };
    }
    
    const country = await detectCountryFromIP(ip);
    const currency = await getCurrencyForCountry(country);
    
    IP_INFO_CACHE.set(ip, { country, currency, timestamp: Date.now() });
    
    if (IP_INFO_CACHE.size > 1000) {
        const firstKey = IP_INFO_CACHE.keys().next().value;
        if (firstKey) IP_INFO_CACHE.delete(firstKey);
    }
    
    return { country, currency };
}