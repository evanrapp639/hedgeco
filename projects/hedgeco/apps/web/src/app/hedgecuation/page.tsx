import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  GraduationCap,
  Video,
  FileText,
  Users,
  TrendingUp,
  BarChart3,
  Globe,
  Clock,
  CheckCircle,
  ArrowRight,
  PlayCircle,
  Download,
  Share2,
} from "lucide-react";

// Course Categories
const courseCategories = [
  {
    name: "Hedge Fund Basics",
    description: "Fundamentals of hedge fund strategies, structures, and operations.",
    courses: 12,
    icon: BookOpen,
    color: "from-blue-500 to-blue-600",
  },
  {
    name: "Private Equity Mastery",
    description: "Deep dive into PE fundraising, due diligence, and portfolio management.",
    courses: 8,
    icon: TrendingUp,
    color: "from-green-500 to-green-600",
  },
  {
    name: "Venture Capital Insights",
    description: "From seed to Series C: evaluating startups and VC fund mechanics.",
    courses: 6,
    icon: BarChart3,
    color: "from-purple-500 to-purple-600",
  },
  {
    name: "Real Estate Investing",
    description: "Commercial, residential, and REIT investment strategies.",
    courses: 10,
    icon: Globe,
    color: "from-orange-500 to-orange-600",
  },
];

// Featured Courses
const featuredCourses = [
  {
    title: "Hedge Fund Due Diligence 101",
    instructor: "Sarah Chen, CFA",
    duration: "4 hours",
    level: "Beginner",
    students: "2,450+",
    rating: 4.9,
    description: "Learn how to evaluate hedge fund managers, analyze track records, and assess risk management frameworks.",
    icon: GraduationCap,
  },
  {
    title: "Private Equity Deal Structuring",
    instructor: "Michael Rodriguez",
    duration: "6 hours",
    level: "Intermediate",
    students: "1,850+",
    rating: 4.8,
    description: "Master LPA terms, waterfall calculations, and carry economics in private equity transactions.",
    icon: FileText,
  },
  {
    title: "VC Term Sheet Negotiation",
    instructor: "Jessica Park",
    duration: "3 hours",
    level: "Advanced",
    students: "3,200+",
    rating: 4.9,
    description: "Understand key terms, valuation methods, and negotiation strategies for venture capital deals.",
    icon: Users,
  },
];

// Learning Resources
const resources = [
  {
    type: "Video Tutorial",
    title: "How to Read a Hedge Fund Pitch Deck",
    duration: "45 min",
    format: "MP4",
    icon: Video,
  },
  {
    type: "E-Book",
    title: "The Alternative Investor's Handbook",
    duration: "120 pages",
    format: "PDF",
    icon: BookOpen,
  },
  {
    type: "Case Study",
    title: "Bridgewater's Risk Parity Strategy",
    duration: "30 min read",
    format: "Article",
    icon: FileText,
  },
  {
    type: "Webinar",
    title: "Market Outlook 2026: Alternative Assets",
    duration: "60 min",
    format: "Recording",
    icon: PlayCircle,
  },
];

export default function HedgecuationPage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative hedgeco-gradient text-white">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="hedgeco-container py-24 md:py-32 relative">
          <div className="max-w-4xl mx-auto text-center">
            <Badge variant="secondary" className="mb-6 bg-white/20 text-white border-white/30">
              Hedgecuation - Alternative Investment Education
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
              Master Alternative Investments with{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-300">
                Expert-Led Education
              </span>
            </h1>
            <p className="text-xl text-white/90 mb-8 max-w-3xl mx-auto">
              Comprehensive courses, tutorials, and resources to help you navigate hedge funds, 
              private equity, venture capital, and other alternative asset classes.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-white text-hedgeco-primary-dark hover:bg-white/90 text-lg px-8" asChild>
                <Link href="#courses">
                  Explore Courses
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 text-lg px-8" asChild>
                <Link href="/register">Start Learning Free</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="bg-hedgeco-light border-b border-hedgeco-border">
        <div className="hedgeco-container py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-hedgeco-text-dark mb-1">150+</div>
              <div className="text-sm text-hedgeco-text">Courses & Tutorials</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-hedgeco-text-dark mb-1">25K+</div>
              <div className="text-sm text-hedgeco-text">Students Enrolled</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-hedgeco-text-dark mb-1">50+</div>
              <div className="text-sm text-hedgeco-text">Industry Experts</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-hedgeco-text-dark mb-1">4.8★</div>
              <div className="text-sm text-hedgeco-text">Average Rating</div>
            </div>
          </div>
        </div>
      </section>

      {/* Course Categories */}
      <section id="courses" className="hedgeco-section-padding bg-white">
        <div className="hedgeco-container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-hedgeco-text-dark mb-4">
              Explore Learning Categories
            </h2>
            <p className="text-lg text-hedgeco-text max-w-3xl mx-auto">
              Comprehensive education across all major alternative investment domains
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {courseCategories.map((category) => (
              <Card key={category.name} className="hedgeco-card">
                <CardHeader>
                  <div className={`h-12 w-12 rounded-lg bg-gradient-to-br ${category.color} flex items-center justify-center mb-4`}>
                    <category.icon className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-xl">{category.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-hedgeco-text mb-4">
                    {category.description}
                  </CardDescription>
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-hedgeco-text-light">
                      {category.courses} courses
                    </div>
                    <Button variant="ghost" className="p-0 h-auto text-hedgeco-primary hover:text-hedgeco-primary-dark" asChild>
                      <Link href={`/hedgecuation/category/${category.name.toLowerCase().replace(/\s+/g, '-')}`}>
                        Explore
                        <ArrowRight className="ml-1 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Featured Courses */}
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-hedgeco-text-dark mb-4">
              Featured Courses
            </h2>
            <p className="text-lg text-hedgeco-text max-w-3xl mx-auto">
              Most popular courses among alternative investment professionals
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-16">
            {featuredCourses.map((course) => (
              <Card key={course.title} className="hedgeco-card">
                <CardHeader>
                  <div className="flex justify-between items-start mb-4">
                    <Badge className={
                      course.level === "Beginner" 
                        ? "bg-green-100 text-green-800 border-green-200"
                        : course.level === "Intermediate"
                        ? "bg-blue-100 text-blue-800 border-blue-200"
                        : "bg-purple-100 text-purple-800 border-purple-200"
                    }>
                      {course.level}
                    </Badge>
                    <div className="flex items-center">
                      <span className="text-hedgeco-text-dark font-semibold mr-1">{course.rating}</span>
                      <span className="text-yellow-500">★</span>
                    </div>
                  </div>
                  <div className="h-12 w-12 rounded-lg bg-hedgeco-primary/10 flex items-center justify-center mb-4">
                    <course.icon className="h-6 w-6 text-hedgeco-primary" />
                  </div>
                  <CardTitle className="text-xl">{course.title}</CardTitle>
                  <CardDescription className="text-hedgeco-text-light mt-2">
                    By {course.instructor}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-hedgeco-text mb-4">
                    {course.description}
                  </CardDescription>
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center text-sm text-hedgeco-text-light">
                      <Clock className="h-4 w-4 mr-1" />
                      {course.duration}
                    </div>
                    <div className="text-sm text-hedgeco-text-light">
                      {course.students} students
                    </div>
                  </div>
                  <Button className="w-full hedgeco-button-primary" asChild>
                    <Link href={`/hedgecuation/courses/${course.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}>
                      Enroll Now
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Learning Resources */}
      <section className="hedgeco-section-padding bg-hedgeco-light">
        <div className="hedgeco-container">
          <div className="flex justify-between items-center mb-12">
            <div>
              <h2 className="text-3xl font-bold text-hedgeco-text-dark mb-2">
                Free Learning Resources
              </h2>
              <p className="text-hedgeco-text">
                Access our library of free educational content
              </p>
            </div>
            <Button variant="outline" className="border-hedgeco-border" asChild>
              <Link href="/hedgecuation/resources">
                View All Resources
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {resources.map((resource) => (
              <Card key={resource.title} className="hedgeco-card">
                <CardHeader>
                  <div className="h-10 w-10 rounded-lg bg-hedgeco-primary/10 flex items-center justify-center mb-4">
                    <resource.icon className="h-5 w-5 text-hedgeco-primary" />
                  </div>
                  <Badge variant="outline" className="mb-2 w-fit">
                    {resource.type}
                  </Badge>
                  <CardTitle className="text-lg">{resource.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center mb-4">
                    <div className="text-sm text-hedgeco-text-light">
                      {resource.duration}
                    </div>
                    <div className="text-sm text-hedgeco-text-light">
                      {resource.format}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1" asChild>
                      <Link href="#">
                        <PlayCircle className="h-4 w-4 mr-2" />
                        View
                      </Link>
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1" asChild>
                      <Link href="#">
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Why Learn With Us */}
      <section className="hedgeco-section-padding bg-white">
        <div className="hedgeco-container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-hedgeco-text-dark mb-4">
              Why Learn With Hedgecuation?
            </h2>
            <p className="text-lg text-hedgeco-text max-w-3xl mx-auto">
              Industry-leading education designed for alternative investment professionals
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="h-16 w-16 rounded-full bg-hedgeco-primary/10 flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-hedgeco-primary" />
              </div>
              <h3 className="text-xl font-semibold text-hedgeco-text-dark mb-2">
                Industry Experts
              </h3>
              <p className="text-hedgeco-text">
                Learn from seasoned fund managers, investors, and industry veterans with real-world experience.
              </p>
            </div>
            <div className="text-center">
              <div className="h-16 w-16 rounded-full bg-hedgeco-primary/10 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-hedgeco-primary" />
              </div>
              <h3 className="text-xl font-semibold text-hedgeco-text-dark mb-2">
                Practical Focus
              </h3>
              <p className="text-hedgeco-text">
                Case studies, real deal analysis, and hands-on exercises that translate directly to your work.
              </p>
            </div>
            <div className="text-center">
              <div className="h-16 w-16 rounded-full bg-hedgeco-primary/10 flex items-center justify-center mx-auto mb-4">
                <Globe className="h-8 w-8 text-hedgeco-primary" />
              </div>
              <h3 className="text-xl font-semibold text-hedgeco-text-dark mb-2">
                Global Perspective
              </h3>
              <p className="text-hedgeco-text">
                Insights from markets worldwide with coverage of regional strategies and regulations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="hedgeco-gradient text-white">
        <div className="hedgeco-container py-20 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Start Your Alternative Investment Education Today
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Join thousands of investment professionals who have advanced their careers with Hedgecuation.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-white text-hedgeco-primary-dark hover:bg-white/90 text-lg px-8" asChild>
              <Link href="/register">Get Started Free</Link>
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 text-lg px-8" asChild>
              <Link href="/hedgecuation/catalog">Browse Full Catalog</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}