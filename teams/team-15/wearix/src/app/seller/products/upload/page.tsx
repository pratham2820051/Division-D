'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import {
  Upload,
  X,
  Plus,
  ImageIcon,
  CheckSquare,
  ArrowLeft,
  CheckCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Zod schema ────────────────────────────────────────────────────────────────
const productSchema = z.object({
  name: z.string().min(1, 'Product name is required').min(3, 'Must be at least 3 characters'),
  description: z.string().min(1, 'Description is required').min(20, 'Must be at least 20 characters'),
  category: z.enum(['Men', 'Women', 'Children'], { message: 'Select a category' }),
  price: z.coerce.number().positive('Price must be greater than 0'),
  comparePrice: z.coerce.number().nonnegative('Compare price must be 0 or greater').optional(),
  stock: z.coerce.number().int().nonnegative('Stock must be 0 or more'),
  sizes: z.array(z.string()).min(1, 'Select at least one size'),
  colors: z.array(z.object({ hex: z.string(), name: z.string() })),
  tags: z.string(),
  isFeatured: z.boolean(),
});

type ProductFormData = z.infer<typeof productSchema>;

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const CATEGORIES = ['Men', 'Women', 'Children'] as const;

// ── Toast component ───────────────────────────────────────────────────────────
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
        <p className="text-sm font-semibold">Product added successfully!</p>
        <p className="text-xs text-gray-400">Redirecting to products…</p>
      </div>
      <button onClick={onClose} className="ml-4 p-1 hover:bg-white/10 rounded transition">
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
}

export default function ProductUploadPage() {
  const router = useRouter();
  const [images, setImages] = useState<string[]>([]);
  const [colorHex, setColorHex] = useState('#000000');
  const [colorName, setColorName] = useState('');
  const [colors, setColors] = useState<{ hex: string; name: string }[]>([]);
  const [showToast, setShowToast] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormData>({
    defaultValues: {
      name: '',
      description: '',
      price: undefined,
      comparePrice: undefined,
      stock: undefined,
      sizes: [],
      colors: [],
      tags: '',
      isFeatured: false,
    },
  });

  // ── Dropzone ──────────────────────────────────────────────────────────────
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const remaining = 5 - images.length;
    const toAdd = acceptedFiles.slice(0, remaining);
    toAdd.forEach((file) => {
      const url = URL.createObjectURL(file);
      setImages((prev) => [...prev, url]);
    });
  }, [images]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    maxFiles: 5,
    disabled: images.length >= 5,
  });

  const removeImage = (idx: number) => {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  };

  // ── Color management ──────────────────────────────────────────────────────
  const addColor = () => {
    if (!colorName.trim()) return;
    const updated = [...colors, { hex: colorHex, name: colorName.trim() }];
    setColors(updated);
    setValue('colors', updated);
    setColorName('');
    setColorHex('#000000');
  };

  const removeColor = (idx: number) => {
    const updated = colors.filter((_, i) => i !== idx);
    setColors(updated);
    setValue('colors', updated);
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const onSubmit = async (_data: ProductFormData) => {
    // Simulate API call
    await new Promise((r) => setTimeout(r, 1000));
    setShowToast(true);
    setTimeout(() => {
      router.push('/seller/products');
    }, 2500);
  };

  const selectedSizes = watch('sizes') ?? [];

  const toggleSize = (size: string) => {
    const current = selectedSizes;
    if (current.includes(size)) {
      setValue('sizes', current.filter((s) => s !== size), { shouldValidate: true });
    } else {
      setValue('sizes', [...current, size], { shouldValidate: true });
    }
  };

  return (
    <div className="px-4 lg:px-8 py-8 max-w-6xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-[#666666] hover:text-black transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Products
        </button>
        <h1 className="text-2xl lg:text-3xl font-bold text-[#1A1A1A] tracking-tight">Add New Product</h1>
        <p className="text-sm text-[#666666] mt-1">Fill in the details below to list your product.</p>
      </motion.div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ── LEFT COLUMN ─────────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-5"
          >
            {/* Product Name */}
            <div className="bg-white border border-[#E5E5E5] rounded-sm p-6">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-[#666666] mb-4">Basic Info</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">
                    Product Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register('name')}
                    placeholder="e.g., Classic Cotton Tee"
                    className={cn(
                      'w-full px-4 py-2.5 text-sm border rounded-sm bg-[#FAFAFA] focus:outline-none focus:border-black focus:bg-white transition-all',
                      errors.name ? 'border-red-400' : 'border-[#E5E5E5]'
                    )}
                  />
                  {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    {...register('description')}
                    rows={5}
                    placeholder="Describe your product — materials, fit, features..."
                    className={cn(
                      'w-full px-4 py-2.5 text-sm border rounded-sm bg-[#FAFAFA] focus:outline-none focus:border-black focus:bg-white transition-all resize-none',
                      errors.description ? 'border-red-400' : 'border-[#E5E5E5]'
                    )}
                  />
                  {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    {...register('category')}
                    className={cn(
                      'w-full px-4 py-2.5 text-sm border rounded-sm bg-[#FAFAFA] focus:outline-none focus:border-black focus:bg-white transition-all appearance-none',
                      errors.category ? 'border-red-400' : 'border-[#E5E5E5]'
                    )}
                  >
                    <option value="">Select category</option>
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category.message as string}</p>}
                </div>
              </div>
            </div>

            {/* Pricing & Stock */}
            <div className="bg-white border border-[#E5E5E5] rounded-sm p-6">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-[#666666] mb-4">Pricing & Stock</h2>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">
                    Price (INR) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
                    <input
                      {...register('price')}
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      className={cn(
                        'w-full pl-7 pr-4 py-2.5 text-sm border rounded-sm bg-[#FAFAFA] focus:outline-none focus:border-black focus:bg-white transition-all',
                        errors.price ? 'border-red-400' : 'border-[#E5E5E5]'
                      )}
                    />
                  </div>
                  {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">
                    Compare-at Price (INR)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
                    <input
                      {...register('comparePrice')}
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      className="w-full pl-7 pr-4 py-2.5 text-sm border border-[#E5E5E5] rounded-sm bg-[#FAFAFA] focus:outline-none focus:border-black focus:bg-white transition-all"
                    />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">
                  Stock Quantity <span className="text-red-500">*</span>
                </label>
                <input
                  {...register('stock')}
                  type="number"
                  min="0"
                  placeholder="0"
                  className={cn(
                    'w-full px-4 py-2.5 text-sm border rounded-sm bg-[#FAFAFA] focus:outline-none focus:border-black focus:bg-white transition-all',
                    errors.stock ? 'border-red-400' : 'border-[#E5E5E5]'
                  )}
                />
                {errors.stock && <p className="text-red-500 text-xs mt-1">{errors.stock.message}</p>}
              </div>
            </div>
          </motion.div>

          {/* ── RIGHT COLUMN ────────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
            className="space-y-5"
          >
            {/* Image Upload */}
            <div className="bg-white border border-[#E5E5E5] rounded-sm p-6">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-[#666666] mb-4">
                Product Images <span className="font-normal text-gray-400">({images.length}/5)</span>
              </h2>

              {/* Dropzone */}
              <div
                {...getRootProps()}
                className={cn(
                  'border-2 border-dashed rounded-sm p-6 text-center cursor-pointer transition-all',
                  isDragActive
                    ? 'border-black bg-gray-50'
                    : images.length >= 5
                    ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-60'
                    : 'border-[#E5E5E5] hover:border-black hover:bg-[#FAFAFA]'
                )}
              >
                <input {...getInputProps()} />
                <Upload className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                {isDragActive ? (
                  <p className="text-sm text-black font-medium">Drop images here…</p>
                ) : images.length >= 5 ? (
                  <p className="text-sm text-gray-400">Maximum 5 images reached</p>
                ) : (
                  <>
                    <p className="text-sm text-[#1A1A1A] font-medium">Drop images here or click to browse</p>
                    <p className="text-xs text-gray-400 mt-1">PNG, JPG, WEBP · Up to 5 images</p>
                  </>
                )}
              </div>

              {/* Previews */}
              {images.length > 0 && (
                <div className="mt-4 grid grid-cols-5 gap-2">
                  <AnimatePresence>
                    {images.map((src, idx) => (
                      <motion.div
                        key={src}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="relative aspect-square group"
                      >
                        <div className="w-full h-full rounded-sm overflow-hidden border border-[#E5E5E5]">
                          <Image src={src} alt={`Preview ${idx + 1}`} fill className="object-cover" sizes="80px" />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeImage(idx)}
                          className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-black text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                        {idx === 0 && (
                          <span className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-[10px] text-center py-0.5 rounded-b-sm">
                            Main
                          </span>
                        )}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  {images.length < 5 && (
                    <div
                      {...getRootProps()}
                      className="aspect-square border-2 border-dashed border-[#E5E5E5] rounded-sm flex items-center justify-center cursor-pointer hover:border-black transition-colors"
                    >
                      <input {...getInputProps()} />
                      <ImageIcon className="w-5 h-5 text-gray-300" />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Sizes */}
            <div className="bg-white border border-[#E5E5E5] rounded-sm p-6">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-[#666666] mb-4">
                Available Sizes <span className="text-red-500">*</span>
              </h2>
              <Controller
                name="sizes"
                control={control}
                render={() => (
                  <div className="flex flex-wrap gap-2">
                    {SIZES.map((size) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => toggleSize(size)}
                        className={cn(
                          'px-4 py-2 text-sm font-medium border rounded-sm transition-all',
                          selectedSizes.includes(size)
                            ? 'bg-black text-white border-black'
                            : 'bg-white text-[#666666] border-[#E5E5E5] hover:border-black hover:text-black'
                        )}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                )}
              />
              {errors.sizes && <p className="text-red-500 text-xs mt-2">{errors.sizes.message}</p>}
            </div>

            {/* Colors */}
            <div className="bg-white border border-[#E5E5E5] rounded-sm p-6">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-[#666666] mb-4">Colors</h2>
              <div className="flex gap-2 mb-3">
                <div className="relative">
                  <input
                    type="color"
                    value={colorHex}
                    onChange={(e) => setColorHex(e.target.value)}
                    className="w-10 h-10 border border-[#E5E5E5] rounded-sm cursor-pointer"
                    title="Pick color"
                  />
                </div>
                <input
                  type="text"
                  value={colorHex}
                  onChange={(e) => setColorHex(e.target.value)}
                  placeholder="#000000"
                  className="w-24 px-3 py-2 text-sm border border-[#E5E5E5] rounded-sm font-mono focus:outline-none focus:border-black"
                />
                <input
                  type="text"
                  value={colorName}
                  onChange={(e) => setColorName(e.target.value)}
                  placeholder="Color name"
                  className="flex-1 px-3 py-2 text-sm border border-[#E5E5E5] rounded-sm focus:outline-none focus:border-black"
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addColor(); }}}
                />
                <button
                  type="button"
                  onClick={addColor}
                  disabled={!colorName.trim()}
                  className="px-3 py-2 bg-black text-white rounded-sm hover:bg-neutral-800 disabled:opacity-40 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              {colors.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {colors.map((c, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-1.5 bg-[#F9F9F9] border border-[#E5E5E5] rounded-full pl-2 pr-1 py-1"
                    >
                      <div className="w-4 h-4 rounded-full border border-gray-200 flex-shrink-0" style={{ backgroundColor: c.hex }} />
                      <span className="text-xs font-medium text-[#1A1A1A]">{c.name}</span>
                      <button
                        type="button"
                        onClick={() => removeColor(idx)}
                        className="p-0.5 hover:bg-gray-200 rounded-full transition-colors"
                      >
                        <X className="w-3 h-3 text-gray-500" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Tags & Featured */}
            <div className="bg-white border border-[#E5E5E5] rounded-sm p-6">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-[#666666] mb-4">Additional Info</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">Tags</label>
                  <input
                    {...register('tags')}
                    placeholder="casual, summer, cotton (comma-separated)"
                    className="w-full px-4 py-2.5 text-sm border border-[#E5E5E5] rounded-sm bg-[#FAFAFA] focus:outline-none focus:border-black focus:bg-white transition-all"
                  />
                  <p className="text-xs text-gray-400 mt-1">Separate tags with commas</p>
                </div>

                <label className="flex items-center gap-3 cursor-pointer group">
                  <Controller
                    name="isFeatured"
                    control={control}
                    render={({ field }) => (
                      <div
                        onClick={() => field.onChange(!field.value)}
                        className={cn(
                          'w-5 h-5 border-2 rounded-sm flex items-center justify-center transition-all',
                          field.value ? 'bg-black border-black' : 'bg-white border-gray-300 group-hover:border-black'
                        )}
                      >
                        {field.value && <CheckSquare className="w-3.5 h-3.5 text-white" />}
                      </div>
                    )}
                  />
                  <div>
                    <p className="text-sm font-medium text-[#1A1A1A]">Mark as Featured</p>
                    <p className="text-xs text-gray-400">Featured products appear on the homepage</p>
                  </div>
                </label>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Form Actions */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="flex flex-col sm:flex-row gap-3 mt-8 pt-6 border-t border-[#E5E5E5]"
        >
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 sm:flex-none sm:min-w-[180px] flex items-center justify-center gap-2 bg-black text-white text-sm font-semibold px-8 py-3 rounded-sm hover:bg-neutral-800 disabled:opacity-60 transition-colors"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving…
              </>
            ) : (
              'Save Product'
            )}
          </button>
          <button
            type="button"
            onClick={() => router.push('/seller/products')}
            className="flex-1 sm:flex-none sm:min-w-[120px] border border-[#E5E5E5] text-[#1A1A1A] text-sm font-semibold px-8 py-3 rounded-sm hover:bg-[#F9F9F9] transition-colors"
          >
            Cancel
          </button>
        </motion.div>
      </form>

      {/* Success toast */}
      <AnimatePresence>
        {showToast && <SuccessToast onClose={() => setShowToast(false)} />}
      </AnimatePresence>
    </div>
  );
}
