import type { ReactElement } from "react";
import { NextResponse } from "next/server";

// 🍯 ANTI-BOT HONEYPOT PROTECTION
// This middleware detects and blocks automated bots by checking for honeypot field submissions

export async function honeypotMiddleware(request: Request): Promise<NextResponse | null> {
    if (request.method !== "POST") {
        return null;
    }

    const url = new URL(request.url);
    const pathname = url.pathname;

    if (!pathname.includes("/api/auth/") && !pathname.includes("/login") && !pathname.includes("/register")) {
        return null;
    }

    try {
        const body = await request.json();

        if (body.website && body.website.trim() !== "") {
            const forwarded = request.headers.get("x-forwarded-for");
            const clientIp = forwarded ? forwarded.split(",")[0].trim() : "unknown";
            const userAgent = request.headers.get("user-agent") ?? "unknown";

            console.warn(`🤖 Bot detected via honeypot:`, {
                ip: clientIp,
                userAgent: userAgent.substring(0, 50),
                path: pathname,
                timestamp: new Date().toISOString(),
            });

            return NextResponse.json(
                {
                    success: false,
                    error: "Request could not be processed. Please try again.",
                },
                { status: 400 }
            );
        }

        return null;
    } catch {
        return null;
    }
}

export const HONEYPOT_FIELD_NAME = "website";

export function createHoneypotField(): string {
    return `
        <div style="position: absolute; left: -9999px; opacity: 0; height: 0; width: 0; overflow: hidden;" aria-hidden="true">
            <input 
                type="text" 
                name="${HONEYPOT_FIELD_NAME}" 
                tabIndex="-1" 
                autoComplete="off"
                value=""
            />
        </div>
    `;
}

export function HoneypotField(): ReactElement {
    return (
        <div
            style={{
                position: "absolute",
                left: "-9999px",
                opacity: 0,
                height: 0,
                width: 0,
                overflow: "hidden",
            }}
            aria-hidden="true"
        >
            <input
                type="text"
                name={HONEYPOT_FIELD_NAME}
                tabIndex={-1}
                autoComplete="off"
                defaultValue=""
            />
        </div>
    );
}
