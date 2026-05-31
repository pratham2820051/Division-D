'use client';

import React, { useState, useMemo, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { SlidersHorizontal, X, ChevronDown, ChevronUp, ShoppingBag } from 'lucide-react';
import { mockProducts } from '@/data/mockProducts';
import { formatCurrency } from '@/lib/utils';
import ProductCard from '@/components/common/ProductCard';

const PRODUCTS_PER_PAGE = 9; // Display in perfect 3x3 grids on desktop

const ALL_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const ALL_CATEGORIES: Array<'Men' | 'Women' | 'Children'> = ['Men', 'Women', 'Children'];

// Collect all unique colors from products
const ALL_COLORS = Array.from(
  new Map(
    mockProducts.flatMap((p) => p.colors).map((c) => [c.hex, c])
  ).values()
).slice(0, 10);

type SortOption = 'featured' | 'price-asc' | 'price-desc' | 'newest';

function ShopContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialCategory = searchParams.get('category') as 'Men' | 'Women' | 'Children' | null;
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(
    initialCategory ? new Set([initialCategory]) : new Set()
  );
  
  // Custom filter states
  const [priceMin, setPriceMin] = useState<number>(0);
  const [priceMax, setPriceMax] = useState<number>(15000);
  const [selectedSizes, setSelectedSizes] = useState<Set<string>>(new Set());
  const [selectedColors, setSelectedColors] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<SortOption>('featured');
  const [currentPage, setCurrentPage] = useState(1);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Sync category param
  useEffect(() => {
    const cat = searchParams.get('category');
    if (cat) {
      setSelectedCategories(new Set([cat]));
    }
  }, [searchParams]);

  // Sync general filters from URL query if present (e.g. filter=new-arrivals or filter=best-sellers)
  useEffect(() => {
    const filterType = searchParams.get('filter');
    if (filterType === 'new-arrivals') {
      setSortBy('newest');
    } else if (filterType === 'best-sellers') {
      setSortBy('featured');
    }
  }, [searchParams]);

  const toggleCategory = (cat: string) => {
    setSelectedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
    setCurrentPage(1);
  };

  const toggleSize = (size: string) => {
    setSelectedSizes((prev) => {
      const next = new Set(prev);
      if (next.has(size)) next.delete(size);
      else next.add(size);
      return next;
    });
    setCurrentPage(1);
  };

  const toggleColor = (hex: string) => {
    setSelectedColors((prev) => {
      const next = new Set(prev);
      if (next.has(hex)) next.delete(hex);
      else next.add(hex);
      return next;
    });
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSelectedCategories(new Set());
    setPriceMin(0);
    setPriceMax(15000);
    setSelectedSizes(new Set());
    setSelectedColors(new Set());
    setSortBy('featured');
    setCurrentPage(1);
    router.push('/shop');
  };

  const filteredProducts = useMemo(() => {
    let products = [...mockProducts];

    // Filter by tag if present in query parameters
    const filterType = searchParams.get('filter');
    if (filterType) {
      products = products.filter((p) => p.tags.includes(filterType));
    }

    if (selectedCategories.size > 0) {
      products = products.filter((p) => selectedCategories.has(p.category));
    }

    products = products.filter((p) => p.price >= priceMin && p.price <= priceMax);

    if (selectedSizes.size > 0) {
      products = products.filter((p) => p.sizes.some((s) => selectedSizes.has(s)));
    }

    if (selectedColors.size > 0) {
      products = products.filter((p) => p.colors.some((c) => selectedColors.has(c.hex)));
    }

    switch (sortBy) {
      case 'featured':
        products.sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0));
        break;
      case 'price-asc':
        products.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        products.sort((a, b) => b.price - a.price);
        break;
      case 'newest':
        products.sort((a, b) => b.id - a.id);
        break;
    }

    return products;
  }, [selectedCategories, priceMin, priceMax, selectedSizes, selectedColors, sortBy, searchParams]);

  const totalPages = Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * PRODUCTS_PER_PAGE,
    currentPage * PRODUCTS_PER_PAGE
  );

  const hasActiveFilters =
    selectedCategories.size > 0 ||
    priceMin > 0 ||
    priceMax < 15000 ||
    selectedSizes.size > 0 ||
    selectedColors.size > 0 ||
    searchParams.get('filter') !== null;

  const SidebarContent = () => (
    <div className="bg-white border border-[#E5E5E5] p-8 rounded-[24px] shadow-sm space-y-8 select-none">
      {/* Categories */}
      <div>
        <h3 className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#1A1A1A] mb-4">Category</h3>
        <div className="space-y-3">
          {ALL_CATEGORIES.map((cat) => (
            <label key={cat} className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={selectedCategories.has(cat)}
                onChange={() => toggleCategory(cat)}
                className="w-4 h-4 border border-[#E5E5E5] rounded-sm accent-black cursor-pointer"
              />
              <span className="text-xs text-[#666666] group-hover:text-black transition-colors font-light">{cat}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <h3 className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#1A1A1A] mb-4">Price Range</h3>
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <label className="text-[9px] text-[#999] font-bold uppercase tracking-wider mb-1 block">Min (₹)</label>
            <input
              type="number"
              min={0}
              max={priceMax}
              value={priceMin}
              onChange={(e) => { setPriceMin(Number(e.target.value)); setCurrentPage(1); }}
              className="w-full border border-[#E5E5E5] px-3 py-2 rounded-md text-xs text-[#1A1A1A] focus:outline-none focus:border-black transition-colors bg-[#F8F8F8]"
            />
          </div>
          <span className="text-[#666666] mt-4 font-light">—</span>
          <div className="flex-1">
            <label className="text-[9px] text-[#999] font-bold uppercase tracking-wider mb-1 block">Max (₹)</label>
            <input
              type="number"
              min={priceMin}
              max={15000}
              value={priceMax}
              onChange={(e) => { setPriceMax(Number(e.target.value)); setCurrentPage(1); }}
              className="w-full border border-[#E5E5E5] px-3 py-2 rounded-md text-xs text-[#1A1A1A] focus:outline-none focus:border-black transition-colors bg-[#F8F8F8]"
            />
          </div>
        </div>
      </div>

      {/* Sizes */}
      <div>
        <h3 className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#1A1A1A] mb-4">Size</h3>
        <div className="grid grid-cols-3 gap-2">
          {ALL_SIZES.map((size) => {
            const isSelected = selectedSizes.has(size);
            return (
              <button
                key={size}
                onClick={() => toggleSize(size)}
                className={`py-2 text-xs border rounded-md transition-all font-semibold tracking-wide flex items-center justify-center ${
                  isSelected
                    ? 'bg-black text-white border-black shadow-sm'
                    : 'bg-white text-[#1A1A1A] border-[#E5E5E5] hover:border-black'
                }`}
              >
                {size}
              </button>
            );
          })}
        </div>
      </div>

      {/* Colors */}
      <div>
        <h3 className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#1A1A1A] mb-4">Color</h3>
        <div className="flex flex-wrap gap-2.5">
          {ALL_COLORS.map((color) => {
            const isSelected = selectedColors.has(color.hex);
            return (
              <button
                key={color.hex}
                onClick={() => toggleColor(color.hex)}
                title={color.name}
                className={`w-7 h-7 rounded-full border transition-all relative ${
                  isSelected
                    ? 'border-black ring-2 ring-black/30 ring-offset-2'
                    : 'border-[#E5E5E5] hover:border-gray-400'
                }`}
                style={{ backgroundColor: color.hex }}
              />
            );
          })}
        </div>
      </div>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <button
          onClick={clearFilters}
          className="w-full flex items-center justify-center gap-2 py-3 border border-black rounded-full text-xs font-bold tracking-widest uppercase text-black hover:bg-black hover:text-white transition-all duration-300"
        >
          <X size={13} />
          Clear Filters
        </button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8F8F8] py-12 px-6 md:px-8">
      <div className="max-w-[1200px] mx-auto">
        {/* Header */}
        <div className="mb-12 text-left">
          <motion.span
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-[10px] font-bold tracking-[0.3em] uppercase text-[#666666] block mb-3"
          >
            Explore All
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl md:text-5xl font-bold text-[#1A1A1A] tracking-tight leading-tight"
          >
            Shop All Products
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-[#666666] text-[10px] mt-3 uppercase tracking-widest font-bold"
          >
            {filteredProducts.length} items found
          </motion.p>
        </div>

        {/* Mobile filter toggle */}
        <div className="lg:hidden mb-6 select-none">
          <button
            onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
            className="w-full flex items-center justify-between text-xs font-bold tracking-widest uppercase text-black bg-white border border-[#E5E5E5] px-6 py-4 rounded-xl shadow-sm hover:border-black transition-colors"
          >
            <span className="flex items-center gap-2.5">
              <SlidersHorizontal size={14} />
              Filters
              {hasActiveFilters && (
                <span className="ml-1 bg-black text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center shadow">
                  {selectedCategories.size + selectedSizes.size + selectedColors.size + (priceMin > 0 || priceMax < 15000 ? 1 : 0) + (searchParams.get('filter') ? 1 : 0)}
                </span>
              )}
            </span>
            {mobileFiltersOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          <AnimatePresence>
            {mobileFiltersOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                animate={{ opacity: 1, height: 'auto', marginTop: 12 }}
                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <SidebarContent />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 lg:gap-10 items-start">
          {/* Sidebar */}
          <aside className="hidden lg:block w-[280px] flex-shrink-0 sticky top-24">
            <SidebarContent />
          </aside>

          {/* Main Content Area */}
          <div className="flex-1 w-full min-w-0">
            {/* Sort & Pagination Stats Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 pb-4 border-b border-[#E5E5E5] gap-4 select-none">
              <p className="text-xs text-[#666666] tracking-wide">
                Showing{' '}
                <span className="font-bold text-black">
                  {filteredProducts.length === 0 ? 0 : (currentPage - 1) * PRODUCTS_PER_PAGE + 1}–
                  {Math.min(currentPage * PRODUCTS_PER_PAGE, filteredProducts.length)}
                </span>{' '}
                of{' '}
                <span className="font-bold text-black">{filteredProducts.length}</span> products
              </p>
              
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#666666]">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => { setSortBy(e.target.value as SortOption); setCurrentPage(1); }}
                  className="text-xs font-semibold border border-[#E5E5E5] rounded-full px-4 py-2 text-black focus:outline-none focus:border-black transition-colors bg-white cursor-pointer hover:border-black shadow-sm"
                >
                  <option value="featured">Featured</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="newest">Newest Drop</option>
                </select>
              </div>
            </div>

            {/* Product Grid */}
            {paginatedProducts.length > 0 ? (
              <motion.div
                key={`${currentPage}-${Array.from(selectedCategories).join()}-${sortBy}-${searchParams.get('filter')}`}
                initial="hidden"
                animate="visible"
                variants={{
                  hidden: {},
                  visible: {
                    transition: {
                      staggerChildren: 0.05,
                    }
                  }
                }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-12"
              >
                {paginatedProducts.map((product, idx) => (
                  <motion.div
                    key={product.id}
                    variants={{
                      hidden: { opacity: 0, y: 20 },
                      visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.215, 0.61, 0.355, 1] as any } }
                    }}
                  >
                    <ProductCard product={product} />
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-28 text-center bg-white border border-[#E5E5E5] rounded-[24px] p-8 shadow-sm"
              >
                <ShoppingBag size={48} className="text-[#CCCCCC] mb-6" strokeWidth={1.5} />
                <h3 className="text-lg font-bold text-[#1A1A1A] mb-2 tracking-tight">No products found</h3>
                <p className="text-[#666666] text-xs font-light max-w-sm mb-8 leading-relaxed">
                  Try adjusting or clearing your filters to explore our premium collections.
                </p>
                <button
                  onClick={clearFilters}
                  className="bg-black hover:bg-black/85 text-white text-xs font-bold tracking-widest uppercase px-8 py-3.5 rounded-full transition-colors shadow-md"
                >
                  Clear All Filters
                </button>
              </motion.div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2.5 mt-16 select-none">
                <button
                  onClick={() => {
                    setCurrentPage((p) => Math.max(1, p - 1));
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  disabled={currentPage === 1}
                  className="px-4 py-2 text-[10px] font-bold tracking-widest uppercase border border-[#E5E5E5] text-black hover:border-black rounded-full transition-colors disabled:opacity-40 disabled:cursor-not-allowed bg-white shadow-sm"
                >
                  Prev
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => {
                      setCurrentPage(page);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className={`w-10 h-10 text-xs font-bold border rounded-full transition-all flex items-center justify-center shadow-sm ${
                      currentPage === page
                        ? 'bg-black text-white border-black'
                        : 'border-[#E5E5E5] text-[#1A1A1A] hover:border-black bg-white'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => {
                    setCurrentPage((p) => Math.min(totalPages, p + 1));
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 text-[10px] font-bold tracking-widest uppercase border border-[#E5E5E5] text-black hover:border-black rounded-full transition-colors disabled:opacity-40 disabled:cursor-not-allowed bg-white shadow-sm"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ShopPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#F8F8F8]">
        <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <ShopContent />
    </Suspense>
  );
}
