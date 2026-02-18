// HedgeCo.Net Database Seed Script
// Creates sample data for development

import { PrismaClient, UserRole, FundType, FundStatus, InvestorType } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clean existing data
  await prisma.fundReturn.deleteMany();
  await prisma.fundStatistics.deleteMany();
  await prisma.fundDocument.deleteMany();
  await prisma.fundInquiry.deleteMany();
  await prisma.watchlist.deleteMany();
  await prisma.fund.deleteMany();
  await prisma.serviceProvider.deleteMany();
  await prisma.conference.deleteMany();
  await prisma.message.deleteMany();
  await prisma.userActivity.deleteMany();
  await prisma.savedSearch.deleteMany();
  await prisma.session.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.profile.deleteMany();
  await prisma.user.deleteMany();

  // Create password hash (password: "password123")
  const passwordHash = await hash('password123', 12);

  // ============================================================
  // USERS
  // ============================================================

  // Admin user
  const admin = await prisma.user.create({
    data: {
      email: 'admin@hedgeco.net',
      passwordHash,
      role: UserRole.ADMIN,
      emailVerified: new Date(),
      profile: {
        create: {
          firstName: 'Admin',
          lastName: 'User',
          company: 'HedgeCo.Net',
          title: 'Administrator',
        },
      },
    },
  });
  console.log('✅ Created admin user:', admin.email);

  // Fund managers
  const manager1 = await prisma.user.create({
    data: {
      email: 'john.smith@alphacapital.com',
      passwordHash,
      role: UserRole.MANAGER,
      emailVerified: new Date(),
      profile: {
        create: {
          firstName: 'John',
          lastName: 'Smith',
          company: 'Alpha Capital Management',
          title: 'Managing Partner',
          city: 'New York',
          state: 'NY',
          country: 'US',
        },
      },
    },
  });

  const manager2 = await prisma.user.create({
    data: {
      email: 'sarah.chen@quantumhedge.com',
      passwordHash,
      role: UserRole.MANAGER,
      emailVerified: new Date(),
      profile: {
        create: {
          firstName: 'Sarah',
          lastName: 'Chen',
          company: 'Quantum Hedge Partners',
          title: 'Chief Investment Officer',
          city: 'San Francisco',
          state: 'CA',
          country: 'US',
        },
      },
    },
  });

  const manager3 = await prisma.user.create({
    data: {
      email: 'michael.brown@crescentpe.com',
      passwordHash,
      role: UserRole.MANAGER,
      emailVerified: new Date(),
      profile: {
        create: {
          firstName: 'Michael',
          lastName: 'Brown',
          company: 'Crescent Private Equity',
          title: 'Founder & CEO',
          city: 'Boston',
          state: 'MA',
          country: 'US',
        },
      },
    },
  });
  console.log('✅ Created 3 fund managers');

  // Investors
  const investor1 = await prisma.user.create({
    data: {
      email: 'investor@example.com',
      passwordHash,
      role: UserRole.INVESTOR,
      emailVerified: new Date(),
      profile: {
        create: {
          firstName: 'Robert',
          lastName: 'Johnson',
          company: 'Johnson Family Office',
          title: 'Principal',
          accredited: true,
          accreditedAt: new Date('2025-01-15'),
          accreditationExpires: new Date('2026-01-15'),
          investorType: InvestorType.FAMILY_OFFICE,
          city: 'Greenwich',
          state: 'CT',
          country: 'US',
        },
      },
    },
  });

  const investor2 = await prisma.user.create({
    data: {
      email: 'emma.williams@pensionco.com',
      passwordHash,
      role: UserRole.INVESTOR,
      emailVerified: new Date(),
      profile: {
        create: {
          firstName: 'Emma',
          lastName: 'Williams',
          company: 'State Pension Fund',
          title: 'Director of Alternatives',
          accredited: true,
          accreditedAt: new Date('2025-06-01'),
          accreditationExpires: new Date('2026-06-01'),
          investorType: InvestorType.PENSION,
          city: 'Sacramento',
          state: 'CA',
          country: 'US',
        },
      },
    },
  });
  console.log('✅ Created 2 investors');

  // ============================================================
  // FUNDS
  // ============================================================

  // Long/Short Equity Fund
  const fund1 = await prisma.fund.create({
    data: {
      name: 'Alpha Equity Partners',
      slug: 'alpha-equity-partners',
      type: FundType.HEDGE_FUND,
      strategy: 'Long/Short Equity',
      subStrategy: 'US Large Cap',
      managerId: manager1.id,
      description: `Alpha Equity Partners employs a fundamental, bottom-up approach to long/short equity investing, 
focusing on US large-cap stocks. Our investment team leverages deep sector expertise and rigorous 
due diligence to identify mispriced securities across the market cap spectrum.

The fund targets absolute returns with lower volatility than the broader equity market through 
careful position sizing and active risk management.`,
      aum: 850000000,
      aumDate: new Date('2026-01-31'),
      inceptionDate: new Date('2018-03-15'),
      managementFee: 0.02,
      performanceFee: 0.20,
      highWaterMark: true,
      minInvestment: 1000000,
      lockupPeriod: '12 months',
      redemptionTerms: 'Quarterly with 90 days notice',
      legalStructure: 'Delaware LP',
      domicile: 'United States',
      regulator: 'SEC',
      country: 'US',
      state: 'NY',
      city: 'New York',
      status: FundStatus.APPROVED,
      visible: true,
      featured: true,
      primaryBenchmark: 'S&P 500',
      approvedAt: new Date('2018-03-01'),
    },
  });

  // Quantitative Fund
  const fund2 = await prisma.fund.create({
    data: {
      name: 'Quantum Alpha Fund',
      slug: 'quantum-alpha-fund',
      type: FundType.HEDGE_FUND,
      strategy: 'Quantitative',
      subStrategy: 'Statistical Arbitrage',
      managerId: manager2.id,
      description: `Quantum Alpha Fund utilizes proprietary machine learning algorithms and statistical models 
to identify short-term pricing inefficiencies across global equity markets. Our systematic approach 
combines fundamental factor analysis with technical signals to generate alpha.

The fund maintains market-neutral positioning with strict risk controls and high portfolio turnover.`,
      aum: 2300000000,
      aumDate: new Date('2026-01-31'),
      inceptionDate: new Date('2015-09-01'),
      managementFee: 0.025,
      performanceFee: 0.25,
      highWaterMark: true,
      minInvestment: 5000000,
      lockupPeriod: '24 months',
      redemptionTerms: 'Quarterly with 45 days notice',
      legalStructure: 'Cayman Islands Ltd',
      domicile: 'Cayman Islands',
      regulator: 'SEC',
      country: 'US',
      state: 'CA',
      city: 'San Francisco',
      status: FundStatus.APPROVED,
      visible: true,
      featured: true,
      primaryBenchmark: 'HFRI Equity Market Neutral',
      approvedAt: new Date('2015-08-15'),
    },
  });

  // Private Equity Fund
  const fund3 = await prisma.fund.create({
    data: {
      name: 'Crescent Growth Fund III',
      slug: 'crescent-growth-fund-iii',
      type: FundType.PRIVATE_EQUITY,
      strategy: 'Growth Equity',
      subStrategy: 'Technology',
      managerId: manager3.id,
      description: `Crescent Growth Fund III focuses on growth-stage technology companies with proven business 
models and strong unit economics. We partner with exceptional management teams to accelerate growth 
through operational improvements, strategic guidance, and follow-on capital.

Target companies have $10-50M in revenue with clear paths to profitability and market leadership.`,
      aum: 750000000,
      aumDate: new Date('2026-01-31'),
      inceptionDate: new Date('2023-06-01'),
      managementFee: 0.02,
      performanceFee: 0.20,
      hurdleRate: 0.08,
      highWaterMark: true,
      minInvestment: 10000000,
      lockupPeriod: '10 years',
      redemptionTerms: 'Closed-end fund',
      legalStructure: 'Delaware LP',
      domicile: 'United States',
      regulator: 'SEC',
      country: 'US',
      state: 'MA',
      city: 'Boston',
      status: FundStatus.APPROVED,
      visible: true,
      primaryBenchmark: 'Cambridge PE Index',
      approvedAt: new Date('2023-05-15'),
    },
  });

  // Crypto Fund
  const fund4 = await prisma.fund.create({
    data: {
      name: 'Digital Asset Opportunities',
      slug: 'digital-asset-opportunities',
      type: FundType.CRYPTO,
      strategy: 'Multi-Strategy',
      subStrategy: 'DeFi & Layer 1',
      managerId: manager2.id,
      description: `Digital Asset Opportunities is a multi-strategy crypto fund investing across the digital 
asset ecosystem including Layer 1 protocols, DeFi applications, and infrastructure projects.

Our approach combines fundamental analysis of tokenomics and technology with quantitative 
on-chain analytics to identify asymmetric opportunities in this emerging asset class.`,
      aum: 180000000,
      aumDate: new Date('2026-01-31'),
      inceptionDate: new Date('2021-01-15'),
      managementFee: 0.025,
      performanceFee: 0.25,
      highWaterMark: true,
      minInvestment: 500000,
      lockupPeriod: '6 months',
      redemptionTerms: 'Monthly with 30 days notice',
      legalStructure: 'Cayman Islands Ltd',
      domicile: 'Cayman Islands',
      country: 'US',
      state: 'CA',
      city: 'San Francisco',
      status: FundStatus.APPROVED,
      visible: true,
      primaryBenchmark: 'Bitcoin',
      approvedAt: new Date('2021-01-01'),
    },
  });

  // Venture Capital Fund
  const fund5 = await prisma.fund.create({
    data: {
      name: 'Horizon Ventures Fund II',
      slug: 'horizon-ventures-fund-ii',
      type: FundType.VENTURE_CAPITAL,
      strategy: 'Early Stage',
      subStrategy: 'AI & Enterprise Software',
      managerId: manager3.id,
      description: `Horizon Ventures Fund II invests in seed and Series A companies building AI-native 
enterprise software. We look for technical founders with deep domain expertise solving 
meaningful problems in large markets.

Our portfolio companies benefit from our extensive network of enterprise buyers, 
technical advisors, and follow-on investors.`,
      aum: 120000000,
      aumDate: new Date('2026-01-31'),
      inceptionDate: new Date('2024-03-01'),
      managementFee: 0.025,
      performanceFee: 0.20,
      highWaterMark: true,
      minInvestment: 2500000,
      lockupPeriod: '10 years',
      redemptionTerms: 'Closed-end fund',
      legalStructure: 'Delaware LP',
      domicile: 'United States',
      regulator: 'SEC',
      country: 'US',
      state: 'MA',
      city: 'Boston',
      status: FundStatus.APPROVED,
      visible: true,
      primaryBenchmark: 'Cambridge VC Index',
      approvedAt: new Date('2024-02-15'),
    },
  });

  console.log('✅ Created 5 funds');

  // ============================================================
  // FUND RETURNS (for Fund 1 - Alpha Equity Partners)
  // ============================================================

  const fund1Returns = [
    { year: 2024, month: 1, netReturn: 0.0215 },
    { year: 2024, month: 2, netReturn: 0.0189 },
    { year: 2024, month: 3, netReturn: -0.0087 },
    { year: 2024, month: 4, netReturn: 0.0312 },
    { year: 2024, month: 5, netReturn: 0.0156 },
    { year: 2024, month: 6, netReturn: 0.0078 },
    { year: 2024, month: 7, netReturn: 0.0234 },
    { year: 2024, month: 8, netReturn: -0.0145 },
    { year: 2024, month: 9, netReturn: 0.0198 },
    { year: 2024, month: 10, netReturn: 0.0267 },
    { year: 2024, month: 11, netReturn: 0.0345 },
    { year: 2024, month: 12, netReturn: 0.0123 },
    { year: 2025, month: 1, netReturn: 0.0187 },
    { year: 2025, month: 2, netReturn: 0.0156 },
    { year: 2025, month: 3, netReturn: -0.0067 },
    { year: 2025, month: 4, netReturn: 0.0289 },
    { year: 2025, month: 5, netReturn: 0.0134 },
    { year: 2025, month: 6, netReturn: 0.0212 },
    { year: 2025, month: 7, netReturn: 0.0178 },
    { year: 2025, month: 8, netReturn: -0.0098 },
    { year: 2025, month: 9, netReturn: 0.0234 },
    { year: 2025, month: 10, netReturn: 0.0312 },
    { year: 2025, month: 11, netReturn: 0.0189 },
    { year: 2025, month: 12, netReturn: 0.0145 },
    { year: 2026, month: 1, netReturn: 0.0167 },
  ];

  for (const ret of fund1Returns) {
    await prisma.fundReturn.create({
      data: {
        fundId: fund1.id,
        year: ret.year,
        month: ret.month,
        netReturn: ret.netReturn,
        source: 'MANAGER',
      },
    });
  }

  // Fund 2 returns (Quantum Alpha)
  const fund2Returns = [
    { year: 2024, month: 1, netReturn: 0.0089 },
    { year: 2024, month: 2, netReturn: 0.0112 },
    { year: 2024, month: 3, netReturn: 0.0078 },
    { year: 2024, month: 4, netReturn: 0.0156 },
    { year: 2024, month: 5, netReturn: 0.0098 },
    { year: 2024, month: 6, netReturn: 0.0134 },
    { year: 2024, month: 7, netReturn: 0.0167 },
    { year: 2024, month: 8, netReturn: -0.0045 },
    { year: 2024, month: 9, netReturn: 0.0123 },
    { year: 2024, month: 10, netReturn: 0.0189 },
    { year: 2024, month: 11, netReturn: 0.0212 },
    { year: 2024, month: 12, netReturn: 0.0145 },
    { year: 2025, month: 1, netReturn: 0.0098 },
  ];

  for (const ret of fund2Returns) {
    await prisma.fundReturn.create({
      data: {
        fundId: fund2.id,
        year: ret.year,
        month: ret.month,
        netReturn: ret.netReturn,
        source: 'MANAGER',
      },
    });
  }

  console.log('✅ Created fund returns');

  // ============================================================
  // FUND STATISTICS (pre-calculated for Fund 1)
  // ============================================================

  await prisma.fundStatistics.create({
    data: {
      fundId: fund1.id,
      totalReturn: 0.4523,
      cagr: 0.1245,
      ytdReturn: 0.0167,
      oneYearReturn: 0.2156,
      threeYearReturn: 0.1189,
      volatility: 0.0845,
      sharpeRatio: 1.47,
      sortinoRatio: 2.12,
      calmarRatio: 1.89,
      maxDrawdown: -0.0658,
      maxDrawdownDate: new Date('2024-08-15'),
      currentDrawdown: 0,
      bestMonth: 0.0345,
      worstMonth: -0.0145,
      avgMonthlyReturn: 0.0165,
      positiveMonths: 22,
      negativeMonths: 3,
      winRate: 0.88,
      correlationSP500: 0.65,
      beta: 0.72,
      alpha: 0.0823,
      dataStartDate: new Date('2024-01-01'),
      dataEndDate: new Date('2026-01-31'),
      monthsOfData: 25,
      riskFreeRate: 0.05,
    },
  });

  console.log('✅ Created fund statistics');

  // ============================================================
  // SERVICE PROVIDERS
  // ============================================================

  // Create service provider user first
  const providerUser1 = await prisma.user.create({
    data: {
      email: 'contact@hedgefundlaw.com',
      passwordHash,
      role: UserRole.SERVICE_PROVIDER,
      emailVerified: new Date(),
      profile: {
        create: {
          firstName: 'David',
          lastName: 'Morrison',
          company: 'Morrison & Associates LLP',
          title: 'Managing Partner',
        },
      },
    },
  });

  await prisma.serviceProvider.create({
    data: {
      userId: providerUser1.id,
      companyName: 'Morrison & Associates LLP',
      slug: 'morrison-associates',
      category: 'Legal Services',
      subcategories: ['Fund Formation', 'Regulatory Compliance', 'M&A'],
      tagline: 'Premier hedge fund legal counsel for 25+ years',
      description: `Morrison & Associates is a leading law firm specializing in investment management 
and hedge fund matters. Our team has structured over 500 hedge funds and advised on 
billions in AUM across all major strategies.

Services include fund formation, regulatory compliance, SEC registration, 
trading documentation, and investor negotiations.`,
      website: 'https://hedgefundlaw.com',
      phone: '+1 (212) 555-0100',
      email: 'contact@hedgefundlaw.com',
      city: 'New York',
      state: 'NY',
      country: 'US',
      tier: 'PREMIUM',
      status: 'APPROVED',
      visible: true,
      featured: true,
    },
  });

  const providerUser2 = await prisma.user.create({
    data: {
      email: 'info@primebrokertech.com',
      passwordHash,
      role: UserRole.SERVICE_PROVIDER,
      emailVerified: new Date(),
      profile: {
        create: {
          firstName: 'Jennifer',
          lastName: 'Walsh',
          company: 'PrimeBroker Technologies',
          title: 'CEO',
        },
      },
    },
  });

  await prisma.serviceProvider.create({
    data: {
      userId: providerUser2.id,
      companyName: 'PrimeBroker Technologies',
      slug: 'primebroker-tech',
      category: 'Technology',
      subcategories: ['Portfolio Management', 'Risk Analytics', 'Trading Systems'],
      tagline: 'Next-generation portfolio and risk management',
      description: `PrimeBroker Technologies provides institutional-grade portfolio management 
and risk analytics software for hedge funds. Our cloud-native platform handles 
multi-asset portfolios with real-time P&L, exposure analysis, and regulatory reporting.

Trusted by 200+ funds managing $150B+ in assets.`,
      website: 'https://primebrokertech.com',
      phone: '+1 (415) 555-0200',
      email: 'info@primebrokertech.com',
      city: 'San Francisco',
      state: 'CA',
      country: 'US',
      tier: 'FEATURED',
      status: 'APPROVED',
      visible: true,
      featured: true,
    },
  });

  console.log('✅ Created 2 service providers');

  // ============================================================
  // CONFERENCES
  // ============================================================

  await prisma.conference.create({
    data: {
      name: 'Global Hedge Fund Summit 2026',
      slug: 'global-hedge-fund-summit-2026',
      description: `The premier gathering of hedge fund managers, investors, and service providers. 
Join 1,500+ industry professionals for three days of insights, networking, and deal-making.

Featured topics include AI in investing, crypto allocation strategies, 
regulatory developments, and emerging manager best practices.`,
      venue: 'The Waldorf Astoria',
      city: 'New York',
      state: 'NY',
      country: 'US',
      startDate: new Date('2026-05-15'),
      endDate: new Date('2026-05-17'),
      timezone: 'America/New_York',
      registrationUrl: 'https://ghfs2026.com/register',
      ticketCost: 2500,
      earlyBirdCost: 1995,
      earlyBirdDeadline: new Date('2026-03-01'),
      organizer: 'HedgeCo Events',
      organizerEmail: 'events@hedgeco.net',
      status: 'UPCOMING',
      visible: true,
      featured: true,
    },
  });

  await prisma.conference.create({
    data: {
      name: 'Crypto Institutional Forum',
      slug: 'crypto-institutional-forum-2026',
      description: `A focused event for institutional investors exploring digital asset allocations. 
Hear from leading crypto fund managers, custodians, and compliance experts.`,
      venue: 'The Ritz-Carlton',
      city: 'Miami',
      state: 'FL',
      country: 'US',
      startDate: new Date('2026-03-20'),
      endDate: new Date('2026-03-21'),
      timezone: 'America/New_York',
      registrationUrl: 'https://cryptoinstitutional.com',
      ticketCost: 1500,
      organizer: 'Digital Asset Council',
      status: 'UPCOMING',
      visible: true,
    },
  });

  console.log('✅ Created 2 conferences');

  // ============================================================
  // WATCHLIST
  // ============================================================

  await prisma.watchlist.create({
    data: {
      userId: investor1.id,
      fundId: fund1.id,
      notes: 'Strong performance, considering allocation',
    },
  });

  await prisma.watchlist.create({
    data: {
      userId: investor1.id,
      fundId: fund2.id,
      notes: 'Interesting quant approach',
    },
  });

  console.log('✅ Created watchlist entries');

  console.log('\n🎉 Database seeded successfully!');
  console.log('\n📋 Test Accounts:');
  console.log('   Admin: admin@hedgeco.net / password123');
  console.log('   Manager: john.smith@alphacapital.com / password123');
  console.log('   Investor: investor@example.com / password123');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
