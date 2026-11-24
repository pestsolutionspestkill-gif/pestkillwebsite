// Blog post list used for page titles, descriptions, the sitemap and article structured data.
// Keep in step with the posts in pages/Blog.jsx and pages/BlogDetail.jsx.
export const BLOG_INDEX = [
  {
    slug: "anti-termite-piping-treatment",
    title: "Anti-Termite Piping Treatment using Porous Pipes (Pre-Construction)",
    excerpt: "Learn about the most effective pre-construction termite treatment method that provides 10-15 years of protection.",
    category: "Termite Control",
    date: "2026-04-20"
  },
  {
    slug: "termite-prevention-tips",
    title: "10 Effective Termite Prevention Tips for Your Home",
    excerpt: "Learn how to protect your home from termite infestations with these proven prevention methods.",
    category: "Termite Control",
    date: "2026-01-15"
  },
  {
    slug: "why-cockroaches-in-home",
    title: "Why Do Cockroaches Invade Your Home?",
    excerpt: "Understanding the causes of cockroach infestations and how to prevent them.",
    category: "Cockroach Control",
    date: "2026-01-12"
  },
  {
    slug: "rodent-dangers-health",
    title: "Health Dangers of Rodent Infestations",
    excerpt: "Rats and mice can spread serious diseases. Learn about the health risks.",
    category: "Rodent Control",
    date: "2026-01-10"
  },
  {
    slug: "bed-bugs-signs",
    title: "How to Identify Bed Bug Infestations Early",
    excerpt: "Spot the warning signs of bed bugs before they spread.",
    category: "Bed Bugs",
    date: "2026-01-08"
  },
  {
    slug: "monsoon-pest-control",
    title: "Monsoon Pest Control: Essential Guide",
    excerpt: "Rainy season brings increased pest activity. Protect your home now.",
    category: "Seasonal",
    date: "2026-01-05"
  },
  {
    slug: "kitchen-pest-prevention",
    title: "Kitchen Pest Prevention Guide",
    excerpt: "Keep your kitchen pest-free with these simple tips.",
    category: "Prevention",
    date: "2026-01-03"
  },
  {
    slug: "office-pest-control",
    title: "Office Pest Control: A Complete Guide",
    excerpt: "Maintain a pest-free workplace with these professional tips.",
    category: "Commercial",
    date: "2025-12-28"
  },
  {
    slug: "pest-control-warehouse",
    title: "Warehouse Pest Management Guide",
    excerpt: "Industrial pest control solutions for warehouses and factories.",
    category: "Commercial",
    date: "2025-12-25"
  },
  {
    slug: "home-hygiene-tips",
    title: "Home Hygiene Tips to Prevent Pests",
    excerpt: "Essential cleaning habits that keep pests away.",
    category: "Prevention",
    date: "2025-12-22"
  },
  {
    slug: "natural-pest-control",
    title: "Natural vs Chemical Pest Control",
    excerpt: "Compare organic and chemical pest control methods for your home.",
    category: "Prevention",
    date: "2025-12-20"
  },
  {
    slug: "pest-control-questions",
    title: "15 Questions About Pest Control - Answered",
    excerpt: "Expert answers to the most commonly asked pest control questions.",
    category: "FAQ",
    date: "2025-12-18"
  },
  {
    slug: "restaurant-pest-control",
    title: "Restaurant Pest Control: Complete Guide",
    excerpt: "Food safety and pest management for restaurants.",
    category: "Commercial",
    date: "2025-12-15"
  },
  {
    slug: "pest-control-warranty",
    title: "Understanding Pest Control Warranty Options",
    excerpt: "What warranty means and why it matters for your protection.",
    category: "Guide",
    date: "2025-12-12"
  },
  {
    slug: "seasonal-pest-calendar",
    title: "Seasonal Pest Calendar: Year-Round Protection",
    excerpt: "Know when each pest type is most active throughout the year.",
    category: "Seasonal",
    date: "2025-12-10"
  },
  {
    slug: "pest-control-costs",
    title: "Pest Control Services: What to Expect to Pay",
    excerpt: "Transparent pricing guide for pest control services.",
    category: "Guide",
    date: "2025-12-08"
  }
];

export const getBlogMeta = (slug) => BLOG_INDEX.find((p) => p.slug === slug);
