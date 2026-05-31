'use client';

import { useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Save, CheckCircle2, X } from 'lucide-react';
import { mockProducts } from '@/data/mockProducts';
import { cn } from '@/lib/utils';

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const CATEGORIES = ['Men', 'Women', 'Children'] as const;

function SuccessToast({ onClose }: { onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 48, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 48, scale: 0.95 }}
      className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-black text-white px-5 py-4 rounded-sm shadow-2xl"
    >
      <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
      <div>
        <p className="text-sm font-semibold">Product updated successfully!</p>
        <p className="text-xs text-gray-400">Changes saved.</p>
      </div>
      <button onClick={onClose} className="ml-4 p-1 hover:bg-white/10 rounded transition">
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
}

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const product = mockProducts.find((p) => p.id === Number(id));

  const [form, setForm] = useState<{
    name: string;
    description: string;
    category: 'Men' | 'Women' | 'Children';
    price: string;
    comparePrice: string;
    stock: string;
    sizes: string[];
    isFeatured: boolean;
  }>({
    name: product?.name ?? '',
    description: product?.description ?? '',
    category: product?.category ?? ('Men' as 'Men' | 'Women' | 'Children'),
    price: product?.price?.toString() ?? '',
    comparePrice: product?.comparePrice?.toString() ?? '',
    stock: product?.stock?.toString() ?? '',
    sizes: product?.sizes ?? [],
    isFeatured: product?.isFeatured ?? false,
  });

  const [saving, setSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);

  if (!product) {
    return (
      <div className="p-8 text-center">
        <p className="text-[#666666]">Product not found.</p>
        <button
          onClick={() => router.push('/seller/products')}
          className="mt-4 text-sm font-medium text-black underline"
        >
          Back to Products
        </button>
      </div>
    );
  }

  const toggleSize = (size: string) => {
    setForm((prev) => ({
      ...prev,
      sizes: prev.sizes.includes(size)
        ? prev.sizes.filter((s) => s !== size)
        : [...prev.sizes, size],
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 900));
    setSaving(false);
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
      router.push('/seller/products');
    }, 2000);
  };

  return (
    <div className="p-6 lg:p-8 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <button
          onClick={() => router.push('/seller/products')}
          className="p-2 hover:bg-[#F9F9F9] rounded-sm transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-[#666666]" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A1A] tracking-tight">Edit Product</h1>
          <p className="text-sm text-[#666666] mt-0.5">ID: {product.id}</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Basic Info */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-[#E5E5E5] rounded-sm p-6"
        >
          <h2 className="text-sm font-semibold text-[#1A1A1A] mb-5">Basic Information</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#666666] mb-1.5">Product Name *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full border border-[#E5E5E5] rounded-sm px-3 py-2.5 text-sm focus:outline-none focus:border-black transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#666666] mb-1.5">Description *</label>
              <textarea
                rows={4}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full border border-[#E5E5E5] rounded-sm px-3 py-2.5 text-sm focus:outline-none focus:border-black transition-colors resize-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#666666] mb-1.5">Category *</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value as 'Men' | 'Women' | 'Children' })}
                className="w-full border border-[#E5E5E5] rounded-sm px-3 py-2.5 text-sm focus:outline-none focus:border-black bg-white"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
        </motion.section>

        {/* Pricing & Stock */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white border border-[#E5E5E5] rounded-sm p-6"
        >
          <h2 className="text-sm font-semibold text-[#1A1A1A] mb-5">Pricing & Inventory</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#666666] mb-1.5">Price (₹) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                className="w-full border border-[#E5E5E5] rounded-sm px-3 py-2.5 text-sm focus:outline-none focus:border-black transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#666666] mb-1.5">Compare Price (₹)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.comparePrice}
                onChange={(e) => setForm({ ...form, comparePrice: e.target.value })}
                className="w-full border border-[#E5E5E5] rounded-sm px-3 py-2.5 text-sm focus:outline-none focus:border-black transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#666666] mb-1.5">Stock *</label>
              <input
                type="number"
                min="0"
                value={form.stock}
                onChange={(e) => setForm({ ...form, stock: e.target.value })}
                className="w-full border border-[#E5E5E5] rounded-sm px-3 py-2.5 text-sm focus:outline-none focus:border-black transition-colors"
              />
            </div>
          </div>
        </motion.section>

        {/* Sizes */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white border border-[#E5E5E5] rounded-sm p-6"
        >
          <h2 className="text-sm font-semibold text-[#1A1A1A] mb-5">Available Sizes</h2>
          <div className="flex flex-wrap gap-2">
            {SIZES.map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => toggleSize(size)}
                className={cn(
                  'px-4 py-2 text-sm font-medium border rounded-sm transition-colors',
                  form.sizes.includes(size)
                    ? 'bg-black text-white border-black'
                    : 'bg-white text-[#666666] border-[#E5E5E5] hover:border-black hover:text-black'
                )}
              >
                {size}
              </button>
            ))}
          </div>
        </motion.section>

        {/* Options */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white border border-[#E5E5E5] rounded-sm p-6"
        >
          <h2 className="text-sm font-semibold text-[#1A1A1A] mb-5">Options</h2>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isFeatured}
              onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })}
              className="w-4 h-4 accent-black"
            />
            <span className="text-sm text-[#1A1A1A]">Mark as Featured Product</span>
          </label>
        </motion.section>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.push('/seller/products')}
            className="px-5 py-2.5 border border-[#E5E5E5] text-sm font-medium text-[#666666] rounded-sm hover:bg-[#F9F9F9] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-black text-white text-sm font-medium rounded-sm hover:bg-[#1A1A1A] transition-colors disabled:opacity-60"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving…
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>

      {/* Toast */}
      <AnimatePresence>
        {showToast && <SuccessToast onClose={() => setShowToast(false)} />}
      </AnimatePresence>
    </div>
  );
}
