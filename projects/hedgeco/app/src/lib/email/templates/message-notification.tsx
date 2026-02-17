// Message Notification Email Template
// Sent when user receives a new message

import React from 'react';

export interface MessageNotificationEmailProps {
  recipientName: string;
  senderName: string;
  senderRole?: string;
  senderCompany?: string;
  senderAvatarUrl?: string;
  messagePreview: string;
  conversationId: string;
  sentAt: string;
  appUrl?: string;
}

export const MessageNotificationEmail: React.FC<MessageNotificationEmailProps> = ({
  recipientName,
  senderName,
  senderRole,
  senderCompany,
  messagePreview,
  conversationId,
  sentAt,
  appUrl = 'https://hedgeco.com',
}) => {
  const firstName = recipientName.split(' ')[0];
  const senderInitials = senderName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <html>
      <head>
        <style
          dangerouslySetInnerHTML={{
            __html: `
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                line-height: 1.6;
                color: #1a202c;
                margin: 0;
                padding: 0;
                background: #f7fafc;
              }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .card { background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
              .header { background: #1a365d; color: white; padding: 20px 30px; }
              .header h1 { margin: 0; font-size: 18px; font-weight: 600; }
              .content { padding: 30px; }
              .message-card { background: #f7fafc; border-radius: 12px; padding: 20px; margin: 20px 0; border-left: 4px solid #4299e1; }
              .sender-info { display: flex; align-items: center; margin-bottom: 15px; }
              .avatar { width: 48px; height: 48px; border-radius: 50%; background: linear-gradient(135deg, #4299e1 0%, #2c5282 100%); color: white; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 16px; margin-right: 12px; }
              .sender-details h3 { margin: 0; font-size: 16px; color: #1a202c; }
              .sender-details p { margin: 3px 0 0; font-size: 13px; color: #718096; }
              .message-text { font-size: 15px; color: #4a5568; line-height: 1.7; margin: 0; white-space: pre-wrap; }
              .timestamp { font-size: 12px; color: #a0aec0; margin-top: 15px; text-align: right; }
              .cta { text-align: center; margin: 25px 0 15px; }
              .cta-button { display: inline-block; background: #2c5282; color: white !important; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; }
              .cta-secondary { display: block; margin-top: 10px; font-size: 13px; color: #718096; }
              .footer { padding: 20px 30px; background: #f7fafc; text-align: center; font-size: 12px; color: #718096; }
              .footer a { color: #4a5568; }
            `,
          }}
        />
      </head>
      <body>
        <div className="container">
          <div className="card">
            <div className="header">
              <h1>💬 New Message</h1>
            </div>

            <div className="content">
              <p>Hi {firstName},</p>
              <p>You&apos;ve received a new message on HedgeCo:</p>

              <div className="message-card">
                <div className="sender-info">
                  <div className="avatar">{senderInitials}</div>
                  <div className="sender-details">
                    <h3>{senderName}</h3>
                    <p>
                      {senderRole}
                      {senderCompany && ` at ${senderCompany}`}
                    </p>
                  </div>
                </div>
                <p className="message-text">{messagePreview}</p>
                <div className="timestamp">{sentAt}</div>
              </div>

              <div className="cta">
                <a href={`${appUrl}/messages/${conversationId}`} className="cta-button">
                  View & Reply →
                </a>
                <span className="cta-secondary">
                  Or reply directly to this email
                </span>
              </div>
            </div>

            <div className="footer">
              <p>© {new Date().getFullYear()} HedgeCo. All rights reserved.</p>
              <p>
                <a href={`${appUrl}/settings/notifications`}>
                  Manage message notifications
                </a>
              </p>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
};

export default MessageNotificationEmail;
