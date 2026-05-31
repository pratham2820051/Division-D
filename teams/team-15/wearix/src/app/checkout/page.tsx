'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import {
  Check,
  Lock,
  CreditCard,
  Package,
  Truck,
  ChevronRight,
  ShoppingBag,
  X,
} from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { formatCurrency, generateOrderId } from '@/lib/utils';

// ─── Zod Schema ──────────────────────────────────────────────────────────────
const checkoutSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  street: z.string().min(5, 'Please enter a valid street address'),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  zip: z.string().regex(/^\d{5}(-\d{4})?$/, 'Invalid ZIP code'),
  phone: z.string().regex(/^[\d\s\-()+]{10,}$/, 'Invalid phone number'),
});

type CheckoutFormData = z.infer<typeof checkoutSchema>;

// ─── Form Field Component ─────────────────────────────────────────────────────
function FormField({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <label className="block text-xs font-medium text-[#666666] tracking-wide uppercase">
        {label}
      </label>
      {children}
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xs text-red-600 mt-0.5"
        >
          {error}
        </motion.p>
      )}
    </div>
  );
}

const inputClass =
  'w-full px-3 py-2.5 text-sm border border-[#E5E5E5] text-[#1A1A1A] focus:outline-none focus:border-black transition-colors placeholder:text-[#BBBBBB]';
const inputErrorClass =
  'w-full px-3 py-2.5 text-sm border border-red-300 text-[#1A1A1A] focus:outline-none focus:border-red-500 transition-colors placeholder:text-[#BBBBBB]';

// ─── Success Modal ────────────────────────────────────────────────────────────
function SuccessModal({
  orderId,
  onConfirm,
}: {
  orderId: string;
  onConfirm: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
    >
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 24 }}
        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
        className="relative bg-white max-w-md w-full p-10 text-center shadow-2xl"
      >
        {/* Checkmark circle */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', damping: 15 }}
          className="w-20 h-20 rounded-full bg-black flex items-center justify-center mx-auto mb-6"
        >
          <Check size={36} className="text-white" strokeWidth={2.5} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <h2 className="text-2xl font-bold text-[#1A1A1A] mb-2">Payment Successful!</h2>
          <p className="text-[#666666] text-sm mb-6">
            Thank you for your purchase. Your order has been placed and is being processed.
          </p>

          <div className="bg-[#F9F9F9] border border-[#E5E5E5] rounded-sm px-6 py-4 mb-6">
            <p className="text-xs text-[#666666] uppercase tracking-widest font-medium mb-1">Order ID</p>
            <p className="text-lg font-bold text-[#1A1A1A] font-mono">{orderId}</p>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-8 text-xs text-[#666666]">
            <div className="flex flex-col items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-[#F9F9F9] flex items-center justify-center">
                <Package size={18} className="text-[#1A1A1A]" />
              </div>
              <span>Order Placed</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-[#F9F9F9] flex items-center justify-center">
                <Truck size={18} className="text-[#666666]" />
              </div>
              <span>Processing</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-[#F9F9F9] flex items-center justify-center">
                <Check size={18} className="text-[#666666]" />
              </div>
              <span>Delivered</span>
            </div>
          </div>

          <button
            onClick={onConfirm}
            className="w-full bg-black text-white py-3.5 text-sm font-semibold tracking-wider uppercase hover:bg-zinc-800 transition-colors flex items-center justify-center gap-2"
          >
            View My Orders
            <ChevronRight size={16} />
          </button>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

// ─── Main Checkout Page ───────────────────────────────────────────────────────
export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, shipping, tax, total, clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [orderId, setOrderId] = useState('');
  const [step, setStep] = useState<'shipping' | 'payment'>('shipping');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CheckoutFormData>({
    defaultValues: {
      firstName: '',
      lastName: '',
      street: '',
      city: '',
      state: '',
      zip: '',
      phone: '',
    },
  });

  // Redirect if cart is empty and no success modal
  useEffect(() => {
    if (items.length === 0 && !showSuccess) {
      router.push('/shop');
    }
  }, [items.length, showSuccess, router]);

  const onSubmit = async (_data: CheckoutFormData) => {
    setLoading(true);
    // Simulate payment processing
    await new Promise((resolve) => setTimeout(resolve, 1500));
    const id = generateOrderId();
    setOrderId(id);
    setLoading(false);
    setShowSuccess(true);
  };

  const handleOrderConfirm = () => {
    clearCart();
    router.push('/orders');
  };

  if (items.length === 0 && !showSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      <AnimatePresence>
        {showSuccess && (
          <SuccessModal orderId={orderId} onConfirm={handleOrderConfirm} />
        )}
      </AnimatePresence>

      <div className="min-h-screen bg-[#F9F9F9]">
        {/* Top bar */}
        <div className="bg-white border-b border-[#E5E5E5]">
          <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <Link href="/" className="text-xl font-bold tracking-widest text-[#1A1A1A] uppercase">
              Wearix
            </Link>
            <div className="flex items-center gap-4">
              <Lock size={14} className="text-[#666666]" />
              <span className="text-xs text-[#666666]">Secure Checkout</span>
            </div>
          </div>
        </div>

        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          {/* Breadcrumb / steps */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 text-sm mb-8"
          >
            <Link href="/cart" className="text-[#666666] hover:text-black transition-colors">
              Cart
            </Link>
            <ChevronRight size={14} className="text-[#E5E5E5]" />
            <button
              onClick={() => setStep('shipping')}
              className={`transition-colors ${step === 'shipping' ? 'text-[#1A1A1A] font-semibold' : 'text-[#666666] hover:text-black'}`}
            >
              Shipping
            </button>
            <ChevronRight size={14} className="text-[#E5E5E5]" />
            <button
              onClick={() => setStep('payment')}
              className={`transition-colors ${step === 'payment' ? 'text-[#1A1A1A] font-semibold' : 'text-[#666666] hover:text-black'}`}
            >
              Payment
            </button>
          </motion.div>

          <h1 className="text-3xl font-semibold text-[#1A1A1A] tracking-tight mb-8">Checkout</h1>

          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8">
              {/* LEFT: Form */}
              <div className="space-y-6">
                {/* Shipping Address */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className="bg-white border border-[#E5E5E5] p-6"
                >
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-7 h-7 bg-black text-white rounded-full flex items-center justify-center text-xs font-bold">
                      1
                    </div>
                    <h2 className="text-base font-semibold text-[#1A1A1A]">Shipping Address</h2>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField label="First Name" error={errors.firstName?.message}>
                      <input
                        {...register('firstName', { required: 'First name is required' })}
                        placeholder="John"
                        className={errors.firstName ? inputErrorClass : inputClass}
                      />
                    </FormField>

                    <FormField label="Last Name" error={errors.lastName?.message}>
                      <input
                        {...register('lastName', { required: 'Last name is required' })}
                        placeholder="Doe"
                        className={errors.lastName ? inputErrorClass : inputClass}
                      />
                    </FormField>

                    <FormField label="Street Address" error={errors.street?.message}>
                      <div className="sm:col-span-2">
                        <input
                          {...register('street', {
                            required: 'Street address is required',
                            minLength: { value: 5, message: 'Please enter a valid address' },
                          })}
                          placeholder="123 Main Street, Apt 4B"
                          className={errors.street ? inputErrorClass : inputClass}
                        />
                      </div>
                    </FormField>

                    <FormField label="City" error={errors.city?.message}>
                      <input
                        {...register('city', { required: 'City is required' })}
                        placeholder="New York"
                        className={errors.city ? inputErrorClass : inputClass}
                      />
                    </FormField>

                    <FormField label="State" error={errors.state?.message}>
                      <select
                        {...register('state', { required: 'State is required' })}
                        className={errors.state ? inputErrorClass : inputClass}
                      >
                        <option value="">Select state</option>
                        {[
                          'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA',
                          'HI','ID','IL','IN','IA','KS','KY','LA','ME','MD',
                          'MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
                          'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC',
                          'SD','TN','TX','UT','VT','VA','WA','WV','WI','WY',
                        ].map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </FormField>

                    <FormField label="ZIP Code" error={errors.zip?.message}>
                      <input
                        {...register('zip', {
                          required: 'ZIP code is required',
                          pattern: { value: /^\d{5}(-\d{4})?$/, message: 'Invalid ZIP code' },
                        })}
                        placeholder="10001"
                        className={errors.zip ? inputErrorClass : inputClass}
                      />
                    </FormField>

                    <FormField label="Phone Number" error={errors.phone?.message}>
                      <input
                        {...register('phone', {
                          required: 'Phone number is required',
                          minLength: { value: 10, message: 'Invalid phone number' },
                        })}
                        placeholder="+1 (555) 000-0000"
                        type="tel"
                        className={errors.phone ? inputErrorClass : inputClass}
                      />
                    </FormField>
                  </div>
                </motion.div>

                {/* Payment Section */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.1 }}
                  className="bg-white border border-[#E5E5E5] p-6"
                >
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-7 h-7 bg-black text-white rounded-full flex items-center justify-center text-xs font-bold">
                      2
                    </div>
                    <h2 className="text-base font-semibold text-[#1A1A1A]">Payment</h2>
                    <div className="ml-auto flex items-center gap-1.5">
                      <Lock size={12} className="text-[#666666]" />
                      <span className="text-xs text-[#666666]">256-bit SSL</span>
                    </div>
                  </div>

                  {/* Mock card display */}
                  <div className="bg-gradient-to-br from-[#1A1A1A] to-[#4A4A4A] rounded-md p-5 mb-6 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-8 translate-x-8" />
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-8 -translate-x-8" />
                    <div className="flex justify-between items-start relative">
                      <span className="text-xs font-medium tracking-widest uppercase opacity-80">Wearix Pay</span>
                      <CreditCard size={24} className="opacity-70" />
                    </div>
                    <div className="mt-6 font-mono text-lg tracking-[0.3em] opacity-90">
                      •••• •••• •••• 4242
                    </div>
                    <div className="flex justify-between mt-4 text-xs opacity-70">
                      <span>Demo Cardholder</span>
                      <span>12/28</span>
                    </div>
                  </div>

                  <div className="bg-[#F9F9F9] border border-[#E5E5E5] rounded-sm p-4 mb-6">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center">
                        <Check size={10} className="text-white" />
                      </div>
                      <p className="text-sm text-[#666666]">
                        <span className="font-medium text-[#1A1A1A]">Demo Mode:</span> This is a mock checkout. No real payment will be processed.
                      </p>
                    </div>
                  </div>

                  {/* Pay Now Button */}
                  <motion.button
                    type="submit"
                    disabled={loading}
                    whileTap={{ scale: 0.98 }}
                    className="w-full h-12 bg-black text-white text-sm font-semibold tracking-wider uppercase hover:bg-zinc-800 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Processing Payment...
                      </>
                    ) : (
                      <>
                        <Lock size={14} />
                        Pay Now — {formatCurrency(total)}
                      </>
                    )}
                  </motion.button>

                  {/* Accepted methods */}
                  <div className="flex items-center justify-center gap-3 mt-4">
                    {['VISA', 'MC', 'AMEX', 'PayPal'].map((method) => (
                      <span
                        key={method}
                        className="text-[10px] font-bold text-[#666666] border border-[#E5E5E5] px-2 py-1 rounded"
                      >
                        {method}
                      </span>
                    ))}
                  </div>
                </motion.div>
              </div>

              {/* RIGHT: Order Summary */}
              <motion.div
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.15 }}
                className="h-fit"
              >
                <div className="bg-white border border-[#E5E5E5] p-6">
                  <div className="flex items-center gap-2 mb-5">
                    <ShoppingBag size={16} className="text-[#1A1A1A]" />
                    <h2 className="text-base font-semibold text-[#1A1A1A]">
                      Order Summary ({items.length} {items.length === 1 ? 'item' : 'items'})
                    </h2>
                  </div>

                  {/* Product list */}
                  <div className="space-y-4 mb-5 max-h-72 overflow-y-auto pr-1">
                    {items.map((item) => (
                      <div
                        key={`${item.productId}-${item.size}-${item.color}`}
                        className="flex gap-3"
                      >
                        <div className="relative w-14 h-16 bg-[#F9F9F9] flex-shrink-0 overflow-hidden">
                          <Image
                            src={item.image}
                            alt={item.name}
                            fill
                            className="object-cover"
                            sizes="56px"
                          />
                          <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-black text-white rounded-full text-[10px] flex items-center justify-center font-bold">
                            {item.quantity}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[#1A1A1A] leading-tight truncate">{item.name}</p>
                          <p className="text-xs text-[#666666] mt-0.5">{item.size} · {item.color}</p>
                          <p className="text-sm font-semibold text-[#1A1A1A] mt-1">{formatCurrency(item.price * item.quantity)}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="h-px bg-[#E5E5E5] mb-4" />

                  {/* Pricing breakdown */}
                  <div className="space-y-3 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-[#666666]">Subtotal</span>
                      <span className="font-medium text-[#1A1A1A]">{formatCurrency(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-[#666666]">Shipping</span>
                      <span className={`font-medium ${shipping === 0 ? 'text-green-700' : 'text-[#1A1A1A]'}`}>
                        {shipping === 0 ? 'Free' : formatCurrency(shipping)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-[#666666]">Tax (8%)</span>
                      <span className="font-medium text-[#1A1A1A]">{formatCurrency(tax)}</span>
                    </div>
                  </div>

                  <div className="h-px bg-[#E5E5E5] mb-4" />

                  <div className="flex justify-between">
                    <span className="font-bold text-[#1A1A1A]">Total</span>
                    <span className="font-bold text-xl text-[#1A1A1A]">{formatCurrency(total)}</span>
                  </div>

                  {/* Shipping note */}
                  <div className="mt-4 flex items-start gap-2 bg-[#F9F9F9] p-3 rounded-sm">
                    <Truck size={14} className="text-[#666666] mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-[#666666] leading-relaxed">
                      {shipping === 0
                        ? 'You qualify for free shipping!'
                        : `Add ${formatCurrency(5000 - subtotal)} more to your order for free shipping.`}
                    </p>
                  </div>
                </div>

                {/* Back to cart */}
                <div className="mt-4 text-center">
                  <Link
                    href="/cart"
                    className="text-sm text-[#666666] hover:text-black transition-colors"
                  >
                    ← Return to cart
                  </Link>
                </div>
              </motion.div>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
