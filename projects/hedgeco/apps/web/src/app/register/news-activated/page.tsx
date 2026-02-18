import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Mail } from 'lucide-react';
import Link from 'next/link';

export default function NewsActivatedPage() {
  return (
    <div className="container flex items-center justify-center min-h-screen py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl">News Membership Activated!</CardTitle>
          <CardDescription>
            Welcome to HedgeCo.Net News
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <p className="text-gray-600">
              Your free News membership has been successfully activated. You now have access to our latest hedge fund news, market insights, and educational content.
            </p>
            
            <div className="rounded-lg bg-green-50 p-4 border border-green-200">
              <div className="flex items-start">
                <Mail className="h-5 w-5 text-green-600 mr-3 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-green-800 mb-1">What you'll receive:</h3>
                  <ul className="space-y-1 text-sm text-green-700">
                    <li>• Breaking hedge fund news and analysis</li>
                    <li>• Weekly market insights and reports</li>
                    <li>• Conference and event announcements</li>
                    <li>• Educational content on alternative investments</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="rounded-lg bg-blue-50 p-4 border border-blue-200">
              <h3 className="font-semibold text-blue-800 mb-2">Get started now</h3>
              <div className="mt-3 space-y-3">
                <Link 
                  href="/news" 
                  className="block w-full text-center py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Browse Latest News
                </Link>
                <Link 
                  href="/conferences" 
                  className="block w-full text-center py-2 px-4 border border-blue-600 text-blue-600 rounded-md hover:bg-blue-50 transition-colors"
                >
                  View Upcoming Events
                </Link>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t">
            <div className="text-center space-y-2">
              <p className="text-sm text-gray-500">
                Want full database access?{' '}
                <Link href="/register" className="text-blue-600 hover:underline font-medium">
                  Upgrade to Investor Account
                </Link>
              </p>
              <p className="text-sm text-gray-500">
                Questions? Contact{' '}
                <a href="mailto:support@hedgeco.net" className="text-blue-600 hover:underline">
                  support@hedgeco.net
                </a>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}