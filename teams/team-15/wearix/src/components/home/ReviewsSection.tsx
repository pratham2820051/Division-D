"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';

const reviews = [
  {
    id: 1,
    quote: "The premium quality of the men's collection is truly unmatched lately. The fabrics feel incredibly premium and soft. This specific tailored fit is perfect for my busy office. A very sharp look. I love it every day.",
    name: "James Carter",
    role: "Creative Director",
    rating: 5,
  },
  {
    id: 2,
    quote: "The customer service team went above and beyond to help me exchange sizes. The new fit is perfect and the organic cotton feels extremely comfortable. I will definitely be ordering again soon!",
    name: "Sarah Jenkins",
    role: "Fashion Designer",
    rating: 5,
  },
  {
    id: 3,
    quote: "Finding modern clothing that is durable for children is tough, but Wearix nailed it. The kids' garments hold up perfectly after multiple washes and remain incredibly soft.",
    name: "Marcus Vance",
    role: "Product Designer",
    rating: 5,
  }
];

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.7,
      ease: [0.215, 0.61, 0.355, 1] as any,
    },
  },
};

export default function ReviewsSection() {
  return (
    <section className="w-full bg-white py-24 px-6 md:px-8 select-none">
      <div className="max-w-[1200px] mx-auto">
        {/* Header & Rating Banner */}
        <div className="text-center max-w-[650px] mx-auto mb-20">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-3 bg-[#F8F8F8] border border-[#E5E5E5] px-4 py-2 rounded-full mb-6"
          >
            <div className="flex items-center gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} size={14} className="fill-black text-black" />
              ))}
            </div>
            <span className="text-xs font-semibold text-[#1A1A1A] tracking-wide">
              4.9/5 from 1k+ reviews
            </span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-bold text-[#1A1A1A] leading-[1.1] tracking-tight mb-6"
            style={{ fontSize: 'clamp(28px, 4vw, 42px)' }}
          >
            The voice of quality
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-[#666666] text-sm md:text-base font-light leading-relaxed tracking-wide"
          >
            Experience the difference through the words of customers who value premium fabrics and timeless design.
          </motion.p>
        </div>

        {/* Testimonial Cards Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8"
        >
          {reviews.map((rev) => (
            <motion.div
              key={rev.id}
              variants={cardVariants}
              className="bg-[#F8F8F8] border border-[#E5E5E5] p-8 rounded-[20px] flex flex-col justify-between hover:border-black transition-all duration-300 shadow-sm hover:shadow"
            >
              {/* Quote text */}
              <p className="text-[#1A1A1A] text-sm font-light leading-relaxed mb-8 tracking-wide italic">
                &ldquo;{rev.quote}&rdquo;
              </p>

              {/* Author details */}
              <div className="border-t border-[#E5E5E5] pt-6 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-[#1A1A1A] tracking-tight">
                    {rev.name}
                  </h4>
                  <p className="text-[11px] text-[#666666] uppercase tracking-wider mt-0.5">
                    {rev.role}
                  </p>
                </div>

                <div className="flex gap-0.5">
                  {Array.from({ length: rev.rating }).map((_, i) => (
                    <Star key={i} size={11} className="fill-black text-black" />
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
