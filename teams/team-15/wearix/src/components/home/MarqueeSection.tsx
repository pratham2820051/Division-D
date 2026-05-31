"use client";

import React from 'react';

const words = ["Urban", "Latest", "Premium", "Arctic", "Casual", "Iconic", "Unique", "Soft"];

export default function MarqueeSection() {
  return (
    <div className="w-full overflow-hidden bg-white border-y border-[#E5E5E5] py-5 select-none relative z-10">
      <div className="flex w-max animate-marquee">
        {/* Repeat the word set multiple times to ensure full width seamless loop */}
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-6 md:gap-8 px-4 md:px-6">
            {words.map((word) => (
              <span
                key={word}
                className="text-black font-bold uppercase tracking-[0.3em] text-xs md:text-sm flex items-center gap-6 md:gap-8"
              >
                <span>{word}</span>
                <span className="text-[#CCCCCC] text-[10px]">•</span>
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
