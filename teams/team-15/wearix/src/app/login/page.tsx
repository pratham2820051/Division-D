'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface LoginFormData {
  email: string;
  password: string;
}

function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || 'Enter a valid email address';
}

export default function LoginPage() {
  const { login, isAuthenticated, isLoading: authLoading, user } = useAuth();
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    defaultValues: { email: '', password: '' },
  });

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && isAuthenticated && user) {
      if (user.role === 'seller') router.push('/seller/dashboard');
      else if (user.role === 'support') router.push('/support');
      else router.push('/');
    }
  }, [isAuthenticated, authLoading, user, router]);

  const onSubmit = async (data: LoginFormData) => {
    setServerError('');
    setIsSubmitting(true);
    try {
      const result = await login(data.email, data.password);
      if (!result.success) {
        setServerError(result.error || 'Login failed. Please try again.');
      }
      // Redirect handled by useEffect above
    } catch {
      setServerError('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

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
            <h1 className="text-2xl font-bold text-[#1A1A1A]">Welcome back</h1>
            <p className="text-sm text-[#666666] mt-1">
              Sign in to your Wearix account
            </p>
          </div>

          {/* Demo credentials hint */}
          <div className="mb-6 p-3 bg-[#F9F9F9] border border-[#E5E5E5] rounded-sm">
            <p className="text-xs text-[#666666] font-medium mb-1">Demo credentials</p>
            <p className="text-xs text-[#666666] font-mono">buyer@wearix.com / password123</p>
            <p className="text-xs text-[#666666] font-mono">seller@wearix.com / password123</p>
            <p className="text-xs text-[#666666] font-mono">support@wearix.com / password123 (Support)</p>
          </div>

          {/* Error message */}
          {serverError && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mb-4 p-3 bg-red-50 border border-red-200 rounded-sm flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <p className="text-sm text-red-700">{serverError}</p>
            </motion.div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
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
                  autoComplete="current-password"
                  placeholder="••••••••"
                  {...register('password', {
                    required: 'Password is required',
                    minLength: { value: 6, message: 'Password must be at least 6 characters' },
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
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1.5 text-xs text-red-600">{errors.password.message}</p>
              )}
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
                  Signing in…
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Register link */}
          <p className="mt-6 text-center text-sm text-[#666666]">
            Don&apos;t have an account?{' '}
            <Link
              href="/register"
              className="text-[#1A1A1A] font-medium underline underline-offset-4 hover:text-black"
            >
              Register
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
