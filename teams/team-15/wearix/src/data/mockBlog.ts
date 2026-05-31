export interface BlogPost {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  author: string;
  authorRole: string;
  date: string;
  readTime: string;
  image: string;
  tags: string[];
}

export const mockBlogPosts: BlogPost[] = [
  {
    id: 1,
    slug: "spring-summer-2026-trends",
    title: "Spring/Summer 2026: The Trends You Need to Know",
    excerpt: "From oversized silhouettes to bold color blocking, discover what's dominating runways this season.",
    content: `The fashion world is buzzing with excitement as Spring/Summer 2026 collections hit the runways. This season is all about bold self-expression, sustainable choices, and comfort-first designs that don't sacrifice style.\n\nOversize silhouettes continue their reign, with flowing linen shirts and relaxed trousers taking center stage. Color blocking is making a massive comeback — think contrasting panels in unexpected combinations like sage green and burnt orange.\n\nSustainability is no longer a trend but a necessity. Brands are leaning into organic cotton, recycled fabrics, and transparent supply chains. At Wearix, all our new arrivals feature our eco-certified materials tag.\n\nThe "quiet luxury" aesthetic that dominated 2025 is evolving into what critics call "expressive minimalism" — clean lines, premium materials, but with a subtle pop of personality through texture or cut.`,
    category: "Trends",
    author: "Emma Clarke",
    authorRole: "Fashion Editor",
    date: "2026-05-25",
    readTime: "4 min read",
    image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800&q=80",
    tags: ["trends", "spring", "fashion"]
  },
  {
    id: 2,
    slug: "sustainable-fashion-guide",
    title: "Your Complete Guide to Building a Sustainable Wardrobe",
    excerpt: "Learn how to make eco-conscious fashion choices without compromising on style or your budget.",
    content: `Building a sustainable wardrobe doesn't mean sacrificing style — it means making smarter, longer-lasting choices. Here's how to get started.\n\nStart with a capsule wardrobe audit. Look at what you already own and identify versatile pieces that can be mixed and matched. Quality over quantity is the golden rule.\n\nWhen shopping new, look for certifications like GOTS (organic cotton), Fair Trade, or B Corp. At Wearix, we've partnered with certified manufacturers who meet strict environmental and social standards.\n\nCare matters too. Washing clothes at lower temperatures, air drying, and mending small repairs can dramatically extend the life of your garments.`,
    category: "Sustainability",
    author: "James Park",
    authorRole: "Sustainability Director",
    date: "2026-05-20",
    readTime: "6 min read",
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80",
    tags: ["sustainability", "eco-fashion", "guide"]
  },
  {
    id: 3,
    slug: "how-to-style-linen",
    title: "5 Ways to Style Linen This Summer",
    excerpt: "Linen is the ultimate summer fabric. Here's how to wear it from beach to boardroom.",
    content: `Linen has had a full fashion renaissance, and for good reason. It's breathable, gets better with age, and now comes in cuts that work for every occasion.\n\n1. **The Classic Shirt Dress**: Grab an oversized linen shirt and belt it at the waist. Pair with strappy sandals for an effortlessly chic look.\n\n2. **Smart Casual**: Linen trousers with a fitted tee and clean sneakers. Simple, modern, perfect.\n\n3. **Beach to Bar**: A linen co-ord set transitions beautifully from daytime beach activities to evening cocktails.\n\n4. **Layered Look**: A linen blazer over a simple white tee adds structure without the heat.\n\n5. **Weekend Comfort**: Relaxed linen joggers and an oversized linen tee — comfort is the new luxury.`,
    category: "Style Guide",
    author: "Sophie Laurent",
    authorRole: "Senior Stylist",
    date: "2026-05-15",
    readTime: "3 min read",
    image: "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=800&q=80",
    tags: ["linen", "styling", "summer"]
  },
  {
    id: 4,
    slug: "kids-fashion-school-year",
    title: "Back to School: Dressing Kids for Confidence",
    excerpt: "Help your little ones start the school year with styles that keep up with their active lives.",
    content: `The new school year is around the corner, and finding clothes that are durable, comfortable, and style-approved by the kids themselves is always a challenge.\n\nPrioritize movement-friendly fabrics. Kids are active — they need clothes that stretch, breathe, and withstand the playground. Our children's collection uses soft cotton blends that are machine washable and built to last.\n\nLet kids have a voice in their wardrobe choices. Studies show that when children feel confident in their clothing, it positively impacts their mood and self-expression. Our graphic tees and colorful hoodies let personality shine through.\n\nInvest in quality basics. A well-made pair of joggers or a sturdy hoodie will last the entire school year and beyond.`,
    category: "Kids",
    author: "Maria Santos",
    authorRole: "Children's Wear Specialist",
    date: "2026-05-10",
    readTime: "4 min read",
    image: "https://images.unsplash.com/photo-1503944583220-79d8926ad5e2?w=800&q=80",
    tags: ["kids", "back-to-school", "fashion"]
  },
  {
    id: 5,
    slug: "capsule-wardrobe-2026",
    title: "The Perfect Capsule Wardrobe for 2026",
    excerpt: "Fewer pieces, more outfits. Here's how to build a wardrobe that works harder for you.",
    content: `A capsule wardrobe is about curating a collection of versatile, high-quality pieces that mix and match effortlessly. The goal: maximum outfits, minimum clutter.\n\n**The Foundation (10 pieces):**\n- 2 quality white tees\n- 1 classic denim jacket\n- 1 tailored blazer (black or navy)\n- 2 pairs of well-fitting trousers\n- 1 pair of dark wash jeans\n- 1 versatile dress\n- 1 cozy sweater\n- 1 button-down shirt\n\nWith these 10 pieces alone, you can create over 40 unique outfits. Add seasonal pieces and accessories to expand further.`,
    category: "Style Guide",
    author: "Emma Clarke",
    authorRole: "Fashion Editor",
    date: "2026-05-05",
    readTime: "5 min read",
    image: "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=800&q=80",
    tags: ["capsule-wardrobe", "minimalism", "guide"]
  },
  {
    id: 6,
    slug: "wearix-brand-story",
    title: "The Story Behind Wearix: A Decade of Modern Style",
    excerpt: "From a small studio in 2014 to a global fashion destination — the Wearix journey.",
    content: `Wearix was born in 2014 with a simple vision: create clothing that's both beautiful and built to last. Founder Alex Kim launched the brand with just 12 pieces and a commitment to ethical manufacturing.\n\n"I was frustrated by fast fashion — clothes that fell apart after three washes and brands that didn't care about their workers or the environment," Alex recalls. "I wanted to prove that you could build a fashion brand that did things differently."\n\nOver the next decade, Wearix grew from a small online store to a globally recognized brand, all while maintaining the core values that started it all: quality materials, fair wages, and designs that transcend seasonal trends.\n\nToday, Wearix serves customers in over 40 countries, with a team of 200+ dedicated to bringing you the best in modern, mindful fashion.`,
    category: "Brand",
    author: "Alex Kim",
    authorRole: "Founder & CEO",
    date: "2026-04-28",
    readTime: "7 min read",
    image: "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=800&q=80",
    tags: ["brand-story", "wearix", "founder"]
  },
  {
    id: 7,
    slug: "color-psychology-fashion",
    title: "The Psychology of Color in Fashion",
    excerpt: "How the colors you wear influence mood, perception, and confidence.",
    content: `Color is one of the most powerful tools in fashion — not just for aesthetics, but for psychology. The colors you choose to wear can influence how you feel and how others perceive you.\n\n**Black**: Conveys authority, sophistication, and timelessness. Perfect for professional settings or when you want to make a strong impression.\n\n**White**: Signals cleanliness, simplicity, and new beginnings. Great for summer and creating a fresh, approachable look.\n\n**Navy**: The color of trust and confidence. It's the professional's alternative to black — equally powerful but slightly more approachable.\n\n**Earth tones**: Camel, beige, and terracotta signal warmth, stability, and a connection to nature. These tones are incredibly flattering across skin tones.`,
    category: "Style Guide",
    author: "Dr. Nina Russo",
    authorRole: "Fashion Psychologist",
    date: "2026-04-20",
    readTime: "5 min read",
    image: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800&q=80",
    tags: ["color", "psychology", "style"]
  },
  {
    id: 8,
    slug: "care-for-your-clothes",
    title: "How to Make Your Clothes Last: A Care Guide",
    excerpt: "Proper garment care can triple the life of your favorite pieces. Here's everything you need to know.",
    content: `The most sustainable garment is the one you already own. With proper care, your favorite pieces can last years — even decades.\n\n**Washing Tips:**\n- Always check the care label first\n- Wash at lower temperatures (30°C for most items)\n- Turn dark clothes inside out to prevent fading\n- Use a mesh laundry bag for delicates\n\n**Drying:**\n- Air dry whenever possible — it's gentler on fabric and saves energy\n- Lay knitwear flat to dry to prevent stretching\n- Avoid direct sunlight for colored fabrics\n\n**Storage:**\n- Fold knitwear rather than hanging to prevent shoulder bumps\n- Use cedar blocks instead of mothballs\n- Store seasonal items in breathable cotton bags`,
    category: "Care",
    author: "James Park",
    authorRole: "Sustainability Director",
    date: "2026-04-12",
    readTime: "4 min read",
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80",
    tags: ["care", "sustainability", "maintenance"]
  }
];
