export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { name, brand } = await request.json();

    // Simulated AI Delay to mimic processing
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Dynamic Luxury Copy Generation Logic
    const luxuryAdjectives = ["masterclass in horological engineering", "pinnacle of mechanical artistry", "testament to Swiss precision", "rare and elusive asset", "crown jewel of modern watchmaking"];
    const randomAdjective = luxuryAdjectives[Math.floor(Math.random() * luxuryAdjectives.length)];

    const aiGeneratedTitle = `${brand || 'Luxury'} ${name} - Exceptional Grade`;
    const aiGeneratedDescription = `The ${brand || ''} ${name} represents a ${randomAdjective}. Crafted from aerospace-grade materials, this timepiece features a meticulous hand-finished dial, an in-house self-winding caliber, and superlative chronometric performance. Every edge is polished to perfection, ensuring its status not just as a tool to tell time, but as a generational asset designed to outlast its wearer. Accompanied by full diplomatic provenance and a bespoke lifetime mechanical guarantee.`;

    return NextResponse.json({ 
      success: true, 
      title: aiGeneratedTitle,
      description: aiGeneratedDescription 
    });

  } catch (error) {
    return NextResponse.json({ success: false, message: 'AI Engine Offline' }, { status: 500 });
  }
}