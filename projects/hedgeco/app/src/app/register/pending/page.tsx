'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Clock, Mail, ArrowLeft } from 'lucide-react';

export default function PendingApprovalPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email');

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          {/* Icon */}
          <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-amber-100 mb-6">
            <Clock className="h-10 w-10 text-amber-600" />
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Account Pending Approval
          </h1>
          
          {/* Description */}
          <p className="text-slate-600 text-lg mb-8">
            Thank you for registering with HedgeCo!
          </p>
        </div>

        {/* Info Card */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 space-y-4">
          <div className="flex items-start space-x-3">
            <Mail className="h-5 w-5 text-slate-400 mt-0.5" />
            <div>
              <h3 className="font-medium text-slate-900">What happens next?</h3>
              <p className="text-sm text-slate-600 mt-1">
                Our team will review your application and verify your information. 
                This typically takes 1-2 business days.
              </p>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-4">
            <h3 className="font-medium text-slate-900 mb-2">You&apos;ll receive an email when:</h3>
            <ul className="space-y-2 text-sm text-slate-600">
              <li className="flex items-center">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500 mr-2" />
                Your account is approved and ready to use
              </li>
              <li className="flex items-center">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500 mr-2" />
                We need additional information from you
              </li>
            </ul>
          </div>

          {email && (
            <div className="border-t border-slate-100 pt-4">
              <p className="text-sm text-slate-500">
                Notification will be sent to: <span className="font-medium text-slate-700">{email}</span>
              </p>
            </div>
          )}
        </div>

        {/* Support Info */}
        <div className="text-center text-sm text-slate-500">
          <p>
            Have questions?{' '}
            <a href="mailto:support@hedgeco.net" className="text-blue-600 hover:underline">
              Contact our support team
            </a>
          </p>
        </div>

        {/* Back to Home */}
        <div className="text-center">
          <Link 
            href="/" 
            className="inline-flex items-center text-sm text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Return to home page
          </Link>
        </div>
      </div>
    </div>
  );
}
