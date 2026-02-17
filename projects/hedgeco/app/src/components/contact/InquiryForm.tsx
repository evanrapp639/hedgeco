"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CheckCircle2, Loader2, Send, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

interface InquiryFormProps {
  fundName: string;
  fundSlug: string;
  className?: string;
  onSuccess?: () => void;
}

const investmentRanges = [
  { value: "under-500k", label: "Under $500,000" },
  { value: "500k-1m", label: "$500,000 - $1,000,000" },
  { value: "1m-5m", label: "$1,000,000 - $5,000,000" },
  { value: "5m-10m", label: "$5,000,000 - $10,000,000" },
  { value: "10m-25m", label: "$10,000,000 - $25,000,000" },
  { value: "25m-50m", label: "$25,000,000 - $50,000,000" },
  { value: "over-50m", label: "$50,000,000+" },
];

const accreditationStatuses = [
  { value: "accredited-individual", label: "Accredited Individual Investor" },
  { value: "qualified-purchaser", label: "Qualified Purchaser" },
  { value: "institutional", label: "Institutional Investor" },
  { value: "family-office", label: "Family Office" },
  { value: "ria", label: "Registered Investment Advisor" },
  { value: "fund-of-funds", label: "Fund of Funds" },
  { value: "other", label: "Other" },
];

export function InquiryForm({ fundName, fundSlug, className, onSuccess }: InquiryFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    company: "",
    investmentRange: "",
    accreditationStatus: "",
    message: "",
    agreeToTerms: false,
    subscribeNewsletter: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.firstName.trim()) newErrors.firstName = "First name is required";
    if (!formData.lastName.trim()) newErrors.lastName = "Last name is required";
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email";
    }
    if (!formData.investmentRange) newErrors.investmentRange = "Please select an investment range";
    if (!formData.accreditationStatus) newErrors.accreditationStatus = "Please select your accreditation status";
    if (!formData.agreeToTerms) newErrors.agreeToTerms = "You must agree to the terms";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setIsSubmitting(false);
    setIsSubmitted(true);
    onSuccess?.();
  };

  if (isSubmitted) {
    return (
      <Card className={cn("", className)}>
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="h-8 w-8 text-emerald-600" />
          </div>
          <h3 className="text-xl font-semibold text-slate-900 mb-2">
            Inquiry Submitted Successfully
          </h3>
          <p className="text-slate-600 mb-6">
            Thank you for your interest in <strong>{fundName}</strong>. 
            The fund manager will review your inquiry and contact you within 2-3 business days.
          </p>
          <div className="bg-slate-50 rounded-lg p-4 text-left text-sm">
            <p className="font-medium text-slate-900 mb-2">What happens next?</p>
            <ol className="list-decimal list-inside space-y-1 text-slate-600">
              <li>The fund manager receives your inquiry</li>
              <li>They review your investor profile</li>
              <li>If eligible, they will reach out to schedule a call</li>
              <li>You'll receive detailed fund materials</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("", className)}>
      <CardHeader>
        <CardTitle>Request Information</CardTitle>
        <CardDescription>
          Submit your inquiry to learn more about {fundName}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                className={errors.firstName ? "border-red-500" : ""}
              />
              {errors.firstName && <p className="text-xs text-red-500">{errors.firstName}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                className={errors.lastName ? "border-red-500" : ""}
              />
              {errors.lastName && <p className="text-xs text-red-500">{errors.lastName}</p>}
            </div>
          </div>

          {/* Contact Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className={errors.email ? "border-red-500" : ""}
              />
              {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone (optional)</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              />
            </div>
          </div>

          {/* Company */}
          <div className="space-y-2">
            <Label htmlFor="company">Company / Organization (optional)</Label>
            <Input
              id="company"
              value={formData.company}
              onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
            />
          </div>

          {/* Investment Range */}
          <div className="space-y-2">
            <Label>Anticipated Investment Amount *</Label>
            <Select
              value={formData.investmentRange}
              onValueChange={(value) => setFormData(prev => ({ ...prev, investmentRange: value }))}
            >
              <SelectTrigger className={errors.investmentRange ? "border-red-500" : ""}>
                <SelectValue placeholder="Select investment range" />
              </SelectTrigger>
              <SelectContent>
                {investmentRanges.map((range) => (
                  <SelectItem key={range.value} value={range.value}>
                    {range.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.investmentRange && <p className="text-xs text-red-500">{errors.investmentRange}</p>}
          </div>

          {/* Accreditation Status */}
          <div className="space-y-2">
            <Label>Accreditation Status *</Label>
            <Select
              value={formData.accreditationStatus}
              onValueChange={(value) => setFormData(prev => ({ ...prev, accreditationStatus: value }))}
            >
              <SelectTrigger className={errors.accreditationStatus ? "border-red-500" : ""}>
                <SelectValue placeholder="Select your investor type" />
              </SelectTrigger>
              <SelectContent>
                {accreditationStatuses.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.accreditationStatus && <p className="text-xs text-red-500">{errors.accreditationStatus}</p>}
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="message">Message (optional)</Label>
            <Textarea
              id="message"
              placeholder="Tell the fund manager about your investment goals or any specific questions..."
              value={formData.message}
              onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
              className="min-h-[100px]"
            />
          </div>

          {/* Checkboxes */}
          <div className="space-y-3">
            <div className="flex items-start space-x-2">
              <Checkbox
                id="terms"
                checked={formData.agreeToTerms}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, agreeToTerms: checked as boolean }))}
                className={errors.agreeToTerms ? "border-red-500" : ""}
              />
              <Label htmlFor="terms" className="text-sm leading-tight cursor-pointer">
                I agree to share my information with the fund manager and accept HedgeCo's{" "}
                <a href="/terms" className="text-indigo-600 hover:underline">Terms of Service</a> and{" "}
                <a href="/privacy" className="text-indigo-600 hover:underline">Privacy Policy</a> *
              </Label>
            </div>
            {errors.agreeToTerms && <p className="text-xs text-red-500 ml-6">{errors.agreeToTerms}</p>}
            
            <div className="flex items-start space-x-2">
              <Checkbox
                id="newsletter"
                checked={formData.subscribeNewsletter}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, subscribeNewsletter: checked as boolean }))}
              />
              <Label htmlFor="newsletter" className="text-sm leading-tight cursor-pointer">
                Subscribe to HedgeCo's newsletter for market insights and fund recommendations
              </Label>
            </div>
          </div>

          {/* Security Notice */}
          <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg text-sm text-slate-600">
            <Shield className="h-4 w-4 text-emerald-600" />
            <span>Your information is encrypted and securely transmitted</span>
          </div>

          {/* Submit Button */}
          <Button 
            type="submit" 
            className="w-full" 
            size="lg"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Submit Inquiry
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export default InquiryForm;
