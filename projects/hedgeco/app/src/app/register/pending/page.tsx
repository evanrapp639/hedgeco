'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Clock, Mail, ArrowLeft, CheckCircle, Shield, AlertCircle } from 'lucide-react';

function PendingApprovalContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email');
  const step = searchParams.get('step'); // 'email' | 'accredited' | null

  const isEmailStep = step === 'email';
  const isAccreditedStep = step === 'accredited';

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          {/* Icon */}
          <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-amber-100 mb-6">
            {isEmailStep ? (
              <Mail className="h-10 w-10 text-amber-600" />
            ) : (
              <Shield className="h-10 w-10 text-amber-600" />
            )}
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            {isEmailStep ? 'Verify Your Email' : 'Account Verification'}
          </h1>
          
          {/* Description */}
          <p className="text-slate-600 text-lg mb-8">
            Thank you for registering with HedgeCo!
          </p>
        </div>

        {/* Two-Step Progress */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 space-y-4">
          <h3 className="font-semibold text-slate-900 mb-4">Verification Progress</h3>
          
          {/* Step 1: Email Verification */}
          <div className="flex items-start space-x-3">
            <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${
              isAccreditedStep ? 'bg-green-100' : 'bg-amber-100'
            }`}>
              {isAccreditedStep ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <span className="text-sm font-semibold text-amber-600">1</span>
              )}
            </div>
            <div className="flex-1">
              <h4 className={`font-medium ${isAccreditedStep ? 'text-green-700' : 'text-slate-900'}`}>
                Email Verification
              </h4>
              <p className="text-sm text-slate-600">
                {isAccreditedStep 
                  ? 'Your email has been verified ✓' 
                  : 'Check your inbox and click the verification link'}
              </p>
            </div>
          </div>

          {/* Connector */}
          <div className="ml-4 border-l-2 border-slate-200 h-4" />

          {/* Step 2: Accredited Investor Status */}
          <div className="flex items-start space-x-3">
            <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${
              isAccreditedStep ? 'bg-amber-100' : 'bg-slate-100'
            }`}>
              {isAccreditedStep ? (
                <Clock className="h-5 w-5 text-amber-600" />
              ) : (
                <span className="text-sm font-semibold text-slate-400">2</span>
              )}
            </div>
            <div className="flex-1">
              <h4 className={`font-medium ${isAccreditedStep ? 'text-slate-900' : 'text-slate-400'}`}>
                Accredited Investor Approval
              </h4>
              <p className="text-sm text-slate-500">
                {isAccreditedStep 
                  ? 'Our team is reviewing your application (1-2 business days)'
                  : 'Pending email verification'}
              </p>
            </div>
          </div>
        </div>

        {/* Current Step Info */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 space-y-4">
          {isEmailStep ? (
            <>
              <div className="flex items-start space-x-3">
                <Mail className="h-5 w-5 text-blue-500 mt-0.5" />
                <div>
                  <h3 className="font-medium text-slate-900">Check your inbox</h3>
                  <p className="text-sm text-slate-600 mt-1">
                    We&apos;ve sent a verification link to your email. Click it to verify your account.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3 bg-amber-50 p-3 rounded-lg">
                <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
                <p className="text-sm text-amber-800">
                  Can&apos;t find the email? Check your spam folder or request a new link.
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-start space-x-3">
                <Shield className="h-5 w-5 text-slate-400 mt-0.5" />
                <div>
                  <h3 className="font-medium text-slate-900">Why do we verify accredited status?</h3>
                  <p className="text-sm text-slate-600 mt-1">
                    SEC regulations require us to verify that investors meet accredited investor criteria 
                    before accessing detailed fund and SPV information.
                  </p>
                </div>
              </div>
              <div className="border-t border-slate-100 pt-4">
                <h4 className="font-medium text-slate-900 mb-2">You&apos;ll receive an email when:</h4>
                <ul className="space-y-2 text-sm text-slate-600">
                  <li className="flex items-center">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-500 mr-2" />
                    Your accredited status is approved
                  </li>
                  <li className="flex items-center">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500 mr-2" />
                    We need additional information from you
                  </li>
                </ul>
              </div>
            </>
          )}

          {email && (
            <div className="border-t border-slate-100 pt-4">
              <p className="text-sm text-slate-500">
                Notifications will be sent to: <span className="font-medium text-slate-700">{email}</span>
              </p>
            </div>
          )}
        </div>

        {/* What You Can Do Now */}
        <div className="bg-blue-50 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">What you can do now</h4>
          <p className="text-sm text-blue-800">
            While waiting for approval, you can explore HedgeCo and view fund listings with limited information. 
            Full fund details, documents, and contact options will be available once you&apos;re verified.
          </p>
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

// Loading fallback for Suspense
function PendingApprovalFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="max-w-md w-full space-y-8 text-center">
        <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-amber-100 mb-6">
          <Clock className="h-10 w-10 text-amber-600" />
        </div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Loading...</h1>
      </div>
    </div>
  );
}

export default function PendingApprovalPage() {
  return (
    <Suspense fallback={<PendingApprovalFallback />}>
      <PendingApprovalContent />
    </Suspense>
  );
}
