// News Member Registration Autoresponder
// Matches exact template from staging.hedgeco.net

import React from 'react';
import { Html, Head, Body, Container, Section, Column, Row, Text, Link, Img, Hr } from '@react-email/components';

export interface NewsMemberRegistrationProps {
  firstName: string;
  email: string;
  activateUrl: string;
}

export const NewsMemberRegistrationEmail: React.FC<NewsMemberRegistrationProps> = ({
  firstName,
  email,
  activateUrl,
}) => {
  const currentYear = new Date().getFullYear();

  return (
    <Html>
      <Head>
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
          .activation-box {
            background: #f8f9fa;
            border: 1px solid #e2e8f0;
            padding: 25px;
            border-radius: 6px;
            margin: 30px 0;
            text-align: center;
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
          .disclaimer {
            font-size: 12px;
            color: #999;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eee;
          }
        `}</style>
      </Head>
      <Body>
        <Container className="container">
          <Section className="header">
            <Text style={{ margin: 0, color: '#1a365d', fontSize: '24px', fontWeight: 'bold' }}>
              HedgeCo.Net
            </Text>
            <Text style={{ margin: '10px 0 0', color: '#666', fontSize: '14px' }}>
              The Leading Free Alternative Investment Database
            </Text>
          </Section>

          <Section className="content">
            <Text>Hi {firstName},</Text>

            <Text>
              Thank you for registering with HedgeCo.Net for your free News membership. 
              This email is to confirm that the address you listed during registration 
              is accurate. If you did not request this membership, please disregard this 
              email and the membership will remain inactive.
            </Text>

            <Section className="activation-box">
              <Text style={{ margin: '0 0 15px', fontWeight: '600' }}>
                To confirm and activate your account please click on the link below:
              </Text>
              <Link href={activateUrl} className="button">
                Click here to activate your account
              </Link>
              <Text style={{ margin: '15px 0 0', fontSize: '14px', color: '#666' }}>
                This link will expire in 24 hours.
              </Text>
            </Section>

            <Text>
              Once activated, you'll receive:
              <br />• Breaking hedge fund news and analysis
              <br />• Weekly market insights and reports
              <br />• Conference and event announcements
              <br />• Educational content on alternative investments
            </Text>

            <Text>
              If you have any questions about your News membership, please contact 
              <Link href="mailto:support@hedgeco.net">support@hedgeco.net</Link>.
            </Text>
          </Section>

          <Section className="footer">
            <Text style={{ fontWeight: 'bold', margin: '0 0 10px' }}>
              The Leading Free Alternative Investment Database
            </Text>
            
            <Section className="footer-links">
              <Link href="https://hedgeco.net">Home</Link>
              <Link href="https://hedgeco.net/database">Database</Link>
              <Link href="https://hedgeco.net/conferences">Conferences</Link>
              <Link href="https://hedgeco.net/news">News</Link>
              <Link href="https://hedgeco.net/service-providers">Service Providers</Link>
              <Link href="https://hedgeco.net/about">About</Link>
              <Link href="https://hedgeco.net/contact">Contact</Link>
            </Section>

            <Section className="social-links">
              <Link href="https://twitter.com/hedgeconet">Twitter</Link>
              <Link href="https://linkedin.com/company/hedgeco-net">LinkedIn</Link>
            </Section>

            <Text style={{ margin: '10px 0' }}>
              HedgeCo.Net Alternative Investment Database<br />
              West Palm Beach, FL
            </Text>

            <Section className="footer-links">
              <Link href="https://hedgeco.net/privacy">Privacy Policy</Link>
              <Link href="https://hedgeco.net/terms">Terms & Conditions</Link>
              <Link href="https://hedgeco.net/unsubscribe">Unsubscribe</Link>
            </Section>

            <Section className="disclaimer">
              <Text style={{ margin: '5px 0' }}>
                © {currentYear} HedgeCo.Net. All rights reserved.<br />
                You're receiving this email because you signed up for HedgeCo.Net.
              </Text>
            </Section>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};