// Fund Update Email Template
// Sent when a fund posts new performance data

import React from 'react';

export interface FundUpdateEmailProps {
  recipientName: string;
  fundName: string;
  fundId: string;
  strategy: string;
  mtdReturn: number;
  ytdReturn: number;
  oneYearReturn?: number;
  sharpeRatio?: number;
  aum?: number;
  asOfDate: string;
  appUrl?: string;
}

const formatPercent = (value: number): string => {
  const sign = value >= 0 ?'+':'';
  return `${sign}${value.toFixed(2)}%`;
};

const formatCurrency = (value: number): string => {
  if (value >= 1e9) {
    return `$${(value / 1e9).toFixed(1)}B`;
  }
  if (value >= 1e6) {
    return `$${(value / 1e6).toFixed(1)}M`;
  }
  return `$${value.toLocaleString()}`;
};

export const FundUpdateEmail: React.FC<FundUpdateEmailProps> = ({
  recipientName,
  fundName,
  fundId,
  strategy,
  mtdReturn,
  ytdReturn,
  oneYearReturn,
  sharpeRatio,
  aum,
  asOfDate,
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
              .header { background: #1a365d; color: white; padding: 25px 30px; }
              .header h1 { margin: 0; font-size: 20px; font-weight: 600; }
              .header p { margin: 5px 0 0; opacity: 0.8; font-size: 14px; }
              .content { padding: 30px; }
              .fund-card { background: #f7fafc; border-radius: 10px; padding: 25px; margin: 20px 0; }
              .fund-name { font-size: 22px; font-weight: 700; color: #1a365d; margin: 0 0 5px; }
              .fund-strategy { font-size: 14px; color: #718096; margin: 0; }
              .stats-grid { display: table; width: 100%; margin: 25px 0; border-collapse: collapse; }
              .stats-row { display: table-row; }
              .stat-box { display: table-cell; text-align: center; padding: 15px; border: 1px solid #e2e8f0; }
              .stat-label { font-size: 11px; color: #718096; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 5px; }
              .stat-value { font-size: 20px; font-weight: 700; }
              .stat-positive { color: #38a169; }
              .stat-negative { color: #e53e3e; }
              .stat-neutral { color: #1a202c; }
              .date-badge { font-size: 12px; color: #718096; text-align: right; margin-top: 15px; }
              .cta { text-align: center; margin: 30px 0 20px; }
              .cta-button { display: inline-block; background: #2c5282; color: white !important; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; }
              .footer { padding: 20px 30px; background: #f7fafc; text-align: center; font-size: 12px; color: #718096; }
            `,
          }}
        />
      </head>
      <body>
        <div className="container">
          <div className="card">
            <div className="header">
              <h1>📊 Performance Update</h1>
              <p>A fund you follow has posted new data</p>
            </div>

            <div className="content">
              <p>Hi {firstName},</p>
              <p>
                <strong>{fundName}</strong> has updated their performance figures.
                Here&apos;s a snapshot:
              </p>

              <div className="fund-card">
                <h2 className="fund-name">{fundName}</h2>
                <p className="fund-strategy">{strategy}</p>

                <table className="stats-grid">
                  <tbody>
                    <tr className="stats-row">
                      <td className="stat-box">
                        <div className="stat-label">MTD Return</div>
                        <div
                          className={`stat-value ${mtdReturn >= 0 ? 'stat-positive' : 'stat-negative'}`}
                        >
                          {formatPercent(mtdReturn)}
                        </div>
                      </td>
                      <td className="stat-box">
                        <div className="stat-label">YTD Return</div>
                        <div
                          className={`stat-value ${ytdReturn >= 0 ? 'stat-positive' : 'stat-negative'}`}
                        >
                          {formatPercent(ytdReturn)}
                        </div>
                      </td>
                      {oneYearReturn !== undefined && (
                        <td className="stat-box">
                          <div className="stat-label">1 Year</div>
                          <div
                            className={`stat-value ${oneYearReturn >= 0 ? 'stat-positive' : 'stat-negative'}`}
                          >
                            {formatPercent(oneYearReturn)}
                          </div>
                        </td>
                      )}
                    </tr>
                    <tr className="stats-row">
                      {sharpeRatio !== undefined && (
                        <td className="stat-box">
                          <div className="stat-label">Sharpe Ratio</div>
                          <div className="stat-value stat-neutral">{sharpeRatio.toFixed(2)}</div>
                        </td>
                      )}
                      {aum !== undefined && (
                        <td className="stat-box">
                          <div className="stat-label">AUM</div>
                          <div className="stat-value stat-neutral">{formatCurrency(aum)}</div>
                        </td>
                      )}
                      <td className="stat-box" />
                    </tr>
                  </tbody>
                </table>

                <div className="date-badge">Data as of {asOfDate}</div>
              </div>

              <div className="cta">
                <a href={`${appUrl}/funds/${fundId}`} className="cta-button">
                  View Full Details →
                </a>
              </div>
            </div>

            <div className="footer">
              <p>© {new Date().getFullYear()} HedgeCo. All rights reserved.</p>
              <p>
                <a href={`${appUrl}/settings/notifications`}>Manage notifications</a>
              </p>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
};

export default FundUpdateEmail;
