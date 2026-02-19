import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Facebook,
  Twitter,
  Linkedin,
  Instagram,
  Mail,
  Phone,
  MapPin,
  Globe,
} from "lucide-react";

// Footer links from staging.hedgeco.net
const footerLinks = {
  explore: [
    { href: "/funds", label: "Funds Database" },
    { href: "/news", label: "Hedge News" },
    { href: "/providers", label: "Service Providers" },
    { href: "/conferences", label: "Conferences" },
    { href: "/spv", label: "SPV" },
    { href: "/hedgecuation", label: "Hedgecuation" },
    { href: "/reports", label: "Market Reports" },
    { href: "/research", label: "Research Tools" },
  ],
  company: [
    { href: "/about", label: "About Us" },
    { href: "/team", label: "Our Team" },
    { href: "/careers", label: "Careers" },
    { href: "/press", label: "Press & Media" },
    { href: "/partners", label: "Partners" },
    { href: "/contact", label: "Contact Us" },
  ],
  resources: [
    { href: "/help", label: "Help Center" },
    { href: "/faq", label: "FAQ" },
    { href: "/guides", label: "Investment Guides" },
    { href: "/glossary", label: "Glossary" },
    { href: "/api", label: "API Access" },
    { href: "/developers", label: "Developer Portal" },
  ],
  legal: [
    { href: "/privacy", label: "Privacy Policy" },
    { href: "/terms", label: "Terms of Service" },
    { href: "/disclaimer", label: "Disclaimer" },
    { href: "/compliance", label: "Compliance" },
    { href: "/cookies", label: "Cookie Policy" },
    { href: "/accessibility", label: "Accessibility" },
  ],
};

const socialLinks = [
  { href: "https://twitter.com/hedgeconet", icon: Twitter, label: "Twitter" },
  { href: "https://linkedin.com/company/hedgeconet", icon: Linkedin, label: "LinkedIn" },
  { href: "https://facebook.com/hedgeconet", icon: Facebook, label: "Facebook" },
  { href: "https://instagram.com/hedgeconet", icon: Instagram, label: "Instagram" },
];

export function Footer() {
  return (
    <footer className="bg-hedgeco-blue-dark text-white">
      <div className="hedgeco-container py-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
          {/* Brand Column */}
          <div className="lg:col-span-2 space-y-6">
            <Link href="/" className="flex items-center space-x-3">
              <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-hedgeco-blue to-hedgeco-cyan flex items-center justify-center">
                <span className="text-white font-bold text-xl">H</span>
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-bold">HedgeCo.Net</span>
                <span className="text-sm text-hedgeco-text-light">Alternative Investment Network</span>
              </div>
            </Link>
            <p className="text-hedgeco-text-light max-w-md">
              The leading free alternative investment database connecting thousands of investment 
              professionals with comprehensive data on hedge funds, private equity, venture capital, 
              crypto funds, and SPVs worldwide.
            </p>
            
            {/* Contact Info */}
            <div className="space-y-3">
              <div className="flex items-center space-x-3 text-hedgeco-text-light">
                <Mail className="h-4 w-4" />
                <span>info@hedgeco.net</span>
              </div>
              <div className="flex items-center space-x-3 text-hedgeco-text-light">
                <Phone className="h-4 w-4" />
                <span>+1 (212) 555-1234</span>
              </div>
              <div className="flex items-center space-x-3 text-hedgeco-text-light">
                <MapPin className="h-4 w-4" />
                <span>123 Wall Street, New York, NY 10005</span>
              </div>
            </div>
          </div>

          {/* Explore Links */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Explore</h3>
            <ul className="space-y-2">
              {footerLinks.explore.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-hedgeco-text-light hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Company</h3>
            <ul className="space-y-2">
              {footerLinks.company.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-hedgeco-text-light hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources & Legal */}
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-lg mb-4">Resources</h3>
              <ul className="space-y-2">
                {footerLinks.resources.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-hedgeco-text-light hover:text-white transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-4">Legal</h3>
              <ul className="space-y-2">
                {footerLinks.legal.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-hedgeco-text-light hover:text-white transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Newsletter Signup */}
        <div className="bg-hedgeco-blue/20 rounded-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-xl font-semibold mb-2">Stay Updated</h3>
              <p className="text-hedgeco-text-light">
                Subscribe to our newsletter for the latest fund launches, market insights, and industry news.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="px-4 py-2 rounded-md bg-white/10 border border-white/20 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-hedgeco-cyan focus:border-transparent flex-1 min-w-0"
              />
              <Button className="hedgeco-button-primary whitespace-nowrap">
                Subscribe
              </Button>
            </div>
          </div>
        </div>

        <Separator className="my-8 bg-white/20" />

        {/* Bottom Bar */}
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="text-sm text-hedgeco-text-light mb-4 md:mb-0">
            <p>&copy; {new Date().getFullYear()} HedgeCo.Net. All rights reserved.</p>
            <p className="mt-1">Connecting the alternative investment community since 2001.</p>
          </div>

          {/* Social Links */}
          <div className="flex items-center space-x-4">
            <div className="text-sm text-hedgeco-text-light mr-4">Follow us:</div>
            <div className="flex space-x-3">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                  aria-label={social.label}
                >
                  <social.icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Regulatory Disclosures */}
        <div className="mt-8 pt-6 border-t border-white/20">
          <div className="text-xs text-hedgeco-text-light text-center max-w-4xl mx-auto">
            <p className="mb-2">
              HedgeCo.Net is an information service only. We do not provide investment advice, 
              endorse any specific funds, or guarantee the accuracy of information provided. 
              All investments involve risk, including the possible loss of principal.
            </p>
            <p>
              This website is intended for accredited investors and qualified purchasers only. 
              By accessing this site, you agree to our Terms of Service and Privacy Policy.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}