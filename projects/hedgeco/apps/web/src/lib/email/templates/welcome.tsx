// Welcome Email Template
// React-based email template for new user registration

import React from 'react';

export interface WelcomeEmailProps {
  name: string;
  role: 'investor' | 'provider';
  appUrl?: string;
}

export const WelcomeEmail: React.FC<WelcomeEmailProps> = ({
  name,
  role,
  appUrl = 'https://hedgeco.com',
}) => {
  const firstName = name.split(' ')[0];

  return (
    <html>
      <head>
        <style
          dangerouslySetInnerHTML={{
            __html: `
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                line-height: 1.6;
                color: #1a202c;
                margin: 0;
                padding: 0;
                background-color: #f7fafc;
              }
              .container {
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
              }
              .card {
                background: #ffffff;
                border-radius: 12px;
                overflow: hidden;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
              }
              .header {
                background: linear-gradient(135deg, #1a365d 0%, #2c5282 100%);
                color: white;
                padding: 40px 30px;
                text-align: center;
              }
              .header h1 {
                margin: 0;
                font-size: 28px;
                font-weight: 700;
              }
              .header p {
                margin: 10px 0 0;
                opacity: 0.9;
              }
              .content {
                padding: 40px 30px;
              }
              .greeting {
                font-size: 18px;
                margin-bottom: 20px;
              }
              .feature-list {
                background: #f7fafc;
                border-radius: 8px;
                padding: 20px 25px;
                margin: 25px 0;
              }
              .feature-list h3 {
                margin: 0 0 15px;
                color: #2c5282;
                font-size: 16px;
              }
              .feature-list ul {
                margin: 0;
                padding-left: 20px;
              }
              .feature-list li {
                margin-bottom: 10px;
                color: #4a5568;
              }
              .cta-container {
                text-align: center;
                margin: 35px 0;
              }
              .cta-button {
                display: inline-block;
                background: #2c5282;
                color: white !important;
                padding: 14px 35px;
                text-decoration: none;
                border-radius: 8px;
                font-weight: 600;
                font-size: 16px;
              }
              .signature {
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #e2e8f0;
              }
              .footer {
                padding: 25px 30px;
                background: #f7fafc;
                text-align: center;
                font-size: 12px;
                color: #718096;
              }
              .footer a {
                color: #4a5568;
              }
            `,
          }}
        />
      </head>
      <body>
        <div className="container">
          <div className="card">
            <div className="header">
              <h1>Welcome to HedgeCo</h1>
              <p>Your gateway to institutional investing</p>
            </div>

            <div className="content">
              <p className="greeting">Hi {firstName},</p>

              <p>
                Welcome to HedgeCo! We&apos;re thrilled to have you join our platform
                connecting institutional investors with top-tier hedge funds.
              </p>

              <div className="feature-list">
                <h3>
                  {role === 'investor'
                    ? 'What you can do as an investor:'
                    : 'What you can do as a fund provider:'}
                </h3>
                <ul>
                  {role === 'investor' ? (
                    <>
                      <li>Discover and research hedge funds with detailed analytics</li>
                      <li>Track fund performance with real-time data</li>
                      <li>Connect directly with fund managers</li>
                      <li>Access exclusive fund documents and reports</li>
                      <li>Use AI-powered fund matching and recommendations</li>
                    </>
                  ) : (
                    <>
                      <li>Showcase your fund to qualified institutional investors</li>
                      <li>Manage your fund profile and performance data</li>
                      <li>Connect with potential investors</li>
                      <li>Share documents and reports securely</li>
                      <li>Schedule meetings through our integrated calendar</li>
                    </>
                  )}
                </ul>
              </div>

              <div className="cta-container">
                <a href={`${appUrl}/dashboard`} className="cta-button">
                  Go to Your Dashboard →
                </a>
              </div>

              <p>
                If you have any questions, don&apos;t hesitate to reach out to our team.
                We&apos;re here to help you get the most out of HedgeCo.
              </p>

              <div className="signature">
                <p>
                  Best regards,
                  <br />
                  <strong>The HedgeCo Team</strong>
                </p>
              </div>
            </div>

            <div className="footer">
              <p>© {new Date().getFullYear()} HedgeCo. All rights reserved.</p>
              <p>
                You&apos;re receiving this email because you signed up for HedgeCo.
                <br />
                <a href={`${appUrl}/unsubscribe`}>Unsubscribe</a> ·{' '}
                <a href={`${appUrl}/privacy`}>Privacy Policy</a>
              </p>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
};

export default WelcomeEmail;
