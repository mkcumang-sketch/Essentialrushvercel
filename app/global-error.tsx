"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body className="bg-black text-white flex flex-col items-center justify-center h-screen font-serif">
        <h2 className="text-4xl text-[#D4AF37] mb-4 text-center px-4">Something went wrong</h2>
        <p className="text-gray-400 mb-8 font-sans text-sm tracking-widest uppercase">
          Please try again.
        </p>
        <button
          onClick={() => reset()} // Next.js isse automatically reset function deta hai
          className="px-8 py-3 border border-[#D4AF37] text-[#D4AF37] rounded-full hover:bg-[#D4AF37] hover:text-black transition-all"
        >
          Try again
        </button>
      </body>
    </html>
  );
}