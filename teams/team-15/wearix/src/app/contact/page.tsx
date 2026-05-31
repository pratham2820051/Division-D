'use client';

import { useState, useRef } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  Send,
  CheckCircle,
  Loader2,
  AtSign,
  Share2,
  Globe,
  Play,
} from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0 },
};

function AnimatedSection({
  children,
  className = '',
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  return (
    <motion.div
      ref={ref}
      variants={fadeUp}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      transition={{ duration: 0.55, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

const CONTACT_INFO = [
  {
    icon: <Mail className="w-5 h-5" />,
    label: 'Email',
    value: 'support@wearix.com',
    href: 'mailto:support@wearix.com',
  },
  {
    icon: <Phone className="w-5 h-5" />,
    label: 'Phone',
    value: '+1 (555) 000-WEAR',
    href: 'tel:+15550009327',
  },
  {
    icon: <MapPin className="w-5 h-5" />,
    label: 'Address',
    value: '123 Fashion Ave, New York, NY 10001',
    href: 'https://maps.google.com',
  },
  {
    icon: <Clock className="w-5 h-5" />,
    label: 'Hours',
    value: 'Mon–Fri, 9am–6pm EST',
    href: null,
  },
];

const SOCIALS = [
  { icon: <AtSign  className="w-5 h-5" />, label: 'Instagram',  href: '#' },
  { icon: <Share2  className="w-5 h-5" />, label: 'Twitter / X', href: '#' },
  { icon: <Globe   className="w-5 h-5" />, label: 'Facebook',   href: '#' },
  { icon: <Play    className="w-5 h-5" />, label: 'YouTube',    href: '#' },
];

export default function ContactPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactFormData>({
    defaultValues: { name: '', email: '', subject: '', message: '' },
  });

  const onSubmit = async (data: ContactFormData) => {
    setIsSubmitting(true);
    // Simulate API call
    await new Promise((r) => setTimeout(r, 1200));
    console.log('Contact form submitted:', data);
    setIsSubmitting(false);
    setSubmitted(true);
    reset();
    // Auto-hide success after 5s
    setTimeout(() => setSubmitted(false), 5000);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="bg-[#F9F9F9] border-b border-[#E5E5E5]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <AnimatedSection>
            <p className="text-xs font-medium tracking-[0.3em] uppercase text-[#666666] mb-3">
              We&apos;re Here to Help
            </p>
            <h1 className="text-5xl md:text-6xl font-black text-[#1A1A1A] tracking-tight">
              Get in Touch
            </h1>
            <p className="text-lg text-[#666666] mt-4 max-w-xl">
              Have a question, feedback, or need assistance? Our team typically responds
              within a few hours during business hours.
            </p>
          </AnimatedSection>
        </div>
      </section>

      {/* Main Content */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <div className="grid lg:grid-cols-5 gap-12 lg:gap-16">
          {/* Contact Form — Left (3/5) */}
          <AnimatedSection className="lg:col-span-3" delay={0}>
            <h2 className="text-xl font-bold text-[#1A1A1A] mb-6">Send us a message</h2>

            {/* Success Toast */}
            <AnimatePresence>
              {submitted && (
                <motion.div
                  initial={{ opacity: 0, y: -12, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -12, scale: 0.97 }}
                  transition={{ duration: 0.3 }}
                  className="mb-6 flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-sm"
                >
                  <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-green-800">
                      Message sent successfully!
                    </p>
                    <p className="text-xs text-green-700 mt-0.5">
                      We&apos;ll get back to you within 24 hours.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
              {/* Name + Email row */}
              <div className="grid sm:grid-cols-2 gap-4">
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
                    placeholder="John Doe"
                    {...register('name', { required: 'Name is required' })}
                    className={`w-full px-4 py-2.5 text-sm border rounded-sm outline-none transition-colors placeholder:text-[#AAAAAA] ${
                      errors.name
                        ? 'border-red-400 focus:border-red-500'
                        : 'border-[#E5E5E5] focus:border-black'
                    }`}
                  />
                  {errors.name && (
                    <p className="mt-1.5 text-xs text-red-600">{errors.name.message}</p>
                  )}
                </div>
                <div>
                  <label
                    htmlFor="contact-email"
                    className="block text-sm font-medium text-[#1A1A1A] mb-1.5"
                  >
                    Email Address
                  </label>
                  <input
                    id="contact-email"
                    type="email"
                    placeholder="you@example.com"
                    {...register('email', {
                      required: 'Email is required',
                      pattern: {
                        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                        message: 'Enter a valid email',
                      },
                    })}
                    className={`w-full px-4 py-2.5 text-sm border rounded-sm outline-none transition-colors placeholder:text-[#AAAAAA] ${
                      errors.email
                        ? 'border-red-400 focus:border-red-500'
                        : 'border-[#E5E5E5] focus:border-black'
                    }`}
                  />
                  {errors.email && (
                    <p className="mt-1.5 text-xs text-red-600">{errors.email.message}</p>
                  )}
                </div>
              </div>

              {/* Subject */}
              <div>
                <label
                  htmlFor="subject"
                  className="block text-sm font-medium text-[#1A1A1A] mb-1.5"
                >
                  Subject
                </label>
                <input
                  id="subject"
                  type="text"
                  placeholder="How can we help you?"
                  {...register('subject', { required: 'Subject is required' })}
                  className={`w-full px-4 py-2.5 text-sm border rounded-sm outline-none transition-colors placeholder:text-[#AAAAAA] ${
                    errors.subject
                      ? 'border-red-400 focus:border-red-500'
                      : 'border-[#E5E5E5] focus:border-black'
                  }`}
                />
                {errors.subject && (
                  <p className="mt-1.5 text-xs text-red-600">{errors.subject.message}</p>
                )}
              </div>

              {/* Message */}
              <div>
                <label
                  htmlFor="message"
                  className="block text-sm font-medium text-[#1A1A1A] mb-1.5"
                >
                  Message
                </label>
                <textarea
                  id="message"
                  rows={6}
                  placeholder="Tell us what's on your mind…"
                  {...register('message', {
                    required: 'Message is required',
                    minLength: { value: 20, message: 'Message must be at least 20 characters' },
                  })}
                  className={`w-full px-4 py-3 text-sm border rounded-sm outline-none transition-colors resize-none placeholder:text-[#AAAAAA] ${
                    errors.message
                      ? 'border-red-400 focus:border-red-500'
                      : 'border-[#E5E5E5] focus:border-black'
                  }`}
                />
                {errors.message && (
                  <p className="mt-1.5 text-xs text-red-600">{errors.message.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center justify-center gap-2 bg-black text-white text-sm font-medium px-8 py-3 rounded-sm hover:bg-[#333] disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sending…
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Send Message
                  </>
                )}
              </button>
            </form>
          </AnimatedSection>

          {/* Contact Info — Right (2/5) */}
          <AnimatedSection className="lg:col-span-2 space-y-8" delay={0.15}>
            <div>
              <h2 className="text-xl font-bold text-[#1A1A1A] mb-6">
                Contact Information
              </h2>
              <div className="space-y-4">
                {CONTACT_INFO.map((item) => (
                  <div key={item.label} className="flex gap-4">
                    <div className="w-10 h-10 bg-[#F0F0F0] rounded-sm flex items-center justify-center text-[#666666] shrink-0">
                      {item.icon}
                    </div>
                    <div>
                      <p className="text-xs font-medium text-[#666666] uppercase tracking-wider mb-0.5">
                        {item.label}
                      </p>
                      {item.href ? (
                        <a
                          href={item.href}
                          className="text-sm text-[#1A1A1A] hover:underline"
                          target={item.href.startsWith('http') ? '_blank' : undefined}
                          rel={item.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                        >
                          {item.value}
                        </a>
                      ) : (
                        <p className="text-sm text-[#1A1A1A]">{item.value}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-[#E5E5E5]" />

            {/* Social Links */}
            <div>
              <h3 className="text-sm font-semibold text-[#1A1A1A] mb-4 uppercase tracking-wider">
                Follow Us
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {SOCIALS.map((social) => (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2.5 px-4 py-2.5 border border-[#E5E5E5] rounded-sm text-sm text-[#666666] hover:border-black hover:text-[#1A1A1A] transition-colors"
                  >
                    {social.icon}
                    {social.label}
                  </a>
                ))}
              </div>
            </div>

            {/* FAQ CTA */}
            <div className="bg-[#F9F9F9] border border-[#E5E5E5] rounded-sm p-5">
              <h3 className="text-sm font-semibold text-[#1A1A1A] mb-2">
                Looking for quick answers?
              </h3>
              <p className="text-xs text-[#666666] mb-4 leading-relaxed">
                Browse our help center for answers to the most common questions about
                orders, shipping, and returns.
              </p>
              <a
                href="#"
                className="inline-block text-xs font-medium text-[#1A1A1A] underline underline-offset-4 hover:text-black"
              >
                Visit Help Center →
              </a>
            </div>
          </AnimatedSection>
        </div>
      </section>
    </div>
  );
}
