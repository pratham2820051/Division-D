"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

const slides = [
  {
    id: 0,
    label: "Urban",
    image: "https://framerusercontent.com/images/Or4CSjqekPU2Ug6V0zSDTbgtg.jpg",
  },
  {
    id: 1,
    label: "Latest",
    image: "https://framerusercontent.com/images/YI6OX1Ix0QFPJHufS272fscYaI.jpg",
  },
  {
    id: 2,
    label: "Premium",
    image: "https://framerusercontent.com/images/HaLbFMQL3UBYnLDE5V1KjUjLbU.jpg",
  },
  {
    id: 3,
    label: "Arctic",
    image: "https://framerusercontent.com/images/g813yVl0fq2gEobS7kOZx537SY.jpg",
  },
  {
    id: 4,
    label: "Casual",
    image: "https://framerusercontent.com/images/UqbagK5Zf6G91yyijIvdScOQDI.png",
  },
  {
    id: 5,
    label: "Iconic",
    image: "https://framerusercontent.com/images/7dwU69CcPP5QPRAcGcQvWaJXm3c.png",
  },
  {
    id: 6,
    label: "Unique",
    image: "https://framerusercontent.com/images/xXRw7s77WdhR0P4zOTGGkDW2qs.jpg",
  }
];

// Staggered word animation variants
const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

const wordVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.215, 0.61, 0.355, 1] as any,
    },
  },
};

const fadeUpVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.7,
      ease: [0.215, 0.61, 0.355, 1] as any,
      delay: 0.5,
    },
  },
};

export default function HeroSection() {
  const [activeSlide, setActiveSlide] = useState(3); // Start with 'Arctic' as default

  // Auto-play option (optional, but let's keep it user interactive first)
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slides.length);
    }, 8000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="relative w-full h-[95vh] min-h-[650px] bg-[#F8F8F8] flex flex-col justify-between overflow-hidden select-none">
      {/* Background Image Carousel (Cross-Fade) */}
      <div className="absolute inset-0 z-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSlide}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            className="absolute inset-0"
          >
            <Image
              src={slides[activeSlide].image}
              alt={`${slides[activeSlide].label} Mood Background`}
              fill
              priority
              sizes="100vw"
              style={{ objectFit: 'cover', objectPosition: 'center 40%' }}
              className="brightness-90 scale-102"
            />
            {/* Soft dark overlays for text legibility */}
            <div className="absolute inset-0 bg-black/30" />
            <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/85 via-black/45 to-transparent" />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Hero Content Overlays */}
      <div className="relative z-10 w-full max-w-[1200px] mx-auto px-6 md:px-8 mt-24 md:mt-32">
        <div className="max-w-[600px] flex flex-col items-center text-center mx-auto">
          {/* Eyebrow Pill */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="flex items-center gap-3 backdrop-blur-md bg-white/15 border border-white/20 rounded-full p-1.5 pr-4 mb-6 shadow-lg"
          >
            <span className="bg-white text-black text-[11px] font-bold tracking-widest uppercase px-3 py-1 rounded-full shadow-sm">
              Soft
            </span>
            <span className="text-white text-xs font-medium tracking-wide">
              Warm Winter Layers
            </span>
          </motion.div>

          {/* Heading (Staggered Words) */}
          <motion.h1
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="text-white font-bold leading-[1.08] mb-6 tracking-tight flex flex-wrap justify-center gap-x-3 gap-y-1"
            style={{ fontSize: 'clamp(38px, 6vw, 68px)' }}
          >
            {"Premium wear for modern living".split(" ").map((word, i) => (
              <motion.span key={i} variants={wordVariants} className="inline-block">
                {word}
              </motion.span>
            ))}
          </motion.h1>

          {/* Subheading */}
          <motion.p
            variants={fadeUpVariants}
            initial="hidden"
            animate="visible"
            className="text-white/80 text-sm md:text-base font-light leading-relaxed mb-8 max-w-[500px] tracking-wide"
          >
            Discover our new range of soft clothes made for your daily look and your best days with the finest fabrics.
          </motion.p>

          {/* Buttons */}
          <motion.div
            variants={fadeUpVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-wrap justify-center gap-4"
          >
            <Link
              href="/shop"
              className="bg-white text-black hover:bg-black hover:text-white border border-white hover:border-black text-xs font-semibold tracking-[0.2em] uppercase px-8 py-3.5 transition-all duration-300 rounded-sm shadow-md"
            >
              See all collections
            </Link>
            <Link
              href="/contact"
              className="text-white hover:bg-white hover:text-black border border-white/40 hover:border-white text-xs font-semibold tracking-[0.2em] uppercase px-8 py-3.5 transition-all duration-300 rounded-sm backdrop-blur-sm"
            >
              Contact us
            </Link>
          </motion.div>
        </div>
      </div>

      {/* Thumbnail Carousel Section at the Bottom */}
      <div className="relative z-10 w-full max-w-[1200px] mx-auto px-6 md:px-8 pb-10">
        <div className="grid grid-cols-7 gap-2 md:gap-3 lg:gap-4 overflow-visible">
          {slides.map((slide) => {
            const isActive = activeSlide === slide.id;
            return (
              <button
                key={slide.id}
                onClick={() => setActiveSlide(slide.id)}
                className={`relative aspect-[4/3] rounded overflow-hidden cursor-pointer group transition-all duration-300 flex flex-col justify-end p-2 border ${
                  isActive
                    ? 'opacity-100 border-white shadow-lg ring-1 ring-white/30 scale-[1.03]'
                    : 'opacity-70 border-white/10 hover:opacity-90 hover:scale-[1.01]'
                }`}
              >
                {/* Background image preview */}
                <Image
                  src={slide.image}
                  alt={`${slide.label} thumbnail`}
                  fill
                  sizes="15vw"
                  style={{ objectFit: 'cover' }}
                  className="z-0 brightness-95"
                />

                {/* Overlays inside card */}
                <div className="absolute inset-0 bg-black/25 z-10" />
                <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 to-transparent z-10" />

                {/* Text name: only visible on active, or animate opacity */}
                <span
                  className={`relative z-20 text-[10px] md:text-xs font-semibold tracking-wider text-white uppercase text-center block w-full transition-opacity duration-300 ${
                    isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-60'
                  }`}
                >
                  {slide.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
