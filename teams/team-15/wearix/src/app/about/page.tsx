'use client';

import { useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, useInView } from 'framer-motion';
import { Star, Leaf, Heart, Sparkles, Globe, Users, Clock, TrendingUp } from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
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
  const inView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <motion.div
      ref={ref}
      variants={fadeUp}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      transition={{ duration: 0.6, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

const TEAM = [
  { name: 'Alexandra Chen', role: 'Co-founder & CEO', initials: 'AC', color: 'bg-rose-100 text-rose-700' },
  { name: 'Marcus Johnson', role: 'Co-founder & CTO', initials: 'MJ', color: 'bg-blue-100 text-blue-700' },
  { name: 'Sofia Reyes', role: 'Head of Design', initials: 'SR', color: 'bg-violet-100 text-violet-700' },
  { name: 'James Park', role: 'Head of Operations', initials: 'JP', color: 'bg-amber-100 text-amber-700' },
];

const VALUES = [
  {
    icon: <Star className="w-5 h-5" />,
    title: 'Quality',
    description:
      'Every piece on Wearix is curated for craftsmanship. We partner with brands that use premium materials and ethical production standards.',
  },
  {
    icon: <Leaf className="w-5 h-5" />,
    title: 'Sustainability',
    description:
      "We're committed to a greener fashion industry — prioritizing eco-conscious brands, minimal packaging, and carbon-neutral shipping.",
  },
  {
    icon: <Heart className="w-5 h-5" />,
    title: 'Comfort',
    description:
      'Fashion should feel as good as it looks. Our collections span everyday essentials to statement pieces — all designed for real life.',
  },
  {
    icon: <Sparkles className="w-5 h-5" />,
    title: 'Style',
    description:
      'Trend-aware without being trend-dependent. Wearix celebrates individual expression through a thoughtfully edited selection of styles.',
  },
];

const STATS = [
  { value: '10+', label: 'Years in Fashion', icon: <Clock className="w-5 h-5" /> },
  { value: '200+', label: 'Team Members', icon: <Users className="w-5 h-5" /> },
  { value: '40+', label: 'Countries Served', icon: <Globe className="w-5 h-5" /> },
  { value: '1M+', label: 'Happy Customers', icon: <TrendingUp className="w-5 h-5" /> },
];

export default function AboutPage() {
  const heroRef = useRef(null);
  const heroInView = useInView(heroRef, { once: true });

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="relative overflow-hidden bg-[#1A1A1A] text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          <motion.div
            ref={heroRef}
            initial={{ opacity: 0, y: 40 }}
            animate={heroInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7 }}
            className="max-w-3xl"
          >
            <p className="text-xs font-medium tracking-[0.3em] uppercase text-white/60 mb-4">
              Our Story
            </p>
            <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-none mb-6">
              About Wearix
            </h1>
            <p className="text-lg md:text-xl text-white/70 leading-relaxed max-w-2xl">
              A decade of redefining fashion — building the platform where style meets
              substance, and where every purchase tells a story worth wearing.
            </p>
          </motion.div>
        </div>

        {/* Decorative grid */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage:
              'linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />
      </section>

      {/* Stats Bar */}
      <section className="border-b border-[#E5E5E5] bg-[#F9F9F9]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-[#E5E5E5]">
            {STATS.map((stat, idx) => (
              <AnimatedSection
                key={stat.label}
                delay={idx * 0.1}
                className="px-6 py-8 flex flex-col items-center text-center"
              >
                <div className="text-[#666666] mb-2">{stat.icon}</div>
                <span className="text-4xl font-black text-[#1A1A1A] tracking-tight">
                  {stat.value}
                </span>
                <span className="text-sm text-[#666666] mt-1">{stat.label}</span>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Brand Story */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
        <div className="grid md:grid-cols-2 gap-12 md:gap-20 items-center">
          {/* Image */}
          <AnimatedSection delay={0}>
            <div className="relative aspect-[4/5] rounded-sm overflow-hidden bg-[#F0F0F0]">
              <Image
                src="https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=800&q=80"
                alt="Wearix brand story — fashion studio"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
              <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-sm">
                <p className="text-xs font-medium text-[#1A1A1A]">Founded 2014</p>
                <p className="text-xs text-[#666666]">New York City</p>
              </div>
            </div>
          </AnimatedSection>

          {/* Text */}
          <AnimatedSection delay={0.15} className="space-y-6">
            <p className="text-xs font-medium tracking-[0.3em] uppercase text-[#666666]">
              Our Mission
            </p>
            <h2 className="text-4xl font-black text-[#1A1A1A] leading-tight">
              Fashion for everyone, crafted with intention.
            </h2>
            <div className="space-y-4 text-[#666666] leading-relaxed">
              <p>
                Wearix was born in 2014 from a simple frustration: great fashion was
                either inaccessible or unsustainable. Our founders Alexandra Chen and
                Marcus Johnson set out to change that — building a marketplace where
                quality, ethics, and style coexist.
              </p>
              <p>
                Today, our platform connects over a million customers with hundreds of
                curated brands across more than 40 countries. From timeless wardrobe
                staples to contemporary statement pieces, Wearix is where fashion
                discovery happens.
              </p>
              <p>
                With a team of over 200 passionate professionals spanning design,
                technology, and sustainability, we&apos;re constantly innovating to make
                fashion more personal, more responsible, and more joyful.
              </p>
            </div>
            <Link
              href="/shop"
              className="inline-block bg-black text-white text-sm font-medium px-8 py-3 rounded-sm hover:bg-[#333] transition-colors"
            >
              Explore Collections
            </Link>
          </AnimatedSection>
        </div>
      </section>

      {/* Values Section */}
      <section className="bg-[#F9F9F9] border-t border-[#E5E5E5]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <AnimatedSection className="text-center mb-14">
            <p className="text-xs font-medium tracking-[0.3em] uppercase text-[#666666] mb-3">
              What We Stand For
            </p>
            <h2 className="text-4xl font-black text-[#1A1A1A]">Our Values</h2>
          </AnimatedSection>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {VALUES.map((value, idx) => (
              <AnimatedSection key={value.title} delay={idx * 0.1}>
                <motion.div
                  whileHover={{ y: -4, boxShadow: '0 8px 30px rgba(0,0,0,0.08)' }}
                  transition={{ duration: 0.2 }}
                  className="bg-white border border-[#E5E5E5] rounded-sm p-6 h-full"
                >
                  <div className="w-10 h-10 bg-[#1A1A1A] text-white rounded-sm flex items-center justify-center mb-4">
                    {value.icon}
                  </div>
                  <h3 className="text-base font-bold text-[#1A1A1A] mb-2">
                    {value.title}
                  </h3>
                  <p className="text-sm text-[#666666] leading-relaxed">
                    {value.description}
                  </p>
                </motion.div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
        <AnimatedSection className="text-center mb-14">
          <p className="text-xs font-medium tracking-[0.3em] uppercase text-[#666666] mb-3">
            The People Behind Wearix
          </p>
          <h2 className="text-4xl font-black text-[#1A1A1A]">Meet the Team</h2>
          <p className="text-[#666666] mt-3 max-w-xl mx-auto">
            A diverse group of thinkers, makers, and fashion lovers united by a common vision.
          </p>
        </AnimatedSection>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {TEAM.map((member, idx) => (
            <AnimatedSection key={member.name} delay={idx * 0.1}>
              <motion.div
                whileHover={{ y: -4 }}
                transition={{ duration: 0.2 }}
                className="bg-white border border-[#E5E5E5] rounded-sm p-6 text-center"
              >
                {/* Avatar with initials */}
                <div
                  className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-lg font-black ${member.color}`}
                >
                  {member.initials}
                </div>
                <h3 className="text-sm font-bold text-[#1A1A1A]">{member.name}</h3>
                <p className="text-xs text-[#666666] mt-1">{member.role}</p>
              </motion.div>
            </AnimatedSection>
          ))}
        </div>
      </section>

      {/* CTA Banner */}
      <section className="bg-[#1A1A1A] text-white">
        <AnimatedSection className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h2 className="text-3xl font-black mb-4">Ready to discover your style?</h2>
          <p className="text-white/60 mb-8 max-w-md mx-auto">
            Join over a million customers who trust Wearix for premium fashion.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/shop"
              className="bg-white text-black text-sm font-medium px-8 py-3 rounded-sm hover:bg-[#F0F0F0] transition-colors"
            >
              Shop Now
            </Link>
            <Link
              href="/contact"
              className="border border-white/30 text-white text-sm font-medium px-8 py-3 rounded-sm hover:bg-white/10 transition-colors"
            >
              Contact Us
            </Link>
          </div>
        </AnimatedSection>
      </section>
    </div>
  );
}
