// Investor & Fund Manager Registration Autoresponder
// Matches exact template from staging.hedgeco.net

import React from 'react';

export interface InvestorManagerRegistrationProps {
  firstName: string;
  email: string;
  confirmUrl: string;
  type: 'investor' | 'manager';
}

export const InvestorManagerRegistrationEmail: React.FC<InvestorManagerRegistrationProps> = ({
  firstName,
  email,
  confirmUrl,
  type,
}) => {
  const roleLabel = type === 'investor' ? 'investor' : 'fund manager';
  const currentYear = new Date().getFullYear();

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
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
          padding: 30px 20px;
          text-align: center;
          border-bottom: 1px solid #eee;
        }
        .content {
          padding: 40px 30px;
        }
        .footer {
          background: #f5f5f5;
          padding: 30px 20px;
          text-align: center;
          font-size: 12px;
          color: #666;
          border-top: 1px solid #eee;
        }
        .button {
          display: inline-block;
          background: #1a365d;
          color: white !important;
          padding: 14px 28px;
          text-decoration: none;
          border-radius: 4px;
          font-weight: 600;
          margin: 20px 0;
        }
        .section {
          margin: 30px 0;
          padding: 20px;
          background: #f8f9fa;
          border-radius: 6px;
          border-left: 4px solid #1a365d;
        }
        .feature-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
          margin: 30px 0;
        }
        .feature-card {
          background: white;
          padding: 20px;
          border-radius: 6px;
          border: 1px solid #e2e8f0;
          text-align: center;
        }
        .feature-icon {
          font-size: 24px;
          margin-bottom: 10px;
        }
        .steps {
          display: flex;
          justify-content: space-between;
          margin: 30px 0;
          text-align: center;
        }
        .step {
          flex: 1;
          padding: 0 10px;
        }
        .step-number {
          display: inline-block;
          width: 30px;
          height: 30px;
          background: #1a365d;
          color: white;
          border-radius: 50%;
          line-height: 30px;
          margin-bottom: 10px;
        }
        .social-links {
          margin: 20px 0;
        }
        .social-links a {
          margin: 0 10px;
          color: #666;
          text-decoration: none;
        }
        .footer-links {
          margin: 20px 0;
        }
        .footer-links a {
          margin: 0 10px;
          color: #666;
          text-decoration: none;
          font-size: 12px;
        }
        @media (max-width: 600px) {
          .feature-grid {
            grid-template-columns: 1fr;
          }
          .steps {
            flex-direction: column;
          }
          .step {
            margin-bottom: 20px;
          }
        }
      </style>
    </head>
    <body>
      <div className="container">
        <div className="header">
          <h1 style="margin: 0; color: #1a365d;">HedgeCo.Net</h1>
          <p style="margin: 10px 0 0; color: #666; font-size: 14px;">
            The Leading Free Alternative Investment Database
          </p>
        </div>

        <div className="content">
          <p>Hi ${firstName || 'there'},</p>

          <p>
            Thank you for registering with HedgeCo.Net, the platform built to connect 
            investors, fund managers, and service providers across the alternative 
            investment industry.
          </p>

          <p>
            We've received your registration and our team is currently reviewing your 
            information. We will get back to you if we need any additional information. 
            Otherwise, you should be on the lookout for an approval email once the team 
            has had a chance to review all the necessary information.
          </p>

          <div className="section">
            <h3 style="margin-top: 0;">🚀 Speed Up Your Approval</h3>
            <p>
              To speed up the approval process for free listings, please click below to 
              confirm your registration.
            </p>
            <div style="text-align: center;">
              <a href="${confirmUrl}" className="button">Confirm Registration</a>
            </div>
            <p style="font-size: 14px; color: #666; margin-top: 10px;">
              This helps us verify your email address and expedite your account approval
            </p>
          </div>

          <p>
            In the meantime, feel free to:
            <br />• Explore our public news and education sections
            <br />• Contact us with any questions at support@hedgeco.net
          </p>

          <p>
            We're excited to have you in the HedgeCo.Net community and look forward to 
            supporting your alternative investment journey.
          </p>

          <h3>Here's What You Get Access To</h3>
          <p>Everything you need to make informed alternative investment decisions</p>

          <div className="feature-grid">
            <div className="feature-card">
              <div className="feature-icon">🏦</div>
              <h4 style="margin: 10px 0;">Hedge Fund Database</h4>
              <p style="font-size: 14px; color: #666; margin: 0;">
                Comprehensive performance data, strategy analysis, and fund manager profiles
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">💼</div>
              <h4 style="margin: 10px 0;">Private Equity Access</h4>
              <p style="font-size: 14px; color: #666; margin: 0;">
                PE fund launches, performance metrics, and investment opportunities
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <h4 style="margin: 10px 0;">SPV Opportunities</h4>
              <p style="font-size: 14px; color: #666; margin: 0;">
                Special purpose vehicles and co-investment opportunities
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">₿</div>
              <h4 style="margin: 10px 0;">Crypto Funds</h4>
              <p style="font-size: 14px; color: #666; margin: 0;">
                Digital asset strategies and cryptocurrency fund performance
              </p>
            </div>
          </div>

          <h3>Get Started in 3 Easy Steps</h3>
          <div className="steps">
            <div className="step">
              <div className="step-number">1</div>
              <h4>Search Database</h4>
              <p style="font-size: 14px; color: #666;">
                Use our advanced filters to find funds
              </p>
            </div>
            <div className="step">
              <div className="step-number">2</div>
              <h4>Analyze Performance</h4>
              <p style="font-size: 14px; color: #666;">
                Review detailed metrics and rankings
              </p>
            </div>
            <div className="step">
              <div className="step-number">3</div>
              <h4>Connect & Invest</h4>
              <p style="font-size: 14px; color: #666;">
                Contact fund managers directly
              </p>
            </div>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="https://hedgeco.net/database" className="button" style="margin-right: 10px;">
              Search Database
            </a>
            <a href="https://hedgeco.net/rankings" className="button" style="background: #666;">
              View Rankings
            </a>
          </div>

          <div className="section">
            <h3 style="margin-top: 0;">📧 Need Help Getting Started?</h3>
            <p>
              Our team is here to help you make the most of your HedgeCo.Net membership
            </p>
            <p>
              <a href="mailto:support@hedgeco.net">Email Support</a>
            </p>
          </div>
        </div>

        <div className="footer">
          <p style={{ fontWeight: 'bold', margin: '0 0 10px' }}>
            The Leading Free Alternative Investment Database
          </p>
          
          <div className="footer-links">
            <a href="https://hedgeco.net">Home</a>
            <a href="https://hedgeco.net/database">Database</a>
            <a href="https://hedgeco.net/conferences">Conferences</a>
            <a href="https://hedgeco.net/news">News</a>
            <a href="https://hedgeco.net/service-providers">Service Providers</a>
            <a href="https://hedgeco.net/about">About</a>
            <a href="https://hedgeco.net/contact">Contact</a>
          </div>

          <div className="social-links">
            <a href="https://twitter.com/hedgeconet">Twitter</a>
            <a href="https://linkedin.com/company/hedgeco-net">LinkedIn</a>
          </div>

          <p style="margin: 10px 0;">
            HedgeCo.Net Alternative Investment Database<br />
            West Palm Beach, FL
          </p>

          <div className="footer-links">
            <a href="https://hedgeco.net/privacy">Privacy Policy</a>
            <a href="https://hedgeco.net/terms">Terms & Conditions</a>
            <a href="https://hedgeco.net/unsubscribe">Unsubscribe</a>
          </div>

          <p style="margin: 20px 0 0; font-size: 11px; color: #999;">
            © ${currentYear} HedgeCo.Net. All rights reserved.<br />
            You're receiving this email because you signed up for HedgeCo.Net.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  return <div dangerouslySetInnerHTML={{ __html: html }} />;
};