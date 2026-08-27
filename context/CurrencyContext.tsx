"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Currency = 'INR' | 'USD' | 'EUR' | 'GBP' | 'AED';

interface CurrencyContextType {
    currency: Currency;
    setCurrency: (c: Currency) => void;
    convertPrice: (priceINR: number)=> number;
    formatPrice: (priceINR: number) => string;
    symbol: string;
    isLoading: boolean;
}

const RATES: Record<Currency, number> = {
    INR: 1,
    USD: 0.012,
    EUR: 0.011,
    GBP: 0.0095,
    AED: 0.044,
};

const SYMBOLS: Record<Currency, string> = {
    INR: '₹',
    USD: '$',
    EUR: '€',
    GBP: '£',
    AED: 'د.إ',
};

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: ReactNode }) {
    const [currency, setCurrency] = useState<Currency>('INR');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const stored = localStorage.getItem('preferred_currency') as Currency;
        if (stored && RATES[stored]) {
            setCurrency(stored);
        } else {
            fetch('https://ipapi.co/json/')
                .then(res => res.json())
                .then(data => {
                    const country = data?.country_code;
                    let detected: Currency = 'INR';
                    if (['US', 'CA'].includes(country)) detected = 'USD';
                    else if (['GB'].includes(country)) detected = 'GBP';
                    else if (['AE', 'SA', 'KW', 'QA'].includes(country)) detected = 'AED';
                    else if (['DE', 'FR', 'IT', 'ES', 'NL'].includes(country)) detected = 'EUR';
                    
                    setCurrency(detected);
                    localStorage.setItem('preferred_currency', detected);
                })
                .catch(() => {})
                .finally(() => setIsLoading(false));
        }
        setIsLoading(false);
    }, []);

    const convertPrice = (priceINR: number): number => {
        return priceINR * RATES[currency];
    };

    const formatPrice = (priceINR: number): string => {
        const converted = convertPrice(priceINR);
        return `${SYMBOLS[currency]}${converted.toLocaleString(undefined, {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        })}`;
    };

    return (
        <CurrencyContext.Provider value={{ currency, setCurrency, convertPrice, formatPrice, symbol: SYMBOLS[currency], isLoading }}>
            {children}
        </CurrencyContext.Provider>
    );
}

export function useCurrency() {
    const context = useContext(CurrencyContext);
    if (!context) {
        throw new Error('useCurrency must be used within CurrencyProvider');
    }
    return context;
}

export function CurrencySwitcher() {
    const { currency, setCurrency } = useCurrency();
    
    const currencies: Currency[] = ['INR', 'USD', 'EUR', 'GBP', 'AED'];

    return (
        <select
            value={currency}
            onChange={(e) => {
                const newCurrency = e.target.value as Currency;
                setCurrency(newCurrency);
                localStorage.setItem('preferred_currency', newCurrency);
            }}
            className="bg-transparent border border-gray-200 rounded-lg px-3 py-2 text-xs font-bold uppercase tracking-widest cursor-pointer hover:border-black transition-colors"
        >
            {currencies.map((c) => (
                <option key={c} value={c} className="bg-white">
                    {SYMBOLS[c]} {c}
                </option>
            ))}
        </select>
    );
}