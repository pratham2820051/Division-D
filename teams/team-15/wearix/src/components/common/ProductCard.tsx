'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Star, Check } from 'lucide-react';

import { type Product } from '@/data/mockProducts';
import { useCart } from '@/context/CartContext';

// ── Props ─────────────────────────────────────────────────────────────────────
interface ProductCardProps {
  product: Product;
  showAddToCart?: boolean;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatPrice(n: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
}

function discountPercent(price: number, compare: number) {
  return Math.round(((compare - price) / compare) * 100);
}

// ── ProductCard ───────────────────────────────────────────────────────────────
export default function ProductCard({ product, showAddToCart = true }: ProductCardProps) {
  const { addItem, isInCart } = useCart();

  // Default to first size/color for quick-add
  const defaultSize  = product.sizes[0]  ?? '';
  const defaultColor = product.colors[0] ?? { name: '', hex: '' };

  const [addedFeedback, setAddedFeedback] = useState(false);
  const [hovered, setHovered]             = useState(false);

  const inCart = isInCart(product.id, defaultSize, defaultColor.name);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    addItem({
      productId: product.id,
      name:      product.name,
      price:     product.price,
      image:     product.images[0] ?? '',
      size:      defaultSize,
      color:     defaultColor.name,
      colorHex:  defaultColor.hex,
      quantity:  1,
    });

    setAddedFeedback(true);
    setTimeout(() => setAddedFeedback(false), 2000);
  };

  const discount = discountPercent(product.price, product.comparePrice);
  const hasDiscount = product.comparePrice > product.price;

  return (
    <Link href={`/product/${product.id}`} className="group block" tabIndex={0}>
      <motion.article
        onHoverStart={() => setHovered(true)}
        onHoverEnd={() => setHovered(false)}
        whileHover={{ y: -4, transition: { duration: 0.25 } }}
        className="relative bg-white rounded-sm overflow-hidden cursor-pointer"
        style={{ willChange: 'transform' }}
      >
        {/* ── Image container (4:5 ratio = 280×350) ──────────────────────── */}
        <div
          className="relative overflow-hidden bg-[#F9F9F9]"
          style={{ aspectRatio: '4 / 5' }}
        >
          {/* Product image */}
          <motion.div
            animate={{ scale: hovered ? 1.05 : 1 }}
            transition={{ duration: 0.4 }}
            className="w-full h-full"
          >
            <Image
              src={product.images[0] ?? '/placeholder.jpg'}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 280px"
              className="object-cover"
              draggable={false}
            />
          </motion.div>

          {/* ── Category badge ─────────────────────────────────────────── */}
          <div className="absolute top-3 left-3">
            <span className="inline-block bg-white/90 backdrop-blur-sm text-[10px] font-semibold tracking-[0.1em] uppercase text-[#1A1A1A] px-2 py-1 rounded-sm">
              {product.category}
            </span>
          </div>

          {/* ── Discount badge ─────────────────────────────────────────── */}
          {hasDiscount && (
            <div className="absolute top-3 right-3">
              <span className="inline-block bg-black text-white text-[10px] font-semibold px-2 py-1 rounded-sm">
                -{discount}%
              </span>
            </div>
          )}

          {/* ── Add to Cart overlay (slides up on hover) ─────────────── */}
          {showAddToCart && (
            <AnimatePresence>
              {hovered && (
                <motion.div
                  initial={{ y: '100%', opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: '100%', opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="absolute bottom-0 left-0 right-0 p-3"
                >
                  <button
                    onClick={handleAddToCart}
                    aria-label={`Add ${product.name} to cart`}
                    className={`w-full flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-sm transition-colors duration-200 ${
                      addedFeedback || inCart
                        ? 'bg-[#1A1A1A] text-white'
                        : 'bg-black text-white hover:bg-[#1A1A1A]'
                    }`}
                  >
                    <AnimatePresence mode="wait" initial={false}>
                      {addedFeedback ? (
                        <motion.span
                          key="added"
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0.8, opacity: 0 }}
                          transition={{ duration: 0.15 }}
                          className="flex items-center gap-2"
                        >
                          <Check className="w-4 h-4" strokeWidth={2.5} />
                          Added to Cart
                        </motion.span>
                      ) : (
                        <motion.span
                          key="add"
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0.8, opacity: 0 }}
                          transition={{ duration: 0.15 }}
                          className="flex items-center gap-2"
                        >
                          <ShoppingBag className="w-4 h-4" strokeWidth={1.75} />
                          {inCart ? 'In Cart' : 'Add to Cart'}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>

        {/* ── Card body ─────────────────────────────────────────────────── */}
        <motion.div
          className="pt-3 pb-1"
          animate={{ boxShadow: hovered ? '0 12px 40px rgba(0,0,0,0.10)' : '0 0px 0px rgba(0,0,0,0)' }}
        >
          {/* Rating */}
          <div className="flex items-center gap-1 mb-1.5">
            <Star className="w-3 h-3 text-black fill-black" />
            <span className="text-xs text-[#666666] font-medium">
              {product.rating.toFixed(1)}
            </span>
            <span className="text-xs text-[#666666]">
              ({product.reviewCount})
            </span>
          </div>

          {/* Product name */}
          <h3 className="text-sm font-medium text-[#1A1A1A] leading-snug line-clamp-2 group-hover:text-black transition-colors duration-150">
            {product.name}
          </h3>

          {/* Price row */}
          <div className="flex items-center gap-2 mt-2">
            <span className="text-sm font-semibold text-[#1A1A1A]">
              {formatPrice(product.price)}
            </span>
            {hasDiscount && (
              <span className="text-xs text-[#666666] line-through">
                {formatPrice(product.comparePrice)}
              </span>
            )}
          </div>

          {/* Color swatches */}
          {product.colors.length > 0 && (
            <div className="flex items-center gap-1.5 mt-2">
              {product.colors.slice(0, 4).map((c) => (
                <div
                  key={c.hex}
                  title={c.name}
                  className="w-3.5 h-3.5 rounded-full border border-[#E5E5E5] flex-shrink-0"
                  style={{ backgroundColor: c.hex }}
                />
              ))}
              {product.colors.length > 4 && (
                <span className="text-[10px] text-[#666666]">
                  +{product.colors.length - 4}
                </span>
              )}
            </div>
          )}
        </motion.div>
      </motion.article>
    </Link>
  );
}
