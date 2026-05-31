"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';

const carouselImages = [
  { url: "https://framerusercontent.com/images/U7CtuDK0AXUNTwGdENumrlmdyk.png?width=600", handle: "@wearix_style", name: "Grey Jacket Model" },
  { url: "https://framerusercontent.com/images/PhQ0ou5z6Mj6gzpcsLLi5rS6E0.png?width=600", handle: "@wearix_fits", name: "Red Hat Model" },
  { url: "https://framerusercontent.com/images/ftObEL64RY81LvY92K11dTejqZ4.png?width=600", handle: "@wearix_unlimited", name: "Suitcase Boy" },
  { url: "https://framerusercontent.com/images/3BJsJKp6d3GMb73lMFLvun3bVxE.png?width=600", handle: "@wearix_community", name: "Green Jacket Model" },
  { url: "https://framerusercontent.com/images/Q2qaxWvHcpcMDMRF6r6oA7jcK9Q.jpg?width=600", handle: "@wearix_daily", name: "Black Hoodie Model" },
  { url: "https://framerusercontent.com/images/jz6J8tN19rBotBJ08ib9LED2s8.png?width=600", handle: "@wearix_concept", name: "Velvet Hoodie Model" },
  { url: "https://framerusercontent.com/images/U7CtuDK0AXUNTwGdENumrlmdyk.png?width=600", handle: "@wearix_style_repeat", name: "Grey Jacket Model Repeat" }
];

export default function StayConnectedSection() {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  return (
    <section className="w-full bg-white py-24 select-none overflow-hidden flex flex-col items-center">
      {/* Centered Header Content */}
      <div className="max-w-[700px] text-center px-6 mb-12 flex flex-col items-center">
        <h2
          className="font-bold text-[#1A1A1A] leading-[1.08] tracking-tight mb-6"
          style={{ fontSize: 'clamp(32px, 5vw, 56px)' }}
        >
          See our community
          <br />
          in modern silhouettes
        </h2>
        <p className="text-[#666666] text-sm md:text-base font-light leading-relaxed mb-8 max-w-[500px] tracking-wide">
          Connect with us on social media for a daily dose of fresh style, featuring exclusive looks from our community.
        </p>

        {/* Buttons Row */}
        <div className="flex items-center gap-4">
          <Link
            href="/shop"
            className="bg-black hover:bg-black/80 text-white text-sm font-medium px-6 py-2.5 rounded-full transition-all duration-200"
          >
            See collections
          </Link>
          <Link
            href="/contact"
            className="bg-white hover:bg-[#F5F5F5] text-black border border-[#E5E5E5] text-sm font-medium px-6 py-2.5 rounded-full transition-all duration-200"
          >
            Contact us
          </Link>
        </div>
      </div>

      {/* 3D Perspective Curved Carousel Wrapper */}
      <div className="w-full max-w-[1400px] flex justify-center items-center overflow-visible py-8 px-6 md:px-12">
        <div 
          className="flex items-center justify-center gap-0 overflow-visible w-full"
          style={{
            perspective: '1200px',
            transformStyle: 'preserve-3d'
          }}
        >
          {carouselImages.map((img, i) => {
            const centerIdx = 3;
            const offset = i - centerIdx;
            
            // 3D parameters to shape a concave curved arch
            // Sides are tilted inwards (rotateY) and pulled closer to camera (translateZ)
            const rotateY = -offset * 12;
            const translateZ = (centerIdx - Math.abs(offset)) * -35; 
            const scale = 1 - Math.abs(offset) * 0.04;
            
            // Hover overrides: when hovered, flatten the card and bring it to front
            const isHovered = hoveredIdx === i;
            const hasActiveHover = hoveredIdx !== null;
            const isDimmed = hasActiveHover && !isHovered;

            return (
              <motion.div
                key={i}
                onMouseEnter={() => setHoveredIdx(i)}
                onMouseLeave={() => setHoveredIdx(null)}
                style={{
                  transformStyle: 'preserve-3d',
                  willChange: 'transform, opacity'
                }}
                animate={{
                  transform: isHovered
                    ? `rotateY(0deg) translateZ(80px) scale(1.08)`
                    : `rotateY(${rotateY}deg) translateZ(${translateZ}px) scale(${scale})`,
                  opacity: isDimmed ? 0.5 : 1,
                  zIndex: isHovered ? 50 : 10 + (centerIdx - Math.abs(offset))
                }}
                transition={{
                  type: 'spring',
                  stiffness: 180,
                  damping: 20
                }}
                // Custom overlapping negative margins on desktop, regular gap spacing on mobile
                className={`relative flex-shrink-0 aspect-[4/5] rounded-[24px] overflow-hidden border border-white/20 shadow-lg cursor-pointer bg-white group ${
                  // Make the cards slightly wider in the center and tall on the edges to fit perspective
                  i === 0 || i === 6 
                    ? 'w-[140px] sm:w-[220px] md:w-[260px] mx-[-12px] sm:mx-[-25px] md:mx-[-45px]'
                    : i === 1 || i === 5
                    ? 'w-[120px] sm:w-[190px] md:w-[220px] mx-[-10px] sm:mx-[-20px] md:mx-[-35px]'
                    : 'w-[100px] sm:w-[160px] md:w-[180px] mx-[-8px] sm:mx-[-15px] md:mx-[-25px]'
                }`}
              >
                {/* Product Image */}
                <Image
                  src={img.url}
                  alt={img.name}
                  fill
                  sizes="(max-width: 640px) 15vw, (max-width: 1024px) 20vw, 300px"
                  style={{ objectFit: 'cover' }}
                  className="transition-transform duration-700 group-hover:scale-[1.03]"
                  draggable={false}
                />

                {/* Overlays */}
                <div className="absolute inset-0 bg-black/10 transition-opacity duration-300 group-hover:opacity-0" />
                <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                {/* Instagram Handle Text */}
                <div className="absolute inset-x-0 bottom-4 text-center text-white text-[10px] md:text-xs font-semibold tracking-wider uppercase opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  {img.handle}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
