"use client";

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { mockProducts } from '@/data/mockProducts';
import ProductCard from '@/components/common/ProductCard';

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

export default function NewArrivalsSection() {
  // Get products tagged with 'new-arrivals'
  const newArrivals = mockProducts.filter((product) =>
    product.tags.includes('new-arrivals')
  );

  return (
    <section className="w-full bg-white py-24 px-6 md:px-8 select-none">
      <div className="max-w-[1200px] mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 0.7, ease: [0.215, 0.61, 0.355, 1] as any }}
            className="text-left"
          >
            <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-[#666666] block mb-3">
              New Arrivals
            </span>
            <h2
              className="font-bold text-[#1A1A1A] leading-[1.1] tracking-tight"
              style={{ fontSize: 'clamp(28px, 4vw, 42px)' }}
            >
              Fresh fits in our
              <br />
              latest drop
            </h2>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Link
              href="/shop?filter=new-arrivals"
              className="inline-flex items-center text-xs font-bold tracking-[0.2em] uppercase text-[#1A1A1A] border-b border-[#1A1A1A] pb-1 hover:opacity-60 transition-all duration-200"
            >
              See all collections
            </Link>
          </motion.div>
        </div>

        {/* Product Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-12"
        >
          {newArrivals.map((product) => (
            <div key={product.id}>
              <ProductCard product={product} />
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
