'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Trash2, Plus, Minus, Tag, ArrowRight, X } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { CartItem } from '@/context/CartContext';
import { formatCurrency } from '@/lib/utils';

function CartItemRow({ item }: { item: CartItem }) {
  const { removeItem, updateQuantity } = useCart();

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20, height: 0 }}
      transition={{ duration: 0.3 }}
      className="flex gap-4 py-6 border-b border-[#E5E5E5]"
    >
      {/* Product Image */}
      <Link href={`/product/${item.productId}`} className="flex-shrink-0">
        <div className="relative w-20 h-24 bg-[#F9F9F9] overflow-hidden">
          <Image
            src={item.image}
            alt={item.name}
            fill
            className="object-cover hover:scale-105 transition-transform duration-300"
            sizes="80px"
          />
        </div>
      </Link>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <Link href={`/product/${item.productId}`}>
              <h3 className="text-sm font-semibold text-[#1A1A1A] hover:underline underline-offset-2 leading-tight">
                {item.name}
              </h3>
            </Link>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-[#666666]">Size: {item.size}</span>
              <span className="text-[#E5E5E5]">•</span>
              <div className="flex items-center gap-1">
                <div
                  className="w-3 h-3 rounded-full border border-[#E5E5E5]"
                  style={{ backgroundColor: item.colorHex }}
                />
                <span className="text-xs text-[#666666]">{item.color}</span>
              </div>
            </div>
          </div>
          <button
            onClick={() => removeItem(item.productId, item.size, item.color)}
            className="text-[#666666] hover:text-red-500 transition-colors p-1 -mt-1 flex-shrink-0"
            aria-label="Remove item"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex items-center justify-between mt-3">
          {/* Quantity */}
          <div className="flex items-center border border-[#E5E5E5]">
            <button
              onClick={() => updateQuantity(item.productId, item.size, item.color, item.quantity - 1)}
              className="w-8 h-8 flex items-center justify-center text-[#1A1A1A] hover:bg-[#F9F9F9] transition-colors border-r border-[#E5E5E5]"
            >
              <Minus size={12} />
            </button>
            <span className="w-8 h-8 flex items-center justify-center text-sm font-medium text-[#1A1A1A]">
              {item.quantity}
            </span>
            <button
              onClick={() => updateQuantity(item.productId, item.size, item.color, item.quantity + 1)}
              className="w-8 h-8 flex items-center justify-center text-[#1A1A1A] hover:bg-[#F9F9F9] transition-colors border-l border-[#E5E5E5]"
            >
              <Plus size={12} />
            </button>
          </div>

          {/* Price */}
          <div className="text-right">
            <p className="text-sm font-bold text-[#1A1A1A]">{formatCurrency(item.price * item.quantity)}</p>
            {item.quantity > 1 && (
              <p className="text-xs text-[#666666]">{formatCurrency(item.price)} each</p>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function CartPage() {
  const { items, subtotal, shipping, tax, total, clearCart } = useCart();
  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);
  const [promoError, setPromoError] = useState('');

  const handleApplyPromo = () => {
    if (promoCode.trim().toUpperCase() === 'WEARIX10') {
      setPromoApplied(true);
      setPromoError('');
    } else {
      setPromoError('Invalid promo code. Try WEARIX10!');
      setPromoApplied(false);
    }
  };

  const promoDiscount = promoApplied ? subtotal * 0.1 : 0;
  const finalTotal = total - promoDiscount;

  // Empty state
  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="text-center max-w-sm"
        >
          <div className="w-24 h-24 rounded-full bg-[#F9F9F9] flex items-center justify-center mx-auto mb-6">
            <ShoppingBag size={40} className="text-[#E5E5E5]" />
          </div>
          <h1 className="text-2xl font-semibold text-[#1A1A1A] mb-3">Your cart is empty</h1>
          <p className="text-[#666666] text-sm mb-8">
            Looks like you haven&apos;t added anything yet. Browse our collection and find something you love.
          </p>
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 bg-black text-white px-8 py-3 text-sm font-medium hover:bg-zinc-800 transition-colors"
          >
            Start Shopping
            <ArrowRight size={16} />
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-baseline justify-between mb-8"
        >
          <h1 className="text-3xl font-semibold text-[#1A1A1A] tracking-tight">Your Shopping Cart</h1>
          <button
            onClick={clearCart}
            className="text-sm text-[#666666] hover:text-red-500 transition-colors flex items-center gap-1.5"
          >
            <Trash2 size={14} />
            Clear cart
          </button>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-10">
          {/* LEFT: Cart Items */}
          <div>
            {/* Column headers */}
            <div className="hidden sm:grid grid-cols-[1fr_auto] pb-3 border-b border-[#E5E5E5] mb-2">
              <span className="text-xs tracking-widest uppercase text-[#666666] font-medium">Product</span>
              <span className="text-xs tracking-widest uppercase text-[#666666] font-medium">Total</span>
            </div>

            <AnimatePresence>
              {items.map((item) => (
                <CartItemRow
                  key={`${item.productId}-${item.size}-${item.color}`}
                  item={item}
                />
              ))}
            </AnimatePresence>

            <div className="mt-6">
              <Link
                href="/shop"
                className="inline-flex items-center gap-2 text-sm text-[#666666] hover:text-black transition-colors border border-[#E5E5E5] px-4 py-2.5 hover:border-black"
              >
                ← Continue Shopping
              </Link>
            </div>
          </div>

          {/* RIGHT: Order Summary */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="h-fit"
          >
            <div className="border border-[#E5E5E5] p-6 space-y-5">
              <h2 className="text-base font-semibold text-[#1A1A1A] tracking-tight">Order Summary</h2>

              {/* Line items */}
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-[#666666]">Subtotal ({items.reduce((s, i) => s + i.quantity, 0)} items)</span>
                  <span className="font-medium text-[#1A1A1A]">{formatCurrency(subtotal)}</span>
                </div>
                {promoApplied && (
                  <div className="flex justify-between text-sm">
                    <span className="text-green-700">Promo (WEARIX10)</span>
                    <span className="font-medium text-green-700">-{formatCurrency(promoDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-[#666666]">Shipping</span>
                  <span className={`font-medium ${shipping === 0 ? 'text-green-700' : 'text-[#1A1A1A]'}`}>
                    {shipping === 0 ? 'Free' : formatCurrency(shipping)}
                  </span>
                </div>
                {shipping > 0 && (
                  <p className="text-xs text-[#666666]">
                    Add {formatCurrency(5000 - subtotal)} more for free shipping
                  </p>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-[#666666]">Tax (8%)</span>
                  <span className="font-medium text-[#1A1A1A]">{formatCurrency(tax)}</span>
                </div>
              </div>

              <div className="h-px bg-[#E5E5E5]" />

              <div className="flex justify-between">
                <span className="font-semibold text-[#1A1A1A]">Total</span>
                <span className="font-bold text-lg text-[#1A1A1A]">{formatCurrency(finalTotal)}</span>
              </div>

              {/* Promo Code */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-[#666666] tracking-wide uppercase">Promo Code</label>
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <Tag size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#666666]" />
                    <input
                      type="text"
                      value={promoCode}
                      onChange={(e) => { setPromoCode(e.target.value); setPromoError(''); }}
                      placeholder="Enter code"
                      className="w-full pl-8 pr-3 py-2.5 text-sm border border-[#E5E5E5] focus:outline-none focus:border-black transition-colors"
                    />
                  </div>
                  <button
                    onClick={handleApplyPromo}
                    className="px-4 text-sm font-medium bg-black text-white hover:bg-zinc-800 transition-colors whitespace-nowrap"
                  >
                    Apply
                  </button>
                </div>
                {promoError && <p className="text-xs text-red-600">{promoError}</p>}
                {promoApplied && (
                  <p className="text-xs text-green-700 font-medium">✓ 10% discount applied!</p>
                )}
              </div>

              {/* Checkout Button */}
              <Link href="/checkout">
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  className="w-full bg-black text-white py-3.5 text-sm font-semibold tracking-wider uppercase hover:bg-zinc-800 transition-colors flex items-center justify-center gap-2 mt-2"
                >
                  Proceed to Checkout
                  <ArrowRight size={15} />
                </motion.button>
              </Link>

              {/* Trust badges */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#E5E5E5]">
                {[
                  { icon: '🔒', label: 'Secure Payment' },
                  { icon: '🚚', label: 'Free Returns' },
                  { icon: '✨', label: 'Quality Assured' },
                ].map((badge) => (
                  <div key={badge.label} className="flex flex-col items-center text-center gap-1">
                    <span className="text-lg">{badge.icon}</span>
                    <span className="text-[10px] text-[#666666] leading-tight">{badge.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
