'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Search } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
        className="text-center max-w-md"
      >
        {/* 404 number */}
        <p className="text-[120px] font-bold leading-none text-[#F0F0F0] select-none">
          404
        </p>

        <div className="-mt-4">
          <h1 className="text-2xl font-semibold text-[#1A1A1A] mb-3">
            Page not found
          </h1>
          <p className="text-[#666666] text-sm leading-relaxed mb-8">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
            Let&apos;s get you back on track.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-2 px-6 py-3 bg-black text-white text-sm font-medium rounded-sm hover:bg-[#1A1A1A] transition-colors duration-200 w-full sm:w-auto justify-center"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>
            <Link
              href="/shop"
              className="flex items-center gap-2 px-6 py-3 border border-[#E5E5E5] text-[#1A1A1A] text-sm font-medium rounded-sm hover:bg-[#F9F9F9] transition-colors duration-200 w-full sm:w-auto justify-center"
            >
              <Search className="w-4 h-4" />
              Browse Shop
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
