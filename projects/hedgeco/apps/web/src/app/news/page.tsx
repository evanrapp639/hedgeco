"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Search, 
  Clock, 
  User, 
  ArrowRight, 
  ChevronLeft, 
  ChevronRight,
  TrendingUp,
  Scale,
  Building2,
  Newspaper
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

type Category = "all" | "market" | "regulatory" | "industry" | "hedgeco";

interface Article {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category: Category;
  author: {
    name: string;
    avatar?: string;
  };
  publishedAt: Date;
  readTime: number;
  image: string;
  featured?: boolean;
}

const categoryConfig: Record<Category, { label: string; icon: React.ElementType; color: string }> = {
  all: { label: "All", icon: Newspaper, color: "bg-slate-100 text-slate-700" },
  market: { label: "Market", icon: TrendingUp, color: "bg-blue-100 text-blue-700" },
  regulatory: { label: "Regulatory", icon: Scale, color: "bg-amber-100 text-amber-700" },
  industry: { label: "Industry", icon: Building2, color: "bg-emerald-100 text-emerald-700" },
  hedgeco: { label: "HedgeCo Updates", icon: Newspaper, color: "bg-indigo-100 text-indigo-700" },
};

// Mock articles data
const mockArticles: Article[] = [
  {
    id: "1",
    slug: "fed-rate-decision-market-impact-2024",
    title: "Federal Reserve Rate Decision: What It Means for Hedge Funds in 2024",
    excerpt: "The Federal Reserve's latest rate decision has significant implications for alternative investment strategies. Our analysis breaks down the key takeaways for fund managers.",
    category: "market",
    author: { name: "Sarah Chen", avatar: "/avatars/sarah.jpg" },
    publishedAt: new Date("2024-02-15"),
    readTime: 8,
    image: "/images/news/fed-rates.jpg",
    featured: true,
  },
  {
    id: "2",
    slug: "sec-private-fund-regulations-2024",
    title: "SEC Finalizes New Private Fund Regulations: Complete Guide",
    excerpt: "The Securities and Exchange Commission has finalized sweeping new regulations for private funds. Here's what every fund manager needs to know.",
    category: "regulatory",
    author: { name: "Michael Ross" },
    publishedAt: new Date("2024-02-14"),
    readTime: 12,
    image: "/images/news/sec-regs.jpg",
    featured: true,
  },
  {
    id: "3",
    slug: "ai-quantitative-trading-revolution",
    title: "How AI is Revolutionizing Quantitative Trading Strategies",
    excerpt: "Machine learning and artificial intelligence are transforming how quant funds develop and execute trading strategies. A deep dive into the technology reshaping the industry.",
    category: "industry",
    author: { name: "David Park" },
    publishedAt: new Date("2024-02-13"),
    readTime: 10,
    image: "/images/news/ai-trading.jpg",
  },
  {
    id: "4",
    slug: "hedgeco-platform-updates-february",
    title: "HedgeCo Platform Updates: Enhanced Analytics and New Features",
    excerpt: "We're excited to announce major platform updates including improved analytics dashboards, enhanced fund comparison tools, and more.",
    category: "hedgeco",
    author: { name: "HedgeCo Team" },
    publishedAt: new Date("2024-02-12"),
    readTime: 5,
    image: "/images/news/platform-update.jpg",
  },
  {
    id: "5",
    slug: "global-macro-outlook-q1-2024",
    title: "Global Macro Outlook: Navigating Uncertainty in Q1 2024",
    excerpt: "Geopolitical tensions and economic indicators point to a volatile quarter ahead. Expert insights on positioning your portfolio.",
    category: "market",
    author: { name: "Emma Thompson" },
    publishedAt: new Date("2024-02-11"),
    readTime: 7,
    image: "/images/news/global-macro.jpg",
  },
  {
    id: "6",
    slug: "esg-compliance-hedge-funds",
    title: "ESG Compliance for Hedge Funds: Meeting New Standards",
    excerpt: "Environmental, Social, and Governance criteria are becoming mandatory for institutional investors. How hedge funds are adapting.",
    category: "regulatory",
    author: { name: "James Wilson" },
    publishedAt: new Date("2024-02-10"),
    readTime: 9,
    image: "/images/news/esg.jpg",
  },
  {
    id: "7",
    slug: "crypto-hedge-funds-institutional-adoption",
    title: "Crypto Hedge Funds See Record Institutional Inflows",
    excerpt: "Bitcoin ETF approval has triggered a wave of institutional interest in crypto-focused hedge funds. Analysis of the trend.",
    category: "industry",
    author: { name: "Alex Kim" },
    publishedAt: new Date("2024-02-09"),
    readTime: 6,
    image: "/images/news/crypto.jpg",
  },
  {
    id: "8",
    slug: "hedgeco-conference-announcement-2024",
    title: "Announcing HedgeCo Connect 2024: The Premier Industry Event",
    excerpt: "Save the date for HedgeCo Connect 2024 in Miami. Network with industry leaders, attend exclusive sessions, and discover new opportunities.",
    category: "hedgeco",
    author: { name: "HedgeCo Team" },
    publishedAt: new Date("2024-02-08"),
    readTime: 4,
    image: "/images/news/conference.jpg",
  },
];

const ARTICLES_PER_PAGE = 6;

export default function NewsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<Category>("all");
  const [currentPage, setCurrentPage] = useState(1);

  // Filter articles
  const filteredArticles = mockArticles.filter((article) => {
    const matchesSearch = article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || article.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Separate featured and regular articles
  const featuredArticles = filteredArticles.filter(a => a.featured);
  const regularArticles = filteredArticles.filter(a => !a.featured);

  // Pagination
  const totalPages = Math.ceil(regularArticles.length / ARTICLES_PER_PAGE);
  const paginatedArticles = regularArticles.slice(
    (currentPage - 1) * ARTICLES_PER_PAGE,
    currentPage * ARTICLES_PER_PAGE
  );

  const CategoryBadge = ({ category }: { category: Category }) => {
    const config = categoryConfig[category];
    return (
      <Badge className={cn("font-medium", config.color)}>
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">News & Insights</h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Stay informed with the latest market analysis, regulatory updates, 
            and industry trends from HedgeCo's expert team.
          </p>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search articles..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-10"
            />
          </div>
          
          <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
            {(Object.keys(categoryConfig) as Category[]).map((cat) => {
              const config = categoryConfig[cat];
              const Icon = config.icon;
              return (
                <Button
                  key={cat}
                  variant={selectedCategory === cat ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setSelectedCategory(cat);
                    setCurrentPage(1);
                  }}
                  className="whitespace-nowrap"
                >
                  <Icon className="h-4 w-4 mr-1" />
                  {config.label}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Featured Articles */}
        {featuredArticles.length > 0 && currentPage === 1 && selectedCategory === "all" && !searchQuery && (
          <div className="mb-12">
            <h2 className="text-xl font-semibold text-slate-900 mb-6">Featured</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {featuredArticles.map((article) => (
                <Link key={article.id} href={`/news/${article.slug}`}>
                  <Card className="group overflow-hidden hover:shadow-xl transition-all duration-300 h-full">
                    <div className="relative h-48 bg-gradient-to-br from-indigo-500 to-purple-600">
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors" />
                      <div className="absolute bottom-4 left-4">
                        <CategoryBadge category={article.category} />
                      </div>
                    </div>
                    <CardContent className="p-6">
                      <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-indigo-600 transition-colors line-clamp-2">
                        {article.title}
                      </h3>
                      <p className="text-slate-600 mb-4 line-clamp-2">
                        {article.excerpt}
                      </p>
                      <div className="flex items-center justify-between text-sm text-slate-500">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          <span>{article.author.name}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span>{format(article.publishedAt, "MMM d, yyyy")}</span>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span>{article.readTime} min</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Article Grid */}
        <div className="mb-8">
          {(featuredArticles.length > 0 && currentPage === 1 && selectedCategory === "all" && !searchQuery) && (
            <h2 className="text-xl font-semibold text-slate-900 mb-6">Latest Articles</h2>
          )}
          
          {paginatedArticles.length === 0 ? (
            <div className="text-center py-12">
              <Newspaper className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <p className="text-lg text-slate-600">No articles found</p>
              <p className="text-sm text-slate-500 mt-1">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedArticles.map((article) => (
                <Link key={article.id} href={`/news/${article.slug}`}>
                  <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300 h-full flex flex-col">
                    <div className="relative h-40 bg-gradient-to-br from-slate-200 to-slate-300">
                      <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors" />
                      <div className="absolute bottom-3 left-3">
                        <CategoryBadge category={article.category} />
                      </div>
                    </div>
                    <CardContent className="p-5 flex-1 flex flex-col">
                      <h3 className="text-lg font-semibold text-slate-900 mb-2 group-hover:text-indigo-600 transition-colors line-clamp-2">
                        {article.title}
                      </h3>
                      <p className="text-sm text-slate-600 mb-4 line-clamp-2 flex-1">
                        {article.excerpt}
                      </p>
                      <div className="flex items-center justify-between text-xs text-slate-500 mt-auto">
                        <span>{article.author.name}</span>
                        <div className="flex items-center gap-3">
                          <span>{format(article.publishedAt, "MMM d")}</span>
                          <span>{article.readTime} min read</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                variant={currentPage === page ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentPage(page)}
                className="w-10"
              >
                {page}
              </Button>
            ))}
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
