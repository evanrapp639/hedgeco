// Email Service
// Uses Resend API for transactional emails
// Falls back to console.log in dev if RESEND_API_KEY is not set

import { Resend } from 'resend';

// Initialize Resend client (may be null in dev)
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// Default sender
const DEFAULT_FROM = process.env.EMAIL_FROM || 'HedgeCo <noreply@hedgeco.com>';

// Check if we're in dev mode (no API key)
const isDev = !process.env.RESEND_API_KEY;

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
  cc?: string | string[];
  bcc?: string | string[];
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
}

export interface EmailResult {
  success: boolean;
  id?: string;
  error?: string;
}

/**
 * Send an email via Resend API
 * In dev mode without API key, logs to console instead
 */
export async function sendEmail(options: SendEmailOptions): Promise<EmailResult> {
  const { to, subject, html, text, from = DEFAULT_FROM, replyTo, cc, bcc, attachments } = options;

  // Dev mode - just log
  if (isDev) {
    console.log('\n📧 [DEV MODE] Email would be sent:');
    console.log('─'.repeat(50));
    console.log(`From: ${from}`);
    console.log(`To: ${Array.isArray(to) ? to.join(', ') : to}`);
    if (cc) console.log(`CC: ${Array.isArray(cc) ? cc.join(', ') : cc}`);
    if (bcc) console.log(`BCC: ${Array.isArray(bcc) ? bcc.join(', ') : bcc}`);
    console.log(`Subject: ${subject}`);
    if (replyTo) console.log(`Reply-To: ${replyTo}`);
    console.log('─'.repeat(50));
    console.log(text || html);
    console.log('─'.repeat(50));
    if (attachments?.length) {
      console.log(`Attachments: ${attachments.map((a) => a.filename).join(', ')}`);
    }
    console.log('\n');

    return { success: true, id: `dev-${Date.now()}` };
  }

  // Production mode - send via Resend
  try {
    const result = await resend!.emails.send({
      from,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      text,
      replyTo,
      cc: cc ? (Array.isArray(cc) ? cc : [cc]) : undefined,
      bcc: bcc ? (Array.isArray(bcc) ? bcc : [bcc]) : undefined,
      attachments: attachments?.map((a) => ({
        filename: a.filename,
        content: typeof a.content === 'string' ? Buffer.from(a.content) : a.content,
      })),
    });

    if (result.error) {
      console.error('[Email] Send failed:', result.error);
      return { success: false, error: result.error.message };
    }

    return { success: true, id: result.data?.id };
  } catch (error) {
    console.error('[Email] Send error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send welcome email to new user
 */
export async function sendWelcomeEmail(user: {
  email: string;
  name: string;
  role: 'investor' | 'provider';
}): Promise<EmailResult> {
  const { email, name, role } = user;
  const firstName = name.split(' ')[0];

  const roleSpecificContent =
    role === 'investor'
      ? `
        <p>As an investor on HedgeCo, you can:</p>
        <ul>
          <li>Discover and research hedge funds</li>
          <li>Track fund performance and analytics</li>
          <li>Connect directly with fund managers</li>
          <li>Access exclusive fund documents</li>
        </ul>
      `
      : `
        <p>As a fund provider on HedgeCo, you can:</p>
        <ul>
          <li>Showcase your fund to qualified investors</li>
          <li>Manage your fund profile and performance data</li>
          <li>Connect with potential investors</li>
          <li>Share documents and reports securely</li>
        </ul>
      `;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1a202c; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #1a365d 0%, #2c5282 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #ffffff; padding: 30px; border: 1px solid #e2e8f0; }
        .footer { background: #f7fafc; padding: 20px; text-align: center; font-size: 12px; color: #718096; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; background: #2c5282; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; }
        ul { padding-left: 20px; }
        li { margin-bottom: 8px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0;">Welcome to HedgeCo</h1>
        </div>
        <div class="content">
          <p>Hi ${firstName},</p>
          <p>Welcome to HedgeCo! We're excited to have you join our platform connecting institutional investors with top-tier hedge funds.</p>
          ${roleSpecificContent}
          <p style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://hedgeco.com'}/dashboard" class="button">
              Go to Dashboard
            </a>
          </p>
          <p>If you have any questions, our team is here to help.</p>
          <p>Best regards,<br>The HedgeCo Team</p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} HedgeCo. All rights reserved.</p>
          <p>You're receiving this email because you signed up for HedgeCo.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Welcome to HedgeCo, ${firstName}!

We're excited to have you join our platform connecting institutional investors with top-tier hedge funds.

Visit your dashboard: ${process.env.NEXT_PUBLIC_APP_URL || 'https://hedgeco.com'}/dashboard

Best regards,
The HedgeCo Team
  `.trim();

  return sendEmail({
    to: email,
    subject: 'Welcome to HedgeCo',
    html,
    text,
  });
}

export type NotificationType =
  | 'new_message'
  | 'fund_update'
  | 'document_shared'
  | 'meeting_scheduled'
  | 'performance_alert';

/**
 * Send notification email
 */
export async function sendNotification(
  user: { email: string; name: string },
  type: NotificationType,
  data: Record<string, unknown>
): Promise<EmailResult> {
  const firstName = user.name.split(' ')[0];

  const templates: Record<NotificationType, { subject: string; getMessage: () => string }> = {
    new_message: {
      subject: `New message from ${data.senderName || 'someone'}`,
      getMessage: () => `
        <p>Hi ${firstName},</p>
        <p>You have a new message from <strong>${data.senderName}</strong>:</p>
        <blockquote style="border-left: 3px solid #4299e1; padding-left: 15px; margin: 20px 0; color: #4a5568;">
          ${String(data.preview || '').substring(0, 200)}${String(data.preview || '').length > 200 ? '...' : ''}
        </blockquote>
        <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/messages/${data.conversationId}">View conversation →</a></p>
      `,
    },
    fund_update: {
      subject: `${data.fundName} - Performance Update`,
      getMessage: () => `
        <p>Hi ${firstName},</p>
        <p><strong>${data.fundName}</strong> has posted new performance data:</p>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr style="background: #f7fafc;">
            <td style="padding: 10px; border: 1px solid #e2e8f0;">MTD Return</td>
            <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;">${data.mtdReturn}%</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #e2e8f0;">YTD Return</td>
            <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;">${data.ytdReturn}%</td>
          </tr>
        </table>
        <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/funds/${data.fundId}">View full details →</a></p>
      `,
    },
    document_shared: {
      subject: `New document shared: ${data.documentName}`,
      getMessage: () => `
        <p>Hi ${firstName},</p>
        <p><strong>${data.sharedBy}</strong> has shared a document with you:</p>
        <p style="background: #f7fafc; padding: 15px; border-radius: 6px;">
          📄 <strong>${data.documentName}</strong>
        </p>
        <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/documents/${data.documentId}">View document →</a></p>
      `,
    },
    meeting_scheduled: {
      subject: `Meeting scheduled: ${data.meetingTitle}`,
      getMessage: () => `
        <p>Hi ${firstName},</p>
        <p>A meeting has been scheduled:</p>
        <div style="background: #f7fafc; padding: 20px; border-radius: 6px; margin: 20px 0;">
          <p style="margin: 0 0 10px;"><strong>${data.meetingTitle}</strong></p>
          <p style="margin: 0; color: #4a5568;">📅 ${data.dateTime}</p>
          ${data.location ? `<p style="margin: 5px 0 0; color: #4a5568;">📍 ${data.location}</p>` : ''}
        </div>
        <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/calendar">View calendar →</a></p>
      `,
    },
    performance_alert: {
      subject: `Performance Alert: ${data.fundName}`,
      getMessage: () => `
        <p>Hi ${firstName},</p>
        <p>Alert for <strong>${data.fundName}</strong>:</p>
        <div style="background: ${data.alertType === 'positive' ? '#c6f6d5' : '#fed7d7'}; padding: 15px; border-radius: 6px; margin: 20px 0;">
          <p style="margin: 0;">${data.alertMessage}</p>
        </div>
        <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/funds/${data.fundId}">View fund →</a></p>
      `,
    },
  };

  const template = templates[type];
  if (!template) {
    return { success: false, error: `Unknown notification type: ${type}` };
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1a202c; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #1a365d; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #ffffff; padding: 30px; border: 1px solid #e2e8f0; }
        .footer { background: #f7fafc; padding: 20px; text-align: center; font-size: 12px; color: #718096; border-radius: 0 0 8px 8px; }
        a { color: #2c5282; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2 style="margin: 0;">HedgeCo</h2>
        </div>
        <div class="content">
          ${template.getMessage()}
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} HedgeCo. All rights reserved.</p>
          <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/settings/notifications">Manage notification preferences</a></p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: user.email,
    subject: template.subject,
    html,
  });
}

/**
 * Send a batch of emails (for broadcasts/digests)
 */
export async function sendBatchEmails(
  recipients: Array<{ email: string; name: string; data?: Record<string, unknown> }>,
  template: { subject: string; html: (recipient: typeof recipients[0]) => string }
): Promise<{ sent: number; failed: number; errors: string[] }> {
  const results = { sent: 0, failed: 0, errors: [] as string[] };

  // Process in batches of 10 to avoid rate limits
  const batchSize = 10;
  for (let i = 0; i < recipients.length; i += batchSize) {
    const batch = recipients.slice(i, i + batchSize);
    const promises = batch.map(async (recipient) => {
      const result = await sendEmail({
        to: recipient.email,
        subject: template.subject,
        html: template.html(recipient),
      });
      if (result.success) {
        results.sent++;
      } else {
        results.failed++;
        if (result.error) {
          results.errors.push(`${recipient.email}: ${result.error}`);
        }
      }
    });

    await Promise.all(promises);

    // Small delay between batches
    if (i + batchSize < recipients.length) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  return results;
}

/**
 * Send email verification link to user
 */
export async function sendVerificationEmail(
  user: { email: string; name: string },
  verificationToken: string
): Promise<EmailResult> {
  const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/verify-email?token=${verificationToken}`;
  const firstName = user.name.split(' ')[0] || 'there';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1a202c; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #1a365d; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #ffffff; padding: 40px; border: 1px solid #e2e8f0; }
        .footer { background: #f7fafc; padding: 20px; text-align: center; font-size: 12px; color: #718096; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; background: #2c5282; color: white !important; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
        .button:hover { background: #2b4c6f; }
        .info-box { background: #ebf8ff; border: 1px solid #90cdf4; padding: 15px; border-radius: 6px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0;">Welcome to HedgeCo!</h1>
        </div>
        <div class="content">
          <p>Hi ${firstName},</p>
          <p>Thank you for registering with HedgeCo. Please verify your email address by clicking the button below:</p>
          
          <div style="text-align: center;">
            <a href="${verifyUrl}" class="button">Verify Email Address</a>
          </div>
          
          <div class="info-box">
            <p style="margin: 0;"><strong>What happens next?</strong></p>
            <ol style="margin: 10px 0 0; padding-left: 20px;">
              <li>Click the button above to verify your email</li>
              <li>Our team will review your account for accredited investor status</li>
              <li>Once approved, you'll have full access to fund details and documents</li>
            </ol>
          </div>
          
          <p style="color: #718096; font-size: 14px;">
            If you didn't create an account with HedgeCo, you can safely ignore this email.
          </p>
          
          <p style="color: #718096; font-size: 14px;">
            This link will expire in 24 hours. If you need a new verification link, 
            please <a href="${process.env.NEXT_PUBLIC_APP_URL}/resend-verification">request a new one</a>.
          </p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} HedgeCo. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: user.email,
    subject: 'Verify your HedgeCo account',
    html,
  });
}

/**
 * Send admin notification when a user needs review
 */
export async function sendAdminNewUserNotification(
  adminEmail: string,
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    company?: string;
  }
): Promise<EmailResult> {
  const reviewUrl = `${process.env.NEXT_PUBLIC_APP_URL}/admin/users/${user.id}`;
  const roleLabels: Record<string, string> = {
    INVESTOR: 'Investor',
    MANAGER: 'Fund Manager',
    SERVICE_PROVIDER: 'Service Provider',
    NEWS_MEMBER: 'News Member',
  };

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1a202c; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #744210; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #ffffff; padding: 30px; border: 1px solid #e2e8f0; }
        .footer { background: #f7fafc; padding: 20px; text-align: center; font-size: 12px; color: #718096; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; background: #744210; color: white !important; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; }
        .user-card { background: #fffaf0; border: 1px solid #ed8936; padding: 20px; border-radius: 6px; margin: 20px 0; }
        .badge { display: inline-block; background: #ed8936; color: white; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2 style="margin: 0;">🔔 New User Requires Review</h2>
        </div>
        <div class="content">
          <p>A new user has verified their email and needs accredited investor status review:</p>
          
          <div class="user-card">
            <p style="margin: 0 0 10px;"><span class="badge">${roleLabels[user.role] || user.role}</span></p>
            <p style="margin: 0 0 5px;"><strong>${user.name}</strong></p>
            <p style="margin: 0 0 5px; color: #4a5568;">${user.email}</p>
            ${user.company ? `<p style="margin: 0; color: #718096;">🏢 ${user.company}</p>` : ''}
          </div>
          
          <div style="text-align: center;">
            <a href="${reviewUrl}" class="button">Review User</a>
          </div>
          
          <p style="color: #718096; font-size: 14px; margin-top: 20px;">
            You can also view all pending users in the <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/users?status=pending">Admin Dashboard</a>.
          </p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} HedgeCo Admin</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: adminEmail,
    subject: `[Action Required] New ${roleLabels[user.role] || 'User'} needs review: ${user.name}`,
    html,
  });
}

/**
 * Send approval notification to user
 */
export async function sendAccreditedApprovalEmail(
  user: { email: string; name: string }
): Promise<EmailResult> {
  const loginUrl = `${process.env.NEXT_PUBLIC_APP_URL}/login`;
  const firstName = user.name.split(' ')[0] || 'there';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1a202c; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #276749; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #ffffff; padding: 40px; border: 1px solid #e2e8f0; }
        .footer { background: #f7fafc; padding: 20px; text-align: center; font-size: 12px; color: #718096; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; background: #276749; color: white !important; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
        .feature-list { background: #f0fff4; border: 1px solid #9ae6b4; padding: 20px; border-radius: 6px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0;">✅ You're Approved!</h1>
        </div>
        <div class="content">
          <p>Hi ${firstName},</p>
          <p>Great news! Your accredited investor status has been approved. You now have full access to HedgeCo.</p>
          
          <div class="feature-list">
            <p style="margin: 0 0 10px;"><strong>You can now:</strong></p>
            <ul style="margin: 0; padding-left: 20px;">
              <li>View complete fund and SPV details</li>
              <li>Access fund documents and performance data</li>
              <li>Contact fund managers directly</li>
              <li>Request meetings and make inquiries</li>
            </ul>
          </div>
          
          <div style="text-align: center;">
            <a href="${loginUrl}" class="button">Log In & Explore</a>
          </div>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} HedgeCo. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: user.email,
    subject: 'Your HedgeCo account is approved!',
    html,
  });
}

/**
 * Send rejection notification to user
 */
export async function sendAccreditedRejectionEmail(
  user: { email: string; name: string },
  reason: string
): Promise<EmailResult> {
  const supportUrl = `${process.env.NEXT_PUBLIC_APP_URL}/support`;
  const firstName = user.name.split(' ')[0] || 'there';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1a202c; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #742a2a; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #ffffff; padding: 40px; border: 1px solid #e2e8f0; }
        .footer { background: #f7fafc; padding: 20px; text-align: center; font-size: 12px; color: #718096; border-radius: 0 0 8px 8px; }
        .reason-box { background: #fff5f5; border: 1px solid #fc8181; padding: 20px; border-radius: 6px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0;">Account Review Update</h1>
        </div>
        <div class="content">
          <p>Hi ${firstName},</p>
          <p>Thank you for your interest in HedgeCo. After reviewing your application, we were unable to verify your accredited investor status at this time.</p>
          
          <div class="reason-box">
            <p style="margin: 0 0 5px;"><strong>Reason:</strong></p>
            <p style="margin: 0;">${reason}</p>
          </div>
          
          <p>If you believe this was in error or have additional documentation to support your accredited investor status, please contact our support team.</p>
          
          <p>
            <a href="${supportUrl}">Contact Support →</a>
          </p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} HedgeCo. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: user.email,
    subject: 'Update on your HedgeCo application',
    html,
  });
}

// Import React email templates
import { render } from '@react-email/render';
import {
  InvestorManagerRegistrationEmail,
  ServiceProviderRegistrationEmail,
  NewsMemberRegistrationEmail,
} from './templates/registration';

/**
 * Send investor or fund manager registration autoresponder
 */
export async function sendInvestorManagerRegistrationEmail(
  user: { email: string; firstName: string },
  type: 'investor' | 'manager',
  confirmUrl: string
): Promise<EmailResult> {
  const today = new Date();
  const formattedDate = `${today.getDate().toString().padStart(2, '0')}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getFullYear()}`;
  
  const subject = type === 'investor' 
    ? 'Investor Welcome to HedgeCo.Net'
    : `Manager Welcome to HedgeCo.Net ${formattedDate}`;

  const html = await render(
    InvestorManagerRegistrationEmail({
      firstName: user.firstName,
      email: user.email,
      confirmUrl,
      type,
    })
  );

  return sendEmail({
    to: user.email,
    subject,
    html,
    from: 'HedgeCo.Net Support <support@hedgeco.net>',
    replyTo: 'support@hedgeco.net',
  });
}

/**
 * Send service provider registration autoresponder
 */
export async function sendServiceProviderRegistrationEmail(
  user: { email: string; firstName: string },
  confirmUrl: string
): Promise<EmailResult> {
  const html = await render(
    ServiceProviderRegistrationEmail({
      firstName: user.firstName,
      email: user.email,
      confirmUrl,
    })
  );

  return sendEmail({
    to: user.email,
    subject: 'HedgeCo.Net - Service Provider Listing',
    html,
    from: 'HedgeCo.Net Support <support@hedgeco.net>',
    replyTo: 'support@hedgeco.net',
  });
}

/**
 * Send news member registration autoresponder
 */
export async function sendNewsMemberRegistrationEmail(
  user: { email: string; firstName: string },
  activateUrl: string
): Promise<EmailResult> {
  const html = await render(
    NewsMemberRegistrationEmail({
      firstName: user.firstName,
      email: user.email,
      activateUrl,
    })
  );

  return sendEmail({
    to: user.email,
    subject: 'News Member',
    html,
    from: 'HedgeCo.Net Support <support@hedgeco.net>',
    replyTo: 'support@hedgeco.net',
  });
}

/**
 * Send admin notification for new registration
 */
export async function sendAdminNewRegistrationNotification(
  adminEmail: string,
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    company?: string;
  }
): Promise<EmailResult> {
  const reviewUrl = `${process.env.NEXT_PUBLIC_APP_URL}/admin/users/${user.id}`;
  const roleLabels: Record<string, string> = {
    INVESTOR: 'Investor',
    MANAGER: 'Fund Manager',
    SERVICE_PROVIDER: 'Service Provider',
    NEWS_MEMBER: 'News Member',
  };

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1a202c; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #744210; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #ffffff; padding: 30px; border: 1px solid #e2e8f0; }
        .footer { background: #f7fafc; padding: 20px; text-align: center; font-size: 12px; color: #718096; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; background: #744210; color: white !important; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; }
        .user-card { background: #fffaf0; border: 1px solid #ed8936; padding: 20px; border-radius: 6px; margin: 20px 0; }
        .badge { display: inline-block; background: #ed8936; color: white; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2 style="margin: 0;">🔔 New ${roleLabels[user.role] || user.role} Registration</h2>
        </div>
        <div class="content">
          <p>A new ${roleLabels[user.role]?.toLowerCase() || 'user'} has registered and needs review:</p>
          
          <div class="user-card">
            <p style="margin: 0 0 10px;"><span class="badge">${roleLabels[user.role] || user.role}</span></p>
            <p style="margin: 0 0 5px;"><strong>${user.firstName} ${user.lastName}</strong></p>
            <p style="margin: 0 0 5px; color: #4a5568;">${user.email}</p>
            ${user.company ? `<p style="margin: 0; color: #718096;">🏢 ${user.company}</p>` : ''}
            <p style="margin: 10px 0 0; color: #718096; font-size: 12px;">
              Registered: ${new Date().toLocaleString()}
            </p>
          </div>
          
          <div style="text-align: center;">
            <a href="${reviewUrl}" class="button">Review Registration</a>
          </div>
          
          <p style="color: #718096; font-size: 14px; margin-top: 20px;">
            You can also view all pending registrations in the 
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/registrations">Admin Dashboard</a>.
          </p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} HedgeCo.Net Admin</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: adminEmail,
    subject: `[Action Required] New ${roleLabels[user.role] || 'User'} Registration: ${user.firstName} ${user.lastName}`,
    html,
    from: 'HedgeCo.Net System <system@hedgeco.net>',
  });
}
