// Service Provider Registration Autoresponder
// Matches exact template from staging.hedgeco.net

import React from 'react';

export interface ServiceProviderRegistrationProps {
  firstName: string;
  email: string;
  confirmUrl: string;
}

export const ServiceProviderRegistrationEmail: React.FC<ServiceProviderRegistrationProps> = ({
  firstName,
  email,
  confirmUrl,
}) => {
  const currentYear = new Date().getFullYear();

  return (
    <html>
      <head>
        <style>{`
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f9f9f9;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
          }
          .header {
            background: #ffffff;
            padding: 20px;
            text-align: center;
            border-bottom: 1px solid #eee;
          }
          .logo {
            font-size: 24px;
            font-weight: bold;
            color: #1a365d;
            margin-bottom: 5px;
          }
          .tagline {
            font-size: 12px;
            color: #666;
            margin: 0;
          }
          .celebration {
            background: #f0f4f8;
            padding: 10px;
            text-align: center;
            font-size: 14px;
            color: #1a365d;
            font-weight: 600;
            border-bottom: 1px solid #ddd;
          }
          .content {
            padding: 30px;
          }
          .footer {
            background: #f5f5f5;
            padding: 20px;
            text-align: center;
            font-size: 12px;
            color: #666;
            border-top: 1px solid #eee;
          }
          .button {
            display: inline-block;
            background: #1a365d;
            color: white !important;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 4px;
            font-weight: 600;
            margin: 20px 0;
          }
          .info-box {
            background: #f8f9fa;
            border: 1px solid #e2e8f0;
            padding: 20px;
            border-radius: 6px;
            margin: 20px 0;
          }
          .contact-info {
            margin: 20px 0;
            padding: 15px;
            background: #f0f7ff;
            border-left: 4px solid #1a365d;
          }
          .social-links {
            margin: 15px 0;
          }
          .social-links a {
            margin: 0 10px;
            color: #666;
            text-decoration: none;
          }
          .footer-links {
            margin: 15px 0;
          }
          .footer-links a {
            margin: 0 8px;
            color: #666;
            text-decoration: none;
            font-size: 11px;
          }
          .credits {
            font-size: 11px;
            color: #999;
            margin-top: 20px;
            line-height: 1.4;
          }
        `}</style>
      </head>
      <body>
        <div className="container">
          <div className="header">
            <div className="logo">[HC Logo] HedgeCo.Net Alternative Investments Database</div>
            <p className="tagline">Celebrating 23 Years</p>
          </div>

          <div className="celebration">
            Celebrating 23 Years of Alternative Investment Excellence
          </div>

          <div className="content">
            <p>Hello {firstName},</p>

            <p>
              Thank you for listing your services in our directory on HedgeCo.Net, your 
              application is currently being reviewed. We will contact you as soon as 
              possible to confirm your membership if you have a paid listing, or you can 
              contact us immediately at +1 (561) 835-8690 or by email at support@hedgeco.net 
              to confirm your listing and membership immediately.
            </p>

            <p>
              Prior to being approved, you can visit the public pages of HedgeCo.Net, 
              where you can read breaking hedge fund news, browse educational articles 
              on hedge funds and view upcoming seminars in addition to a host of other 
              features.
            </p>

            <p>
              As a reminder, before you can sign-in on HedgeCo.Net your account will 
              have to be approved by one of our associates.
            </p>

            <div className="info-box">
              <p style="margin: 0 0 10px;"><strong>Your Account Information:</strong></p>
              <p style="margin: 5px 0;"><strong>Username:</strong> {email}</p>
              <p style="margin: 5px 0;"><strong>Password:</strong> **********</p>
            </div>

            <p>
              To speed up the approval process for free listings please click to 
              confirm your registration.
            </p>

            <div style="text-align: center;">
              <a href={confirmUrl} className="button">Confirm Registration</a>
            </div>

            <p>
              HedgeCo.Net will notify you by email that your account has been approved.
            </p>

              <p>Thank you for using HedgeCo.Net.</p>

            <p>The HedgeCo™ Team<br />
            P: (561) 295-3709<br />
            @: support@hedgeco.net<br />
            W: www.hedgeco.net</p>
          </div>

          <div className="footer">
            <div style="margin-bottom: 15px;">
              <div style="font-weight: bold; color: #1a365d; margin-bottom: 5px;">
                [HC Logo] HedgeCo.Net
              </div>
              <p style="margin: 0; font-size: 11px; color: #666;">
                The world's largest independent alternative investments database 
                connecting accredited investors since 2002
              </p>
            </div>

            <div className="social-links">
              <a href="https://linkedin.com/company/hedgeco-net">LinkedIn</a>
              <a href="https://twitter.com/hedgeconet">Twitter</a>
              <a href="https://hedgeco.net">Website</a>
            </div>

            <div className="footer-links">
              <a href="https://hedgeco.net">Home</a>
              <a href="https://hedgeco.net/database">Database</a>
              <a href="https://hedgeco.net/conferences">Conferences</a>
              <a href="https://hedgeco.net/news">News</a>
              <a href="https://hedgeco.net/service-providers">Service Providers</a>
              <a href="https://hedgeco.net/about">About</a>
              <a href="https://hedgeco.net/contact">Contact</a>
            </div>

            <div className="credits">
              <p style="margin: 5px 0;">
                © {currentYear} HedgeCo.Net. All rights reserved.<br />
                West Palm Beach, FL | 
                <a href="https://hedgeco.net/unsubscribe" style="color: #666;">Unsubscribe</a> | 
                <a href="https://hedgeco.net/privacy" style="color: #666;">Privacy Policy</a>
              </p>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
};

export { ServiceProviderRegistrationEmail };