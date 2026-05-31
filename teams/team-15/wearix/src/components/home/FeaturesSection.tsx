"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Heart, Shield, Layers, Package, CheckCircle } from 'lucide-react';

const features = [
  {
    icon: Heart,
    title: "Everyday Comfort",
    description: "Designed to feel natural on the body throughout long, active days.",
    tags: ["All-day wear", "Comfort", "Relaxed fit"]
  },
  {
    icon: Sparkles,
    title: "Modern Silhouettes",
    description: "Contemporary shapes balance structure & ease for confident everyday styling.",
    tags: ["Balanced fit", "Modern", "Structured"]
  },
  {
    icon: Layers,
    title: "Effortless Styling",
    description: "Pieces work together naturally, making daily outfit choices simple & intuitive.",
    tags: ["Versatile", "Easy to style", "Layered"]
  },
  {
    icon: Package,
    title: "Daily Essentials",
    description: "Core clothing pieces designed for frequent wear across modern everyday routines.",
    tags: ["Core pieces", "Everyday", "Wearable"]
  },
  {
    icon: Shield,
    title: "Wearable Design",
    description: "Design decisions focused on comfort, fit, and real-life wearability.",
    tags: ["Practical", "Functional", "Adaptable"]
  },
  {
    icon: CheckCircle,
    title: "Clean Aesthetic",
    description: "Clean lines, minimal details, and timeless shapes that outlast seasonal trends.",
    tags: ["Clean lines", "Minimal", "Timeless"]
  }
];

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
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

export default function FeaturesSection() {
  return (
    <section className="w-full bg-[#F8F8F8] py-24 px-6 md:px-8 select-none">
      <div className="max-w-[1200px] mx-auto">
        {/* Header */}
        <div className="text-center max-w-[650px] mx-auto mb-20">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-left md:text-center"
          >
            <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-[#666666] block mb-3">
              What defines our wear
            </span>
            <h2
              className="font-bold text-[#1A1A1A] leading-[1.1] tracking-tight mb-6"
              style={{ fontSize: 'clamp(28px, 4vw, 42px)' }}
            >
              Where style meets ease
            </h2>
            <p className="text-[#666666] text-sm md:text-base font-light leading-relaxed tracking-wide">
              Thoughtful design blending modern style, comfort, and versatility for everyday living across lifestyles.
            </p>
          </motion.div>
        </div>

        {/* Features Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8"
        >
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={idx}
                variants={cardVariants}
                className="bg-white border border-[#E5E5E5] p-8 rounded-[24px] hover:border-black transition-all duration-300 flex flex-col justify-between hover:shadow-sm"
              >
                <div>
                  {/* Icon Wrapper */}
                  <div className="w-12 h-12 rounded-full bg-[#F8F8F8] flex items-center justify-center border border-[#E5E5E5] mb-6">
                    <Icon size={20} className="text-[#1A1A1A]" strokeWidth={1.5} />
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-base font-bold text-[#1A1A1A] mb-3 tracking-tight">
                    {feature.title}
                  </h3>
                  <p className="text-[#666666] text-xs font-light leading-relaxed mb-8 tracking-wide">
                    {feature.description}
                  </p>
                </div>

                {/* Tags list */}
                <div className="flex flex-wrap gap-2 border-t border-[#E5E5E5]/60 pt-6">
                  {feature.tags.map((tag) => (
                    <span
                      key={tag}
                      className="bg-[#F8F8F8] text-[#666666] text-[9px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full border border-[#E5E5E5]/30"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
