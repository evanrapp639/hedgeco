// Weekly Digest Email Template
// Summary of activity sent weekly to users

import React from 'react';

export interface FundHighlight {
  name: string;
  id: string;
  mtdReturn: number;
  change: 'up' | 'down' | 'flat';
}

export interface WeeklyDigestEmailProps {
  recipientName: string;
  weekOf: string;
  stats: {
    newMessages: number;
    fundUpdates: number;
    newFunds: number;
    upcomingMeetings: number;
  };
  topPerformers: FundHighlight[];
  recentMessages: Array<{
    senderName: string;
    preview: string;
    conversationId: string;
  }>;
  savedFundUpdates: Array<{
    name: string;
    id: string;
    mtdReturn: number;
  }>;
  appUrl?: string;
}

const formatPercent = (value: number): string => {
  const sign = value >= 0 ?'+':'';
  return `${sign}${value.toFixed(2)}%`;
};

export const WeeklyDigestEmail: React.FC<WeeklyDigestEmailProps> = ({
  recipientName,
  weekOf,
  stats,
  topPerformers,
  recentMessages,
  savedFundUpdates,
  appUrl = 'https://hedgeco.com',
}) => {
  const firstName = recipientName.split(' ')[0];

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
              .header { background: linear-gradient(135deg, #1a365d 0%, #2c5282 100%); color: white; padding: 30px; text-align: center; }
              .header h1 { margin: 0 0 5px; font-size: 24px; font-weight: 700; }
              .header p { margin: 0; opacity: 0.9; font-size: 14px; }
              .content { padding: 30px; }
              .stats-bar { display: table; width: 100%; background: #f7fafc; border-radius: 8px; margin: 20px 0; }
              .stats-bar-inner { display: table-row; }
              .stat-item { display: table-cell; text-align: center; padding: 15px; }
              .stat-number { font-size: 24px; font-weight: 700; color: #2c5282; }
              .stat-label { font-size: 11px; color: #718096; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 3px; }
              .section { margin: 30px 0; }
              .section-title { font-size: 16px; font-weight: 600; color: #1a365d; margin: 0 0 15px; padding-bottom: 10px; border-bottom: 2px solid #e2e8f0; }
              .fund-list { list-style: none; padding: 0; margin: 0; }
              .fund-item { display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #e2e8f0; }
              .fund-item:last-child { border-bottom: none; }
              .fund-name { font-weight: 500; color: #1a202c; }
              .fund-name a { color: inherit; text-decoration: none; }
              .fund-name a:hover { color: #2c5282; }
              .fund-return { font-weight: 600; }
              .positive { color: #38a169; }
              .negative { color: #e53e3e; }
              .message-list { list-style: none; padding: 0; margin: 0; }
              .message-item { padding: 12px 0; border-bottom: 1px solid #e2e8f0; }
              .message-item:last-child { border-bottom: none; }
              .message-sender { font-weight: 600; color: #1a202c; margin-bottom: 3px; }
              .message-preview { font-size: 14px; color: #718096; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
              .message-preview a { color: #4299e1; text-decoration: none; }
              .cta { text-align: center; margin: 30px 0 10px; }
              .cta-button { display: inline-block; background: #2c5282; color: white !important; padding: 14px 35px; text-decoration: none; border-radius: 8px; font-weight: 600; }
              .empty-state { text-align: center; padding: 20px; color: #718096; font-style: italic; }
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
              <h1>📈 Your Weekly Digest</h1>
              <p>Week of {weekOf}</p>
            </div>

            <div className="content">
              <p>Hi {firstName},</p>
              <p>Here&apos;s what happened on HedgeCo this week:</p>

              {/* Stats Bar */}
              <table className="stats-bar">
                <tbody>
                  <tr className="stats-bar-inner">
                    <td className="stat-item">
                      <div className="stat-number">{stats.newMessages}</div>
                      <div className="stat-label">Messages</div>
                    </td>
                    <td className="stat-item">
                      <div className="stat-number">{stats.fundUpdates}</div>
                      <div className="stat-label">Fund Updates</div>
                    </td>
                    <td className="stat-item">
                      <div className="stat-number">{stats.newFunds}</div>
                      <div className="stat-label">New Funds</div>
                    </td>
                    <td className="stat-item">
                      <div className="stat-number">{stats.upcomingMeetings}</div>
                      <div className="stat-label">Meetings</div>
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Top Performers */}
              <div className="section">
                <h2 className="section-title">🏆 Top Performers This Month</h2>
                {topPerformers.length > 0 ? (
                  <ul className="fund-list">
                    {topPerformers.slice(0, 5).map((fund) => (
                      <li key={fund.id} className="fund-item">
                        <span className="fund-name">
                          <a href={`${appUrl}/funds/${fund.id}`}>{fund.name}</a>
                        </span>
                        <span
                          className={`fund-return ${fund.mtdReturn >= 0 ? 'positive' : 'negative'}`}
                        >
                          {formatPercent(fund.mtdReturn)}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="empty-state">No performance data this week</div>
                )}
              </div>

              {/* Saved Funds Updates */}
              {savedFundUpdates.length > 0 && (
                <div className="section">
                  <h2 className="section-title">⭐ Your Saved Funds</h2>
                  <ul className="fund-list">
                    {savedFundUpdates.slice(0, 5).map((fund) => (
                      <li key={fund.id} className="fund-item">
                        <span className="fund-name">
                          <a href={`${appUrl}/funds/${fund.id}`}>{fund.name}</a>
                        </span>
                        <span
                          className={`fund-return ${fund.mtdReturn >= 0 ? 'positive' : 'negative'}`}
                        >
                          {formatPercent(fund.mtdReturn)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Recent Messages */}
              {recentMessages.length > 0 && (
                <div className="section">
                  <h2 className="section-title">💬 Recent Messages</h2>
                  <ul className="message-list">
                    {recentMessages.slice(0, 3).map((msg) => (
                      <li key={msg.conversationId} className="message-item">
                        <div className="message-sender">{msg.senderName}</div>
                        <div className="message-preview">
                          {msg.preview.substring(0, 80)}
                          {msg.preview.length >80?'...':''}
                          <a href={`${appUrl}/messages/${msg.conversationId}`}>Read more</a>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="cta">
                <a href={`${appUrl}/dashboard`} className="cta-button">
                  View Dashboard →
                </a>
              </div>
            </div>

            <div className="footer">
              <p>© {new Date().getFullYear()} HedgeCo. All rights reserved.</p>
              <p>
                <a href={`${appUrl}/settings/notifications`}>Manage digest preferences</a>
                {' · '}
                <a href={`${appUrl}/unsubscribe?type=digest`}>Unsubscribe from digest</a>
              </p>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
};

export default WeeklyDigestEmail;
