'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, Loader2, AlertCircle, ShoppingBag, Store, Check } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

type Role = 'buyer' | 'seller';

interface RegisterFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || 'Enter a valid email address';
}

export default function RegisterPage() {
  const { register: registerUser, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role>('buyer');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>({
    defaultValues: { name: '', email: '', password: '', confirmPassword: '' },
  });

  const password = watch('password');

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, authLoading, router]);

  const onSubmit = async (data: RegisterFormData) => {
    setServerError('');
    setIsSubmitting(true);
    try {
      const result = await registerUser(data.name, data.email, data.password, selectedRole);
      if (result.success) {
        router.push('/');
      } else {
        setServerError(result.error || 'Registration failed. Please try again.');
      }
    } catch {
      setServerError('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const roleCards: {
    value: Role;
    label: string;
    description: string;
    icon: React.ReactNode;
  }[] = [
    {
      value: 'buyer',
      label: 'Shop as Buyer',
      description: 'Browse and purchase from thousands of fashion items',
      icon: <ShoppingBag className="w-5 h-5" />,
    },
    {
      value: 'seller',
      label: 'Sell on Wearix',
      description: 'List your products and reach millions of customers',
      icon: <Store className="w-5 h-5" />,
    },
  ];

  return (
    <div className="min-h-screen bg-[#F9F9F9] flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <span className="text-3xl font-black tracking-[0.2em] text-[#1A1A1A] uppercase">
              WEARIX
            </span>
          </Link>
        </div>

        {/* Card */}
        <div className="bg-white border border-[#E5E5E5] rounded-sm p-8 shadow-sm">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-[#1A1A1A]">Create Account</h1>
            <p className="text-sm text-[#666666] mt-1">
              Join the Wearix community today
            </p>
          </div>

          {/* Error message */}
          <AnimatePresence>
            {serverError && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4 p-3 bg-red-50 border border-red-200 rounded-sm flex items-center gap-2"
              >
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <p className="text-sm text-red-700">{serverError}</p>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
            {/* Full Name */}
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-[#1A1A1A] mb-1.5"
              >
                Full Name
              </label>
              <input
                id="name"
                type="text"
                autoComplete="name"
                placeholder="John Doe"
                {...register('name', {
                  required: 'Full name is required',
                  minLength: { value: 2, message: 'Name must be at least 2 characters' },
                })}
                className={`w-full px-4 py-2.5 text-sm bg-white border rounded-sm outline-none transition-colors placeholder:text-[#AAAAAA] ${
                  errors.name
                    ? 'border-red-400 focus:border-red-500'
                    : 'border-[#E5E5E5] focus:border-black'
                }`}
              />
              {errors.name && (
                <p className="mt-1.5 text-xs text-red-600">{errors.name.message}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-[#1A1A1A] mb-1.5"
              >
                Email address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                {...register('email', {
                  required: 'Email is required',
                  validate: validateEmail,
                })}
                className={`w-full px-4 py-2.5 text-sm bg-white border rounded-sm outline-none transition-colors placeholder:text-[#AAAAAA] ${
                  errors.email
                    ? 'border-red-400 focus:border-red-500'
                    : 'border-[#E5E5E5] focus:border-black'
                }`}
              />
              {errors.email && (
                <p className="mt-1.5 text-xs text-red-600">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-[#1A1A1A] mb-1.5"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="••••••••"
                  {...register('password', {
                    required: 'Password is required',
                    minLength: { value: 8, message: 'Password must be at least 8 characters' },
                  })}
                  className={`w-full px-4 py-2.5 pr-11 text-sm bg-white border rounded-sm outline-none transition-colors placeholder:text-[#AAAAAA] ${
                    errors.password
                      ? 'border-red-400 focus:border-red-500'
                      : 'border-[#E5E5E5] focus:border-black'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#666666] hover:text-[#1A1A1A] transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1.5 text-xs text-red-600">{errors.password.message}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-[#1A1A1A] mb-1.5"
              >
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="••••••••"
                  {...register('confirmPassword', {
                    required: 'Please confirm your password',
                    validate: (value) =>
                      value === password || 'Passwords do not match',
                  })}
                  className={`w-full px-4 py-2.5 pr-11 text-sm bg-white border rounded-sm outline-none transition-colors placeholder:text-[#AAAAAA] ${
                    errors.confirmPassword
                      ? 'border-red-400 focus:border-red-500'
                      : 'border-[#E5E5E5] focus:border-black'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#666666] hover:text-[#1A1A1A] transition-colors"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1.5 text-xs text-red-600">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            {/* Role Selector */}
            <div>
              <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                I want to…
              </label>
              <div className="grid grid-cols-2 gap-3">
                {roleCards.map((card) => (
                  <button
                    key={card.value}
                    type="button"
                    onClick={() => setSelectedRole(card.value)}
                    className={`relative flex flex-col items-start gap-2 p-4 border rounded-sm text-left transition-all ${
                      selectedRole === card.value
                        ? 'border-black bg-black text-white'
                        : 'border-[#E5E5E5] bg-white text-[#1A1A1A] hover:border-[#999]'
                    }`}
                  >
                    {selectedRole === card.value && (
                      <div className="absolute top-2 right-2">
                        <Check className="w-4 h-4" />
                      </div>
                    )}
                    <div
                      className={`${
                        selectedRole === card.value ? 'text-white' : 'text-[#666666]'
                      }`}
                    >
                      {card.icon}
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{card.label}</p>
                      <p
                        className={`text-xs mt-0.5 leading-relaxed ${
                          selectedRole === card.value ? 'text-white/70' : 'text-[#666666]'
                        }`}
                      >
                        {card.description}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 bg-black text-white text-sm font-medium py-3 rounded-sm hover:bg-[#333] disabled:opacity-60 disabled:cursor-not-allowed transition-colors mt-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating account…
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          {/* Login link */}
          <p className="mt-6 text-center text-sm text-[#666666]">
            Already have an account?{' '}
            <Link
              href="/login"
              className="text-[#1A1A1A] font-medium underline underline-offset-4 hover:text-black"
            >
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
