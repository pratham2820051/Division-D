"use client";

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

export default function BrandStorySection() {
  return (
    <section className="w-full bg-[#F8F8F8] overflow-hidden py-16 md:py-24 px-6 md:px-8 select-none">
      <div className="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-12 items-center gap-12 lg:gap-16">
        
        {/* Left: Image (5 cols) */}
        <motion.div
          className="relative h-[450px] md:h-[600px] lg:col-span-5 rounded-lg overflow-hidden shadow-sm"
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.8, ease: [0.215, 0.61, 0.355, 1] as any }}
        >
          <Image
            src="https://framerusercontent.com/images/wtLmzE2wAi9yJrXcWCnR857MSwQ.jpg?width=1000"
            alt="Wearix Brand Story Portrait"
            fill
            sizes="(max-width: 1024px) 100vw, 40vw"
            style={{ objectFit: 'cover', objectPosition: 'center 20%' }}
            className="brightness-95 hover:scale-[1.02] transition-transform duration-700"
            draggable={false}
          />
        </motion.div>

        {/* Right: Text content (7 cols) */}
        <motion.div
          className="flex flex-col lg:col-span-7 justify-center lg:pl-6 text-left"
          initial={{ opacity: 0, x: 50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.8, ease: [0.215, 0.61, 0.355, 1] as any, delay: 0.1 }}
        >
          {/* Eyebrow */}
          <div className="flex items-center gap-3 mb-6">
            <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-[#666666]">
              Wearix
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#1A1A1A]" />
            <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-[#666666]">
              Since 2014
            </span>
          </div>

          {/* Heading */}
          <h2
            className="font-bold text-[#1A1A1A] leading-[1.1] tracking-tight mb-8"
            style={{ fontSize: 'clamp(28px, 4vw, 48px)' }}
          >
            Defining
            <br />
            modern style
          </h2>

          {/* Body Copy */}
          <p className="text-[#666666] text-sm md:text-base font-light leading-relaxed max-w-lg mb-10 tracking-wide">
            A decade ago, we set out to redefine the modern silhouette. Today, we merge urban utility with high-end aesthetics in a resilient, beautiful collection. Our design philosophy centers around high-quality materials and comfortable wear for your daily living.
          </p>

          {/* CTA Link */}
          <Link
            href="/about"
            className="inline-flex items-center gap-3 text-xs font-bold tracking-[0.2em] uppercase text-[#1A1A1A] border-b border-[#1A1A1A] pb-1 hover:gap-5 hover:opacity-60 transition-all duration-300 w-fit"
          >
            <span>More about us</span>
            <ArrowRight size={14} className="text-[#1A1A1A]" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
