export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

import { NextResponse } from "next/server";
export async function GET() {
  return NextResponse.json([
    { _id: "1", q: "Are they authentic?", a: "100% Swiss Guaranteed." }
  ]);
}