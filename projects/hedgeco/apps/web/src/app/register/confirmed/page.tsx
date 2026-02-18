import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function RegistrationConfirmedPage() {
  return (
    <div className="container flex items-center justify-center min-h-screen py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl">Registration Confirmed!</CardTitle>
          <CardDescription>
            Thank you for confirming your email address
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <p className="text-gray-600">
              Your email has been successfully verified. Our team is now reviewing your application for accredited investor status.
            </p>
            
            <div className="rounded-lg bg-blue-50 p-4 border border-blue-200">
              <h3 className="font-semibold text-blue-800 mb-2">What happens next?</h3>
              <ul className="space-y-2 text-sm text-blue-700">
                <li className="flex items-start">
                  <span className="mr-2">✓</span>
                  <span>Our team reviews your application (typically 1-2 business days)</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">✓</span>
                  <span>You'll receive an email once approved</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">✓</span>
                  <span>Once approved, you'll have full access to fund details and documents</span>
                </li>
              </ul>
            </div>

            <div className="rounded-lg bg-gray-50 p-4 border border-gray-200">
              <h3 className="font-semibold text-gray-800 mb-2">In the meantime...</h3>
              <p className="text-sm text-gray-600">
                You can explore our public resources while you wait for approval:
              </p>
              <div className="mt-3 space-y-2">
                <Link 
                  href="/news" 
                  className="block text-sm text-blue-600 hover:text-blue-800 hover:underline"
                >
                  → Read breaking hedge fund news
                </Link>
                <Link 
                  href="/conferences" 
                  className="block text-sm text-blue-600 hover:text-blue-800 hover:underline"
                >
                  → Browse upcoming conferences
                </Link>
                <Link 
                  href="/about" 
                  className="block text-sm text-blue-600 hover:text-blue-800 hover:underline"
                >
                  → Learn more about HedgeCo.Net
                </Link>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t">
            <p className="text-sm text-gray-500 text-center">
              Questions? Contact{' '}
              <a href="mailto:support@hedgeco.net" className="text-blue-600 hover:underline">
                support@hedgeco.net
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}