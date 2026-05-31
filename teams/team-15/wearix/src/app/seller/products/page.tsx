'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Eye,
  ChevronLeft,
  ChevronRight,
  X,
  AlertTriangle,
} from 'lucide-react';
import { mockProducts, type Product } from '@/data/mockProducts';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';

const CATEGORIES = ['All', 'Men', 'Women', 'Children'] as const;
const PAGE_SIZE = 10;

function StockBadge({ stock }: { stock: number }) {
  if (stock < 10)
    return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-red-100 text-red-700">{stock}</span>;
  if (stock < 50)
    return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-amber-100 text-amber-700">{stock}</span>;
  return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-700">{stock}</span>;
}

function StatusBadge({ featured }: { featured: boolean }) {
  return featured ? (
    <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-violet-100 text-violet-700">Featured</span>
  ) : (
    <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-gray-100 text-gray-600">Active</span>
  );
}

// Delete Confirmation Modal
function DeleteModal({
  product,
  onConfirm,
  onCancel,
}: {
  product: Product;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        onClick={onCancel}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 16 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 16 }}
          transition={{ duration: 0.2 }}
          className="bg-white rounded-sm border border-[#E5E5E5] w-full max-w-sm p-6"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start gap-3 mb-5">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h3 className="font-semibold text-[#1A1A1A] text-base">Delete Product</h3>
              <p className="text-sm text-[#666666] mt-1">
                Are you sure you want to delete <strong>&quot;{product.name}&quot;</strong>? This action cannot be undone.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 border border-[#E5E5E5] text-[#1A1A1A] text-sm font-semibold py-2.5 rounded-sm hover:bg-[#F9F9F9] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 bg-red-600 text-white text-sm font-semibold py-2.5 rounded-sm hover:bg-red-700 transition-colors"
            >
              Delete
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default function SellerProductsPage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string>('All');
  const [page, setPage] = useState(1);
  const [products, setProducts] = useState<Product[]>(mockProducts);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchCat = category === 'All' || p.category === category;
      const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()));
      return matchCat && matchSearch;
    });
  }, [products, search, category]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleDelete = (product: Product) => setDeleteTarget(product);
  const confirmDelete = () => {
    if (deleteTarget) {
      setProducts((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      setDeleteTarget(null);
    }
  };

  return (
    <div className="px-4 lg:px-8 py-8 max-w-7xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8"
      >
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-[#1A1A1A] tracking-tight">My Products</h1>
          <p className="text-sm text-[#666666] mt-1">{filtered.length} products total</p>
        </div>
        <Link
          href="/seller/products/upload"
          className="inline-flex items-center gap-2 bg-black text-white text-sm font-semibold px-5 py-2.5 rounded-sm hover:bg-neutral-800 transition-colors whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          Add New Product
        </Link>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col sm:flex-row gap-3 mb-6"
      >
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-[#E5E5E5] rounded-sm bg-white focus:outline-none focus:border-black transition-colors"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="w-3.5 h-3.5 text-gray-400" />
            </button>
          )}
        </div>
        <div className="flex gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => { setCategory(cat); setPage(1); }}
              className={cn(
                'px-4 py-2.5 text-sm font-medium rounded-sm border transition-colors whitespace-nowrap',
                category === cat
                  ? 'bg-black text-white border-black'
                  : 'bg-white text-[#666666] border-[#E5E5E5] hover:border-black hover:text-black'
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Desktop Table */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="hidden md:block bg-white border border-[#E5E5E5] rounded-sm overflow-hidden"
      >
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#E5E5E5] bg-[#FAFAFA]">
              {['Product', 'Category', 'Price', 'Stock', 'Status', 'Actions'].map((h) => (
                <th
                  key={h}
                  className="px-5 py-3 text-left text-xs font-semibold text-[#666666] uppercase tracking-wider"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-16 text-center text-[#666666] text-sm">
                    No products found.
                  </td>
                </tr>
              ) : (
                paginated.map((product, idx) => (
                  <motion.tr
                    key={product.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: idx * 0.04 }}
                    className="border-b border-[#F0F0F0] hover:bg-[#FAFAFA] transition-colors"
                  >
                    {/* Product */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="relative w-[60px] h-[60px] flex-shrink-0 overflow-hidden rounded-sm border border-[#E5E5E5]">
                          <Image
                            src={product.images[0]}
                            alt={product.name}
                            fill
                            className="object-cover"
                            sizes="60px"
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-[#1A1A1A] truncate max-w-[180px]">{product.name}</p>
                          <p className="text-xs text-[#666666] mt-0.5 truncate max-w-[180px]">
                            {product.tags.slice(0, 2).join(', ')}
                          </p>
                        </div>
                      </div>
                    </td>
                    {/* Category */}
                    <td className="px-5 py-3.5 text-[#666666]">{product.category}</td>
                    {/* Price */}
                    <td className="px-5 py-3.5">
                      <div>
                        <p className="font-semibold text-[#1A1A1A]">{formatCurrency(product.price)}</p>
                        {product.comparePrice > product.price && (
                          <p className="text-xs text-gray-400 line-through">{formatCurrency(product.comparePrice)}</p>
                        )}
                      </div>
                    </td>
                    {/* Stock */}
                    <td className="px-5 py-3.5">
                      <StockBadge stock={product.stock} />
                    </td>
                    {/* Status */}
                    <td className="px-5 py-3.5">
                      <StatusBadge featured={product.isFeatured} />
                    </td>
                    {/* Actions */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1">
                        <Link
                          href={`/products/${product.id}`}
                          className="p-1.5 rounded hover:bg-gray-100 text-[#666666] hover:text-black transition-colors"
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <Link
                          href={`/seller/products/edit/${product.id}`}
                          className="p-1.5 rounded hover:bg-blue-50 text-[#666666] hover:text-blue-600 transition-colors"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(product)}
                          className="p-1.5 rounded hover:bg-red-50 text-[#666666] hover:text-red-600 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </AnimatePresence>
          </tbody>
        </table>
      </motion.div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {paginated.length === 0 ? (
          <div className="bg-white border border-[#E5E5E5] rounded-sm p-8 text-center text-sm text-[#666666]">
            No products found.
          </div>
        ) : (
          paginated.map((product, idx) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-white border border-[#E5E5E5] rounded-sm p-4"
            >
              <div className="flex gap-3">
                <div className="relative w-[60px] h-[60px] flex-shrink-0 rounded-sm overflow-hidden border border-[#E5E5E5]">
                  <Image src={product.images[0]} alt={product.name} fill className="object-cover" sizes="60px" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[#1A1A1A] text-sm truncate">{product.name}</p>
                  <p className="text-xs text-[#666666]">{product.category}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="font-semibold text-sm">{formatCurrency(product.price)}</span>
                    <StockBadge stock={product.stock} />
                    <StatusBadge featured={product.isFeatured} />
                  </div>
                </div>
              </div>
              <div className="flex gap-2 mt-3 pt-3 border-t border-[#F0F0F0]">
                <Link
                  href={`/products/${product.id}`}
                  className="flex-1 flex items-center justify-center gap-1 text-xs font-medium py-2 border border-[#E5E5E5] rounded-sm hover:bg-[#F9F9F9] text-[#666666]"
                >
                  <Eye className="w-3.5 h-3.5" /> View
                </Link>
                <Link
                  href={`/seller/products/edit/${product.id}`}
                  className="flex-1 flex items-center justify-center gap-1 text-xs font-medium py-2 border border-[#E5E5E5] rounded-sm hover:bg-blue-50 text-[#666666] hover:text-blue-600"
                >
                  <Pencil className="w-3.5 h-3.5" /> Edit
                </Link>
                <button
                  onClick={() => handleDelete(product)}
                  className="flex-1 flex items-center justify-center gap-1 text-xs font-medium py-2 border border-[#E5E5E5] rounded-sm hover:bg-red-50 text-[#666666] hover:text-red-600"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <p className="text-sm text-[#666666]">
            Page {page} of {totalPages} · {filtered.length} results
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 border border-[#E5E5E5] rounded-sm disabled:opacity-40 hover:bg-[#F9F9F9] transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((n) => n === 1 || n === totalPages || Math.abs(n - page) <= 1)
              .reduce<(number | '...')[]>((acc, n, i, arr) => {
                if (i > 0 && n - (arr[i - 1] as number) > 1) acc.push('...');
                acc.push(n);
                return acc;
              }, [])
              .map((n, i) =>
                n === '...' ? (
                  <span key={`dots-${i}`} className="px-2 text-gray-400 text-sm">…</span>
                ) : (
                  <button
                    key={n}
                    onClick={() => setPage(n as number)}
                    className={cn(
                      'w-9 h-9 text-sm font-medium rounded-sm border transition-colors',
                      page === n
                        ? 'bg-black text-white border-black'
                        : 'border-[#E5E5E5] text-[#666666] hover:border-black hover:text-black'
                    )}
                  >
                    {n}
                  </button>
                )
              )}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 border border-[#E5E5E5] rounded-sm disabled:opacity-40 hover:bg-[#F9F9F9] transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Delete modal */}
      {deleteTarget && (
        <DeleteModal
          product={deleteTarget}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
