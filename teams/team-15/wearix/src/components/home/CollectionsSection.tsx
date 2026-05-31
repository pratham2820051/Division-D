"use client";

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

const collections = [
  {
    id: "men",
    label: "Men's wear",
    tagline: "Premium modern collection for men",
    description: "Upgrade your daily look with our crafted pieces made from the finest fabrics for lasting comfort and timeless style.",
    price: "₹2,999",
    image: "https://framerusercontent.com/images/FFAlreqmltBbtn7iNy9lIQTMI.png?width=968",
    href: "/shop?category=Men",
  },
  {
    id: "women",
    label: "Women's wear",
    tagline: "Modern daily wear for women",
    description: "Elevate your style with our signature soft pieces designed to make every single day feel truly fresh and special.",
    price: "₹4,999",
    image: "https://framerusercontent.com/images/6nknFZTNUtU9BA1FnqLy7dPrtmE.png?width=1024",
    href: "/shop?category=Women",
  },
  {
    id: "children",
    label: "Children's wear",
    tagline: "Modern easy styles for children",
    description: "Provide your children with the best soft touch gear made for play & long lasting wear throughout every single busy day.",
    price: "₹2,299",
    image: "https://framerusercontent.com/images/XY7DXjHvJ7qxI2SulzDqvBiRbvw.png?width=944",
    href: "/shop?category=Children",
  }
];

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.12,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: [0.215, 0.61, 0.355, 1] as any,
    },
  },
};

export default function CollectionsSection() {
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
              Our Collections
            </span>
            <h2
              className="font-bold text-[#1A1A1A] leading-[1.1] tracking-tight"
              style={{ fontSize: 'clamp(28px, 4vw, 42px)' }}
            >
              Modern collections
              <br />
              defined by simplicity
            </h2>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Link
              href="/shop"
              className="bg-black hover:bg-black/80 text-white text-xs font-bold tracking-[0.2em] uppercase px-8 py-3.5 rounded-full transition-colors duration-200 inline-block shadow-md"
            >
              Shop all items
            </Link>
          </motion.div>
        </div>

        {/* Collection Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8"
        >
          {collections.map((col) => (
            <motion.div key={col.id} variants={cardVariants} className="h-full">
              <Link href={col.href} className="group flex flex-col h-full bg-[#F8F8F8] border border-[#E5E5E5] hover:border-black rounded-[24px] overflow-hidden transition-all duration-300">
                {/* Image Container with Custom Rounding */}
                <div className="relative aspect-[1/1] overflow-hidden bg-white m-3 rounded-[16px] border border-[#E5E5E5]/40">
                  <Image
                    src={col.image}
                    alt={col.label}
                    fill
                    sizes="(max-width: 768px) 100vw, 30vw"
                    style={{ objectFit: 'cover' }}
                    className="group-hover:scale-[1.04] transition-transform duration-700"
                    draggable={false}
                  />

                  {/* Price Tag Overlay */}
                  <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm border border-[#E5E5E5] px-3 py-1.5 rounded-full">
                    <span className="text-[10px] text-[#666666] font-medium tracking-wide">
                      Starts from: <strong className="text-black font-semibold">{col.price}</strong>
                    </span>
                  </div>
                </div>

                {/* Card Content */}
                <div className="flex-1 p-6 pt-2 flex flex-col justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-[#1A1A1A] mb-1 tracking-tight">
                      {col.label}
                    </h3>
                    <p className="text-xs text-[#999] font-medium uppercase tracking-wider mb-4">
                      {col.tagline}
                    </p>
                    <p className="text-xs text-[#666666] font-light leading-relaxed mb-6">
                      {col.description}
                    </p>
                  </div>

                  {/* Arrow CTA */}
                  <div className="flex items-center justify-between border-t border-[#E5E5E5] pt-4">
                    <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#1A1A1A] group-hover:opacity-60 transition-opacity duration-200">
                      Explore Shop
                    </span>
                    <div className="w-8 h-8 rounded-full border border-[#E5E5E5] group-hover:border-black group-hover:bg-black text-[#1A1A1A] group-hover:text-white flex items-center justify-center transition-all duration-300">
                      <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform duration-300" />
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
