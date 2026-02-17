"use client";

import { use } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ArrowLeft,
  Clock,
  Calendar,
  Share2,
  Twitter,
  Linkedin,
  Facebook,
  Link2,
  MessageCircle,
  ThumbsUp,
  BookmarkPlus,
  TrendingUp,
  Scale,
  Building2,
  Newspaper,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

type Category = "market" | "regulatory" | "industry" | "hedgeco";

const categoryConfig: Record<Category, { label: string; icon: React.ElementType; color: string }> = {
  market: { label: "Market", icon: TrendingUp, color: "bg-blue-100 text-blue-700" },
  regulatory: { label: "Regulatory", icon: Scale, color: "bg-amber-100 text-amber-700" },
  industry: { label: "Industry", icon: Building2, color: "bg-emerald-100 text-emerald-700" },
  hedgeco: { label: "HedgeCo Updates", icon: Newspaper, color: "bg-indigo-100 text-indigo-700" },
};

// Mock article data - in production, this would be fetched
const getArticle = (slug: string) => ({
  id: "1",
  slug,
  title: "Federal Reserve Rate Decision: What It Means for Hedge Funds in 2024",
  excerpt: "The Federal Reserve's latest rate decision has significant implications for alternative investment strategies.",
  category: "market" as Category,
  author: {
    name: "Sarah Chen",
    title: "Senior Market Analyst",
    avatar: "/avatars/sarah.jpg",
    bio: "Sarah Chen is a senior market analyst at HedgeCo with over 15 years of experience covering global macro trends and alternative investments.",
  },
  publishedAt: new Date("2024-02-15"),
  updatedAt: new Date("2024-02-15"),
  readTime: 8,
  content: `
## Executive Summary

The Federal Reserve's decision to maintain interest rates at their current level signals a cautious approach to monetary policy that will have far-reaching implications for hedge fund strategies in 2024.

## Key Takeaways

### 1. Rate Environment Implications

The current rate environment creates both challenges and opportunities for alternative investment managers:

- **Fixed Income Strategies**: Higher-for-longer rates continue to benefit absolute return fixed income strategies, particularly those focused on credit and structured products.
- **Equity Long/Short**: Market dispersion remains elevated, creating favorable conditions for stock pickers.
- **Global Macro**: Currency volatility presents opportunities for macro funds with strong FX capabilities.

### 2. Portfolio Positioning Considerations

Fund managers should consider the following positioning adjustments:

> "The era of easy money is clearly behind us. Managers who can generate alpha through skill rather than beta exposure will be rewarded." — Industry Expert

**Duration Management**
With the yield curve dynamics shifting, careful duration management becomes critical. Short-duration strategies may outperform in the near term.

**Credit Quality**
Higher rates increase refinancing risk for leveraged borrowers. A focus on quality should remain paramount.

### 3. Sector Opportunities

Several sectors stand to benefit from the current environment:

1. **Financial Services**: Banks benefit from higher net interest margins
2. **Healthcare**: Defensive characteristics and innovation pipeline
3. **Energy**: Structural demand drivers and capital discipline
4. **Technology**: AI-driven efficiency gains offsetting rate pressure

## Looking Ahead

The Fed's data-dependent approach suggests continued volatility in rate expectations. Hedge funds should maintain flexibility in their positioning while focusing on fundamental research and risk management.

### Recommended Actions

For institutional investors evaluating hedge fund allocations:

- Prioritize managers with demonstrated skill in the current environment
- Consider increasing allocation to market-neutral strategies
- Maintain adequate liquidity reserves
- Review counterparty risk exposures

## Conclusion

While the rate environment presents challenges, well-positioned hedge funds with strong risk management frameworks are poised to deliver attractive risk-adjusted returns in 2024.
  `,
});

const relatedArticles = [
  {
    id: "2",
    slug: "sec-private-fund-regulations-2024",
    title: "SEC Finalizes New Private Fund Regulations: Complete Guide",
    category: "regulatory" as Category,
    publishedAt: new Date("2024-02-14"),
    readTime: 12,
  },
  {
    id: "3",
    slug: "ai-quantitative-trading-revolution",
    title: "How AI is Revolutionizing Quantitative Trading Strategies",
    category: "industry" as Category,
    publishedAt: new Date("2024-02-13"),
    readTime: 10,
  },
  {
    id: "5",
    slug: "global-macro-outlook-q1-2024",
    title: "Global Macro Outlook: Navigating Uncertainty in Q1 2024",
    category: "market" as Category,
    publishedAt: new Date("2024-02-11"),
    readTime: 7,
  },
];

export default function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const article = getArticle(slug);
  const config = categoryConfig[article.category];

  const handleShare = (platform: string) => {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(article.title);
    
    const urls: Record<string, string> = {
      twitter: `https://twitter.com/intent/tweet?url=${url}&text=${text}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
    };
    
    if (platform === "copy") {
      navigator.clipboard.writeText(window.location.href);
      alert("Link copied to clipboard!");
    } else {
      window.open(urls[platform], "_blank", "width=600,height=400");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Back Link */}
        <Link href="/news">
          <Button variant="ghost" className="mb-6 -ml-2">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to News
          </Button>
        </Link>

        {/* Article Header */}
        <article>
          <header className="mb-8">
            <Badge className={cn("mb-4", config.color)}>
              {config.label}
            </Badge>
            
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4 leading-tight">
              {article.title}
            </h1>
            
            <p className="text-xl text-slate-600 mb-6">
              {article.excerpt}
            </p>
            
            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
              <div className="flex items-center gap-2">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={article.author.avatar} />
                  <AvatarFallback>{article.author.name.split(" ").map(n => n[0]).join("")}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium text-slate-900">{article.author.name}</div>
                  <div className="text-xs text-slate-500">{article.author.title}</div>
                </div>
              </div>
              
              <Separator orientation="vertical" className="h-8" />
              
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>{format(article.publishedAt, "MMMM d, yyyy")}</span>
              </div>
              
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{article.readTime} min read</span>
              </div>
            </div>
          </header>

          {/* Hero Image Placeholder */}
          <div className="relative h-64 md:h-96 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 mb-8 overflow-hidden">
            <div className="absolute inset-0 bg-black/20" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-white/50 text-lg">Article Cover Image</span>
            </div>
          </div>

          {/* Social Share Bar */}
          <div className="flex items-center justify-between py-4 border-y border-slate-200 mb-8">
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500 mr-2">Share:</span>
              <Button variant="ghost" size="icon" onClick={() => handleShare("twitter")}>
                <Twitter className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => handleShare("linkedin")}>
                <Linkedin className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => handleShare("facebook")}>
                <Facebook className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => handleShare("copy")}>
                <Link2 className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <BookmarkPlus className="h-4 w-4 mr-1" />
                Save
              </Button>
            </div>
          </div>

          {/* Article Content */}
          <div className="prose prose-slate prose-lg max-w-none mb-12">
            {/* Render markdown content - in production use a markdown renderer */}
            {article.content.split("\n").map((line, i) => {
              if (line.startsWith("## ")) {
                return <h2 key={i} className="text-2xl font-bold text-slate-900 mt-8 mb-4">{line.replace("## ", "")}</h2>;
              }
              if (line.startsWith("### ")) {
                return <h3 key={i} className="text-xl font-semibold text-slate-900 mt-6 mb-3">{line.replace("### ", "")}</h3>;
              }
              if (line.startsWith("> ")) {
                return (
                  <blockquote key={i} className="border-l-4 border-indigo-500 pl-4 py-2 my-4 bg-slate-50 rounded-r-lg italic text-slate-700">
                    {line.replace("> ", "")}
                  </blockquote>
                );
              }
              if (line.startsWith("- **")) {
                const match = line.match(/- \*\*(.+?)\*\*: (.+)/);
                if (match) {
                  return (
                    <div key={i} className="flex gap-2 my-2">
                      <span className="text-indigo-500">•</span>
                      <span><strong>{match[1]}:</strong> {match[2]}</span>
                    </div>
                  );
                }
              }
              if (line.match(/^\d+\. \*\*/)) {
                const match = line.match(/^\d+\. \*\*(.+?)\*\*: (.+)/);
                if (match) {
                  return (
                    <div key={i} className="flex gap-2 my-2 ml-4">
                      <span><strong>{match[1]}:</strong> {match[2]}</span>
                    </div>
                  );
                }
              }
              if (line.startsWith("**") && line.endsWith("**")) {
                return <p key={i} className="font-semibold text-slate-900 my-2">{line.replace(/\*\*/g, "")}</p>;
              }
              if (line.trim() === "") return null;
              return <p key={i} className="text-slate-700 my-4 leading-relaxed">{line}</p>;
            })}
          </div>

          {/* Author Bio */}
          <Card className="mb-12">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={article.author.avatar} />
                  <AvatarFallback className="text-lg">{article.author.name.split(" ").map(n => n[0]).join("")}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-semibold text-slate-900 text-lg">{article.author.name}</div>
                  <div className="text-sm text-slate-500 mb-2">{article.author.title}</div>
                  <p className="text-slate-600">{article.author.bio}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Comments Section Placeholder */}
          <div className="mb-12">
            <h3 className="text-xl font-semibold text-slate-900 mb-6 flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Comments (12)
            </h3>
            
            {/* Comment Form */}
            <Card className="mb-6">
              <CardContent className="p-4">
                <Textarea 
                  placeholder="Share your thoughts on this article..."
                  className="mb-3 min-h-[100px]"
                />
                <div className="flex justify-end">
                  <Button>Post Comment</Button>
                </div>
              </CardContent>
            </Card>
            
            {/* Sample Comments */}
            <div className="space-y-4">
              {[
                { name: "John D.", time: "2 hours ago", text: "Great analysis! The point about duration management is particularly relevant given current market conditions." },
                { name: "Maria S.", time: "5 hours ago", text: "Would love to see a follow-up piece on how this affects emerging market-focused funds specifically." },
              ].map((comment, i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>{comment.name[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-slate-900">{comment.name}</span>
                          <span className="text-xs text-slate-500">{comment.time}</span>
                        </div>
                        <p className="text-slate-700">{comment.text}</p>
                        <div className="flex items-center gap-4 mt-2">
                          <Button variant="ghost" size="sm" className="text-slate-500 h-8 px-2">
                            <ThumbsUp className="h-4 w-4 mr-1" />
                            Like
                          </Button>
                          <Button variant="ghost" size="sm" className="text-slate-500 h-8 px-2">
                            Reply
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            <div className="text-center mt-4">
              <Button variant="outline">Load More Comments</Button>
            </div>
          </div>
        </article>

        {/* Related Articles */}
        <section>
          <h3 className="text-xl font-semibold text-slate-900 mb-6">Related Articles</h3>
          <div className="grid md:grid-cols-3 gap-4">
            {relatedArticles.map((related) => {
              const relConfig = categoryConfig[related.category];
              return (
                <Link key={related.id} href={`/news/${related.slug}`}>
                  <Card className="group hover:shadow-lg transition-all duration-300 h-full">
                    <div className="h-32 bg-gradient-to-br from-slate-200 to-slate-300 relative">
                      <div className="absolute bottom-2 left-2">
                        <Badge className={cn("text-xs", relConfig.color)}>
                          {relConfig.label}
                        </Badge>
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <h4 className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-2 mb-2">
                        {related.title}
                      </h4>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span>{format(related.publishedAt, "MMM d")}</span>
                        <span>•</span>
                        <span>{related.readTime} min read</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
