export interface Product {
  id: number;
  name: string;
  category: 'Men' | 'Women' | 'Children';
  price: number;
  comparePrice: number;
  sizes: string[];
  colors: { hex: string; name: string }[];
  stock: number;
  images: string[];
  description: string;
  isFeatured: boolean;
  tags: string[];
  rating: number;
  reviewCount: number;
}

export const mockProducts: Product[] = [
  {
    id: 1,
    name: "Textured Knitted Shirt",
    category: "Men",
    price: 2999,
    comparePrice: 3999,
    sizes: ["S", "M", "L", "XL"],
    colors: [{ hex: "#1A1A1A", name: "Charcoal" }, { hex: "#E5E5E5", name: "Cream" }],
    stock: 85,
    images: [
      "https://framerusercontent.com/images/lvt1WlyrgirePb8z3BSlF9OY.jpg?width=800",
      "https://framerusercontent.com/images/dfydRQ0hineaQjqYigxtJ3UUI.jpg?width=800"
    ],
    description: "Premium textured knitted shirt designed for a clean silhouette. Features a polo-style collar, ribbed cuffs, and soft-touch woven knit fabric.",
    isFeatured: true,
    tags: ["knitted", "shirt", "new-arrivals", "casual"],
    rating: 4.8,
    reviewCount: 92
  },
  {
    id: 2,
    name: "Structured Trench Coat",
    category: "Women",
    price: 10499,
    comparePrice: 13999,
    sizes: ["XS", "S", "M", "L"],
    colors: [{ hex: "#C4A882", name: "Tan" }, { hex: "#1A1A1A", name: "Black" }],
    stock: 45,
    images: [
      "https://framerusercontent.com/images/eY6Dmvy1WrbgKmBxjcRhwuXCs.jpg?width=800",
      "https://framerusercontent.com/images/dfydRQ0hineaQjqYigxtJ3UUI.jpg?width=800"
    ],
    description: "Elegant, double-breasted trench coat with structured shoulders, a classic belt, and water-repellent lining. A timeless layering statement.",
    isFeatured: true,
    tags: ["coat", "trench", "new-arrivals", "outerwear"],
    rating: 4.9,
    reviewCount: 114
  },
  {
    id: 3,
    name: "Mini Denim Overalls",
    category: "Children",
    price: 2299,
    comparePrice: 2999,
    sizes: ["2T", "4T", "6", "8", "10"],
    colors: [{ hex: "#4682B4", name: "Classic Wash" }],
    stock: 60,
    images: [
      "https://framerusercontent.com/images/XKBImpA6SUFBTNUtQrmzAkMmj0.jpg?width=800",
      "https://framerusercontent.com/images/5KzsTe2EnPlNeHEEFMr7iGl8Q.jpg?width=800"
    ],
    description: "Playful mini denim overalls made from stretchable cotton denim. Designed with adjustable shoulder straps and utility pockets for active kids.",
    isFeatured: true,
    tags: ["kids", "overalls", "new-arrivals", "denim"],
    rating: 4.7,
    reviewCount: 48
  },
  {
    id: 4,
    name: "Riviera Collar Shirt",
    category: "Men",
    price: 3299,
    comparePrice: 4799,
    sizes: ["S", "M", "L", "XL"],
    colors: [{ hex: "#E5E5E5", name: "Off-White" }, { hex: "#4682B4", name: "Slate" }],
    stock: 75,
    images: [
      "https://framerusercontent.com/images/kanGnrYimBokWcnvmRshQIhToM.jpg?width=800",
      "https://framerusercontent.com/images/cUK0QrnnYh9fZ9CgITBVrpOVqbc.jpg?width=800"
    ],
    description: "Breathable linen-blend shirt featuring a relaxed Riviera collar and short sleeves. Designed for effortless warm-weather styling.",
    isFeatured: true,
    tags: ["linen", "shirt", "new-arrivals", "summer"],
    rating: 4.6,
    reviewCount: 79
  },
  {
    id: 5,
    name: "Stretch Jersey Tee",
    category: "Men",
    price: 1799,
    comparePrice: 2299,
    sizes: ["S", "M", "L", "XL", "XXL"],
    colors: [{ hex: "#FFFFFF", name: "White" }, { hex: "#1A1A1A", name: "Black" }, { hex: "#808080", name: "Gray" }],
    stock: 150,
    images: [
      "https://framerusercontent.com/images/m7vGnEDcM9ENme6wUOVRTjDCo.jpg?width=800",
      "https://framerusercontent.com/images/GfaKKpFbbr7OaFyCvPWaUE9M.jpg?width=800"
    ],
    description: "Premium stretch cotton jersey tee with a modern fitted cut. Breathable, sweat-wicking, and incredibly soft for daily wear.",
    isFeatured: true,
    tags: ["tee", "jersey", "new-arrivals", "basics"],
    rating: 4.5,
    reviewCount: 130
  },
  {
    id: 6,
    name: "Urban Utility Cargo",
    category: "Men",
    price: 4499,
    comparePrice: 5999,
    sizes: ["S", "M", "L", "XL"],
    colors: [{ hex: "#556B2F", name: "Olive" }, { hex: "#1A1A1A", name: "Black" }],
    stock: 95,
    images: [
      "https://framerusercontent.com/images/5kuNHZXwFk1bRFFCgtwzxcvg.png?width=800",
      "https://framerusercontent.com/images/srFy8sCNq5IkDCNHign0ZVGFg.jpg?width=800"
    ],
    description: "Rugged cargo pants styled for modern utility. Crafted from durable cotton ripstop with clean cargo side-pockets and tapered ankles.",
    isFeatured: true,
    tags: ["cargo", "pants", "new-arrivals", "utility"],
    rating: 4.7,
    reviewCount: 65
  },
  {
    id: 7,
    name: "Classic Boxy Tee",
    category: "Women",
    price: 1799,
    comparePrice: 2299,
    sizes: ["XS", "S", "M", "L"],
    colors: [{ hex: "#FFFFFF", name: "White" }, { hex: "#D2B48C", name: "Tan" }],
    stock: 120,
    images: [
      "https://framerusercontent.com/images/eZoLuRRyYkwjVZaofIyewyScswc.jpg?width=800",
      "https://framerusercontent.com/images/WOb9Yp9Wh2uVGLxsCjRDhswPSk.png?width=800"
    ],
    description: "Relaxed boxy-fit tee featuring a heavyweight cotton weave, dropped shoulders, and a clean crew neckline.",
    isFeatured: true,
    tags: ["tee", "boxy", "new-arrivals", "basics"],
    rating: 4.6,
    reviewCount: 88
  },
  {
    id: 8,
    name: "Pleated Smart Trousers",
    category: "Men",
    price: 3799,
    comparePrice: 4999,
    sizes: ["S", "M", "L", "XL"],
    colors: [{ hex: "#4A4A4A", name: "Slate Grey" }, { hex: "#1A1A1A", name: "Black" }],
    stock: 80,
    images: [
      "https://framerusercontent.com/images/dw0YCuifIa91zywXckPrBHJmk.webp?width=800",
      "https://framerusercontent.com/images/7ubgMQu9djFMVIvDIXChqxrUQcQ.jpg?width=800"
    ],
    description: "Tailored smart trousers with a relaxed pleated front and a cropped ankle design. Blends high-end aesthetics with everyday comfort.",
    isFeatured: true,
    tags: ["trousers", "smart", "new-arrivals", "office"],
    rating: 4.7,
    reviewCount: 72
  },
  {
    id: 9,
    name: "French Terry Shorts",
    category: "Men",
    price: 1999,
    comparePrice: 2799,
    sizes: ["S", "M", "L", "XL"],
    colors: [{ hex: "#D2B48C", name: "Sand" }, { hex: "#808080", name: "Gray" }],
    stock: 110,
    images: [
      "https://framerusercontent.com/images/7J7eSRwqb6hQlWc1WH1nwv01II.webp?width=800",
      "https://framerusercontent.com/images/IEfg9X5HmPz0q0vEgmXVpAGMTT8.png?width=800"
    ],
    description: "Cozy sweat-shorts made from heavyweight French terry cotton. Features an elastic waistband, metal-tipped drawstrings, and deep pockets.",
    isFeatured: true,
    tags: ["shorts", "terry", "new-arrivals", "lounge"],
    rating: 4.5,
    reviewCount: 54
  },
  {
    id: 10,
    name: "Heavyweight Oversized Hoodie",
    category: "Men",
    price: 4299,
    comparePrice: 5499,
    sizes: ["S", "M", "L", "XL", "XXL"],
    colors: [{ hex: "#1A1A1A", name: "Black" }, { hex: "#C4A882", name: "Camel" }],
    stock: 100,
    images: [
      "https://framerusercontent.com/images/GTy2Bbh36uTYPS8F34SC1dV1cI.jpg?width=800",
      "https://framerusercontent.com/images/XHQtokxpBrRieMyXVFgUTB7KS0.jpg?width=800"
    ],
    description: "Ultra-thick oversized hoodie designed with a structured hood, dropped shoulders, and premium ribbed hem. The ultimate cozy essential.",
    isFeatured: true,
    tags: ["hoodie", "heavyweight", "best-sellers", "winter"],
    rating: 4.9,
    reviewCount: 215
  },
  {
    id: 11,
    name: "Patterned Knit Sweater",
    category: "Men",
    price: 5499,
    comparePrice: 7299,
    sizes: ["S", "M", "L", "XL"],
    colors: [{ hex: "#D2B48C", name: "Patterned Beige" }],
    stock: 55,
    images: [
      "https://framerusercontent.com/images/Dh3OA7nlrSTKU7GkFh7IpzC704M.png?width=800",
      "https://framerusercontent.com/images/XHQtokxpBrRieMyXVFgUTB7KS0.jpg?width=800"
    ],
    description: "Cozy jacquard knit sweater featuring a vintage patterned layout, crewneck collar, and warm wool-blend construction.",
    isFeatured: true,
    tags: ["sweater", "knit", "best-sellers", "winter"],
    rating: 4.8,
    reviewCount: 140
  },
  {
    id: 12,
    name: "Quilted Bomber Jacket",
    category: "Men",
    price: 7299,
    comparePrice: 8999,
    sizes: ["S", "M", "L", "XL", "XXL"],
    colors: [{ hex: "#1A1A1A", name: "Black" }, { hex: "#556B2F", name: "Olive" }],
    stock: 40,
    images: [
      "https://framerusercontent.com/images/UBz7Wqq5xr8G3Dd1Gqsc3otaozI.webp?width=800",
      "https://framerusercontent.com/images/5n60PDud9wC2hKZ67RqkdLdEnOM.png?width=800"
    ],
    description: "Water-resistant quilted bomber jacket with poly-fill insulation, zip sleeve utility pocket, and clean athletic ribbing.",
    isFeatured: true,
    tags: ["jacket", "bomber", "best-sellers", "outerwear"],
    rating: 4.8,
    reviewCount: 165
  },
  {
    id: 13,
    name: "Hooded Puffer Vest",
    category: "Men",
    price: 3799,
    comparePrice: 4799,
    sizes: ["S", "M", "L", "XL"],
    colors: [{ hex: "#C4A882", name: "Khaki" }, { hex: "#1A1A1A", name: "Black" }],
    stock: 65,
    images: [
      "https://framerusercontent.com/images/VelxipZlAypDaKEGR9UWVL51G0.png?width=800",
      "https://framerusercontent.com/images/wtLmzE2wAi9yJrXcWCnR857MSwQ.jpg?width=800"
    ],
    description: "Sleek down-insulated puffer vest with a high-neck collar, adjustable hood, and zippered fleece-lined hand pockets.",
    isFeatured: true,
    tags: ["vest", "puffer", "best-sellers", "winter"],
    rating: 4.7,
    reviewCount: 95
  },
  {
    id: 14,
    name: "Vegan Leather Leggings",
    category: "Women",
    price: 4999,
    comparePrice: 5999,
    sizes: ["XS", "S", "M", "L"],
    colors: [{ hex: "#1A1A1A", name: "Black" }],
    stock: 50,
    images: [
      "https://framerusercontent.com/images/7zAqtP593wdouaqYoeCcOQ86zM.jpg?width=800",
      "https://framerusercontent.com/images/XlozFfsresg9IzMgSZFB3KFT1lg.png?width=800"
    ],
    description: "High-waist leggings crafted from buttery-soft vegan leather. Features clean stitch panels and a sleek comfortable stretch waistband.",
    isFeatured: true,
    tags: ["leggings", "leather", "best-sellers", "chic"],
    rating: 4.9,
    reviewCount: 188
  },
  {
    id: 15,
    name: "Cropped Boxy Blazer",
    category: "Women",
    price: 6499,
    comparePrice: 8799,
    sizes: ["XS", "S", "M", "L"],
    colors: [{ hex: "#E5E5E5", name: "Cream" }, { hex: "#1A1A1A", name: "Black" }],
    stock: 35,
    images: [
      "https://framerusercontent.com/images/Yg7heWlymsUl0XNuDnDMxv1ndQ.jpg?width=800",
      "https://framerusercontent.com/images/ycSkGEOzXXNIxBrt6AdcjgVnQgE.jpg?width=800"
    ],
    description: "Chic cropped blazer with structured shoulders, dynamic boxy fit, and single button fastening. Pairs perfectly with high-waist denim.",
    isFeatured: true,
    tags: ["blazer", "cropped", "best-sellers", "office"],
    rating: 4.9,
    reviewCount: 150
  }
];
