'use client';

import React, { useState, use } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Star,
  ShoppingCart,
  Heart,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  Truck,
  RotateCcw,
  Ruler,
  Check,
} from 'lucide-react';
import { mockProducts, Product } from '@/data/mockProducts';
import { formatCurrency } from '@/lib/utils';
import { useCart } from '@/context/CartContext';

function StarRating({ rating, count }: { rating: number; count: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={16}
            className={
              star <= Math.round(rating)
                ? 'fill-black text-black'
                : 'fill-gray-200 text-gray-200'
            }
          />
        ))}
      </div>
      <span className="text-sm text-[#666666]">
        {rating.toFixed(1)} ({count.toLocaleString()} reviews)
      </span>
    </div>
  );
}

function AccordionSection({
  title,
  children,
  icon,
}: {
  title: string;
  children: React.ReactNode;
  icon: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-t border-[#E5E5E5]">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-4 text-sm font-medium text-[#1A1A1A] hover:text-black transition-colors"
      >
        <div className="flex items-center gap-2">
          {icon}
          {title}
        </div>
        {open ? <ChevronUp size={16} className="text-[#666666]" /> : <ChevronDown size={16} className="text-[#666666]" />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="pb-4 text-sm text-[#666666] leading-relaxed">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function RelatedProductCard({ product }: { product: Product }) {
  return (
    <Link href={`/product/${product.id}`} className="group block">
      <motion.div
        className="relative overflow-hidden bg-[#F9F9F9]"
        style={{ aspectRatio: '3/4' }}
        whileHover={{ scale: 1.02, y: -4 }}
          transition={{ duration: 0.25 }}
      >
        <Image
          src={product.images[0]}
          alt={product.name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 640px) 50vw, 25vw"
        />
      </motion.div>
      <div className="mt-2 space-y-0.5">
        <p className="text-sm font-medium text-[#1A1A1A] group-hover:underline underline-offset-2">{product.name}</p>
        <p className="text-sm text-[#666666]">{formatCurrency(product.price)}</p>
      </div>
    </Link>
  );
}

export default function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const product = mockProducts.find((p) => p.id === parseInt(resolvedParams.id));

  if (!product) {
    notFound();
  }

  const { addItem, isInCart } = useCart();

  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedColor, setSelectedColor] = useState(product.colors[0]);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);
  const [wishlist, setWishlist] = useState(false);
  const [sizeError, setSizeError] = useState(false);

  const relatedProducts = mockProducts
    .filter((p) => p.category === product.category && p.id !== product.id)
    .slice(0, 4);

  const inCart = selectedSize ? isInCart(product.id, selectedSize, selectedColor.name) : false;

  const handleAddToCart = () => {
    if (!selectedSize) {
      setSizeError(true);
      setTimeout(() => setSizeError(false), 2000);
      return;
    }
    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      image: product.images[0],
      size: selectedSize,
      color: selectedColor.name,
      colorHex: selectedColor.hex,
      quantity,
    });
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2500);
  };

  const discount = Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100);

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <motion.nav
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-2 text-sm text-[#666666] mb-8"
        >
          <Link href="/" className="hover:text-black transition-colors">Home</Link>
          <span>/</span>
          <Link href="/shop" className="hover:text-black transition-colors">Shop</Link>
          <span>/</span>
          <Link
            href={`/shop?category=${product.category}`}
            className="hover:text-black transition-colors"
          >
            {product.category}
          </Link>
          <span>/</span>
          <span className="text-[#1A1A1A] font-medium truncate max-w-[200px]">{product.name}</span>
        </motion.nav>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
          {/* LEFT: Image Gallery */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-3"
          >
            {/* Main Image */}
            <div className="relative overflow-hidden bg-[#F9F9F9]" style={{ aspectRatio: '3/4' }}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={selectedImage}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="absolute inset-0"
                >
                  <Image
                    src={product.images[selectedImage]}
                    alt={`${product.name} - view ${selectedImage + 1}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    priority
                  />
                </motion.div>
              </AnimatePresence>
              {discount > 0 && (
                <div className="absolute top-4 left-4 bg-black text-white text-xs px-3 py-1 font-medium tracking-wider">
                  -{discount}%
                </div>
              )}
            </div>

            {/* Thumbnails */}
            {product.images.length > 1 && (
              <div className="flex gap-2">
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`relative w-20 h-24 overflow-hidden border-2 transition-all flex-shrink-0 ${
                      selectedImage === idx ? 'border-black' : 'border-[#E5E5E5] hover:border-gray-400'
                    }`}
                  >
                    <Image
                      src={img}
                      alt={`Thumbnail ${idx + 1}`}
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  </button>
                ))}
              </div>
            )}
          </motion.div>

          {/* RIGHT: Product Info */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex flex-col"
          >
            {/* Category tag */}
            <span className="text-xs tracking-widest uppercase text-[#666666] font-medium mb-3">
              {product.category}
            </span>

            {/* Product name */}
            <h1 className="text-[32px] font-semibold text-[#1A1A1A] leading-tight tracking-tight mb-3">
              {product.name}
            </h1>

            {/* Rating */}
            <StarRating rating={product.rating} count={product.reviewCount} />

            {/* Price */}
            <div className="flex items-baseline gap-3 mt-5">
              <span className="text-2xl font-bold text-[#1A1A1A]">{formatCurrency(product.price)}</span>
              {product.comparePrice > product.price && (
                <>
                  <span className="text-base text-[#666666] line-through">{formatCurrency(product.comparePrice)}</span>
                  <span className="text-sm font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-sm">
                    Save {discount}%
                  </span>
                </>
              )}
            </div>

            <div className="w-full h-px bg-[#E5E5E5] my-6" />

            {/* Color Selector */}
            <div className="mb-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-[#1A1A1A]">Color</span>
                <span className="text-sm text-[#666666]">{selectedColor.name}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {product.colors.map((color) => (
                  <button
                    key={color.hex}
                    onClick={() => setSelectedColor(color)}
                    title={color.name}
                    className={`w-9 h-9 rounded-full border-2 transition-all ${
                      selectedColor.hex === color.hex
                        ? 'border-black ring-2 ring-black ring-offset-2'
                        : 'border-[#E5E5E5] hover:border-gray-400'
                    }`}
                    style={{ backgroundColor: color.hex }}
                  />
                ))}
              </div>
            </div>

            {/* Size Selector */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-[#1A1A1A]">Size</span>
                {sizeError && (
                  <motion.span
                    initial={{ opacity: 0, x: 4 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-sm text-red-600 font-medium"
                  >
                    Please select a size
                  </motion.span>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => { setSelectedSize(size); setSizeError(false); }}
                    className={`min-w-[48px] px-3 py-2.5 text-sm font-medium border transition-all ${
                      selectedSize === size
                        ? 'bg-black text-white border-black'
                        : sizeError
                        ? 'border-red-300 text-[#1A1A1A] hover:border-black'
                        : 'border-[#E5E5E5] text-[#1A1A1A] hover:border-black'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity Selector */}
            <div className="mb-6">
              <span className="text-sm font-medium text-[#1A1A1A] block mb-3">Quantity</span>
              <div className="flex items-center border border-[#E5E5E5] w-fit">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="w-10 h-10 flex items-center justify-center text-[#1A1A1A] hover:bg-[#F9F9F9] transition-colors text-lg font-light border-r border-[#E5E5E5]"
                >
                  −
                </button>
                <span className="w-12 h-10 flex items-center justify-center text-sm font-medium text-[#1A1A1A]">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                  className="w-10 h-10 flex items-center justify-center text-[#1A1A1A] hover:bg-[#F9F9F9] transition-colors text-lg font-light border-l border-[#E5E5E5]"
                >
                  +
                </button>
              </div>
              <p className="text-xs text-[#666666] mt-2">{product.stock} in stock</p>
            </div>

            {/* Add to Cart */}
            <motion.button
              onClick={handleAddToCart}
              whileTap={{ scale: 0.98 }}
              className={`w-full h-12 flex items-center justify-center gap-2 text-sm font-semibold tracking-wider uppercase transition-all ${
                addedToCart
                  ? 'bg-green-700 text-white'
                  : 'bg-black text-white hover:bg-zinc-800'
              }`}
            >
              {addedToCart ? (
                <>
                  <Check size={16} />
                  Added to Cart!
                </>
              ) : (
                <>
                  <ShoppingCart size={16} />
                  {inCart ? 'Add More to Cart' : 'Add to Cart'}
                </>
              )}
            </motion.button>

            {/* Wishlist */}
            <button
              onClick={() => setWishlist(!wishlist)}
              className={`w-full h-11 mt-3 flex items-center justify-center gap-2 text-sm font-medium border transition-all ${
                wishlist
                  ? 'border-black bg-black text-white'
                  : 'border-[#E5E5E5] text-[#1A1A1A] hover:border-black'
              }`}
            >
              <Heart size={15} className={wishlist ? 'fill-white' : ''} />
              {wishlist ? 'Saved to Wishlist' : 'Add to Wishlist'}
            </button>

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mt-4">
              {product.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs text-[#666666] border border-[#E5E5E5] px-2.5 py-1 rounded-full"
                >
                  #{tag}
                </span>
              ))}
            </div>

            {/* Description */}
            <div className="mt-6">
              <p className="text-sm text-[#666666] leading-relaxed">{product.description}</p>
            </div>

            {/* Accordion Sections */}
            <div className="mt-6 space-y-0">
              <AccordionSection
                title="Shipping Info"
                icon={<Truck size={15} className="text-[#666666]" />}
              >
                <ul className="space-y-1.5">
                  <li>• Free standard shipping on orders over ₹5,000</li>
                  <li>• Standard shipping (5–7 days): ₹199</li>
                  <li>• Express shipping (2–3 days): ₹399</li>
                  <li>• Next-day delivery available in select areas</li>
                  <li>• International shipping available to 40+ countries</li>
                </ul>
              </AccordionSection>

              <AccordionSection
                title="Return Policy"
                icon={<RotateCcw size={15} className="text-[#666666]" />}
              >
                <ul className="space-y-1.5">
                  <li>• Free returns within 30 days of purchase</li>
                  <li>• Items must be unworn, unwashed, and in original packaging</li>
                  <li>• Sale items are final sale and cannot be returned</li>
                  <li>• Exchanges processed within 3–5 business days</li>
                  <li>• Refunds issued to original payment method</li>
                </ul>
              </AccordionSection>

              <AccordionSection
                title="Size Guide"
                icon={<Ruler size={15} className="text-[#666666]" />}
              >
                <div className="overflow-x-auto">
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-[#E5E5E5]">
                        <th className="py-2 pr-4 text-left font-semibold text-[#1A1A1A]">Size</th>
                        <th className="py-2 pr-4 text-left font-semibold text-[#1A1A1A]">Chest (in)</th>
                        <th className="py-2 pr-4 text-left font-semibold text-[#1A1A1A]">Waist (in)</th>
                        <th className="py-2 text-left font-semibold text-[#1A1A1A]">Hip (in)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        ['XS', '32–33', '25–26', '35–36'],
                        ['S', '34–35', '27–28', '37–38'],
                        ['M', '36–38', '29–31', '39–41'],
                        ['L', '39–41', '32–34', '42–44'],
                        ['XL', '42–44', '35–37', '45–47'],
                        ['XXL', '45–47', '38–40', '48–50'],
                      ].map(([size, chest, waist, hip]) => (
                        <tr key={size} className="border-b border-[#F0F0F0]">
                          <td className="py-1.5 pr-4 font-medium text-[#1A1A1A]">{size}</td>
                          <td className="py-1.5 pr-4">{chest}</td>
                          <td className="py-1.5 pr-4">{waist}</td>
                          <td className="py-1.5">{hip}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </AccordionSection>
            </div>
          </motion.div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-20 pt-12 border-t border-[#E5E5E5]"
          >
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-semibold text-[#1A1A1A] tracking-tight">You May Also Like</h2>
              <Link
                href={`/shop?category=${product.category}`}
                className="text-sm text-[#666666] hover:text-black transition-colors flex items-center gap-1"
              >
                View all {product.category} →
              </Link>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((p, i) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.08 }}
                >
                  <RelatedProductCard product={p} />
                </motion.div>
              ))}
            </div>
          </motion.section>
        )}

        {/* Back link */}
        <div className="mt-12">
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 text-sm text-[#666666] hover:text-black transition-colors"
          >
            <ArrowLeft size={16} />
            Back to Shop
          </Link>
        </div>
      </div>
    </div>
  );
}
