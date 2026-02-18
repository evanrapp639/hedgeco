// Search Utilities
// Query preprocessing, synonym expansion, spell checking, and analytics

// ============================================================
// Stop Words
// ============================================================

const STOP_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been',
  'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
  'could', 'should', 'may', 'might', 'must', 'shall', 'can', 'need',
  'dare', 'ought', 'used', 'that', 'which', 'who', 'whom', 'whose',
  'this', 'these', 'those', 'am', 'it', 'its', 'i', 'me', 'my', 'we',
  'our', 'you', 'your', 'he', 'him', 'his', 'she', 'her', 'they', 'them',
  'their', 'what', 'when', 'where', 'why', 'how', 'all', 'each', 'every',
  'both', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor',
  'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 'just',
  'also', 'now', 'here', 'there', 'then', 'any', 'about',
  // Domain-specific stop words
  'fund', 'funds', 'investment', 'investments', 'investing', 'invest',
  'looking', 'want', 'find', 'search', 'show', 'me', 'please',
]);

// ============================================================
// Synonyms
// ============================================================

const SYNONYMS: Record<string, string[]> = {
  // Strategy synonyms
  'private equity': ['pe', 'buyout', 'leveraged buyout', 'lbo', 'growth equity'],
  'venture capital': ['vc', 'venture', 'early stage', 'seed stage', 'growth stage'],
  'hedge fund': ['hedgefund', 'alternative', 'alt'],
  'real estate': ['re', 'property', 'reits', 'reit', 'real-estate'],
  'long short': ['long/short', 'long-short', 'l/s', 'equity hedge'],
  'global macro': ['macro', 'discretionary macro', 'systematic macro'],
  'event driven': ['event-driven', 'special situations', 'merger arbitrage', 'distressed'],
  'quantitative': ['quant', 'systematic', 'algorithmic', 'algo'],
  'fixed income': ['credit', 'bonds', 'debt', 'fi'],
  'multi strategy': ['multi-strategy', 'diversified', 'multi strat'],
  'cryptocurrency': ['crypto', 'digital assets', 'bitcoin', 'blockchain'],
  'infrastructure': ['infra', 'utilities'],

  // Performance terms
  'high returns': ['top performing', 'best performing', 'outperforming', 'alpha'],
  'low risk': ['conservative', 'low volatility', 'stable', 'defensive'],
  'high risk': ['aggressive', 'high volatility', 'speculative'],

  // Size terms
  'large cap': ['large-cap', 'mega cap', 'blue chip'],
  'small cap': ['small-cap', 'micro cap', 'small companies'],
  'mid cap': ['mid-cap', 'medium cap'],

  // Geographic
  'us': ['usa', 'united states', 'america', 'american', 'domestic'],
  'europe': ['european', 'eu', 'emea'],
  'asia': ['asian', 'apac', 'asia pacific'],
  'emerging markets': ['em', 'developing markets', 'frontier'],
  'global': ['worldwide', 'international', 'world'],

  // Fund types
  'fund of funds': ['fof', 'fund-of-funds', 'multi manager'],
  'spv': ['special purpose vehicle', 'co-invest', 'co-investment'],
};

// Build reverse synonym map for faster lookups
const REVERSE_SYNONYMS = new Map<string, string>();
for (const [canonical, synonyms] of Object.entries(SYNONYMS)) {
  for (const synonym of synonyms) {
    REVERSE_SYNONYMS.set(synonym.toLowerCase(), canonical);
  }
}

// ============================================================
// Common Misspellings
// ============================================================

const COMMON_MISSPELLINGS: Record<string, string> = {
  // Strategy misspellings
  'privat equity': 'private equity',
  'privte equity': 'private equity',
  'ventur capital': 'venture capital',
  'ventrue capital': 'venture capital',
  'hed fund': 'hedge fund',
  'hege fund': 'hedge fund',
  'hedgefun': 'hedge fund',
  'real esate': 'real estate',
  'real estat': 'real estate',
  'cryto': 'crypto',
  'crpto': 'crypto',
  'crypro': 'crypto',
  'quantatative': 'quantitative',
  'quantitive': 'quantitative',
  'infastructure': 'infrastructure',
  'infrastrucure': 'infrastructure',
  
  // Common typos
  'invesment': 'investment',
  'investent': 'investment',
  'retuns': 'returns',
  'retruns': 'returns',
  'porfolio': 'portfolio',
  'portfoilo': 'portfolio',
  'stratgy': 'strategy',
  'startegy': 'strategy',
  'perfomance': 'performance',
  'performace': 'performance',
  'volatlity': 'volatility',
  'volatilty': 'volatility',
  'drawdwon': 'drawdown',
  'dradown': 'drawdown',
  'sharpe ration': 'sharpe ratio',
  'sharpie ratio': 'sharpe ratio',
  'diviersified': 'diversified',
  'diversfied': 'diversified',
};

// ============================================================
// Levenshtein Distance for Spell Checking
// ============================================================

function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

// ============================================================
// Query Preprocessing
// ============================================================

export interface PreprocessedQuery {
  original: string;
  normalized: string;
  tokens: string[];
  expandedTerms: string[];
  spellCorrections: Array<{ original: string; corrected: string }>;
  suggestions: string[];
}

/**
 * Normalize a query: lowercase, trim, normalize whitespace
 */
export function normalizeQuery(query: string): string {
  return query
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s/-]/g, ''); // Keep alphanumeric, spaces, slashes, hyphens
}

/**
 * Tokenize a query into words
 */
export function tokenizeQuery(query: string): string[] {
  return normalizeQuery(query)
    .split(/\s+/)
    .filter((token) => token.length > 0);
}

/**
 * Remove stop words from tokens
 */
export function removeStopWords(tokens: string[]): string[] {
  return tokens.filter((token) => !STOP_WORDS.has(token));
}

/**
 * Expand synonyms in query
 */
export function expandSynonyms(query: string): string[] {
  const normalized = normalizeQuery(query);
  const expanded = new Set<string>([normalized]);

  // Check for multi-word synonyms first
  for (const [canonical, synonyms] of Object.entries(SYNONYMS)) {
    if (normalized.includes(canonical)) {
      for (const synonym of synonyms) {
        expanded.add(normalized.replace(canonical, synonym));
      }
    }
    for (const synonym of synonyms) {
      if (normalized.includes(synonym)) {
        expanded.add(normalized.replace(synonym, canonical));
      }
    }
  }

  // Check individual tokens
  const tokens = tokenizeQuery(query);
  for (const token of tokens) {
    if (REVERSE_SYNONYMS.has(token)) {
      const canonical = REVERSE_SYNONYMS.get(token)!;
      expanded.add(normalized.replace(token, canonical));
    }
  }

  return Array.from(expanded);
}

/**
 * Check for and correct common misspellings
 */
export function checkSpelling(query: string): Array<{ original: string; corrected: string }> {
  const corrections: Array<{ original: string; corrected: string }> = [];
  const normalized = normalizeQuery(query);

  // Check for known misspellings
  for (const [misspelled, correct] of Object.entries(COMMON_MISSPELLINGS)) {
    if (normalized.includes(misspelled)) {
      corrections.push({ original: misspelled, corrected: correct });
    }
  }

  return corrections;
}

/**
 * Generate "Did you mean?" suggestions using Levenshtein distance
 */
export function generateSpellSuggestions(query: string, dictionary: string[]): string[] {
  const normalized = normalizeQuery(query);
  const tokens = tokenizeQuery(normalized);
  const suggestions: Array<{ suggestion: string; distance: number }> = [];

  for (const token of tokens) {
    if (STOP_WORDS.has(token)) continue;
    if (token.length < 3) continue;

    for (const word of dictionary) {
      const distance = levenshteinDistance(token, word);
      // Only suggest if distance is small relative to word length
      if (distance > 0 && distance <= Math.max(2, Math.floor(token.length / 3))) {
        suggestions.push({
          suggestion: normalized.replace(token, word),
          distance,
        });
      }
    }
  }

  // Sort by distance and return top suggestions
  return suggestions
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 3)
    .map((s) => s.suggestion);
}

/**
 * Full query preprocessing pipeline
 */
export function preprocessQuery(query: string): PreprocessedQuery {
  const normalized = normalizeQuery(query);
  const tokens = tokenizeQuery(query);
  const filteredTokens = removeStopWords(tokens);
  const expandedTerms = expandSynonyms(query);
  const spellCorrections = checkSpelling(query);
  
  // Generate suggestions from known terms
  const dictionary = [
    ...Object.keys(SYNONYMS),
    ...Object.values(SYNONYMS).flat(),
    ...Object.values(COMMON_MISSPELLINGS),
  ];
  const suggestions = generateSpellSuggestions(query, dictionary);

  return {
    original: query,
    normalized,
    tokens: filteredTokens,
    expandedTerms,
    spellCorrections,
    suggestions,
  };
}

/**
 * Get the best query to use for search (with corrections applied)
 */
export function getBestQuery(preprocessed: PreprocessedQuery): string {
  let best = preprocessed.normalized;
  
  // Apply spell corrections
  for (const correction of preprocessed.spellCorrections) {
    best = best.replace(correction.original, correction.corrected);
  }
  
  return best;
}

// ============================================================
// Search Analytics
// ============================================================

export interface SearchAnalyticsEvent {
  query: string;
  normalizedQuery: string;
  searchType: 'semantic' | 'hybrid' | 'structured';
  resultCount: number;
  latencyMs: number;
  userId?: string;
  timestamp: Date;
  filters?: Record<string, unknown>;
  spellCorrected: boolean;
  synonymExpanded: boolean;
}

/**
 * Build analytics event from search parameters
 */
export function buildSearchAnalyticsEvent(params: {
  query: string;
  preprocessed: PreprocessedQuery;
  searchType: 'semantic' | 'hybrid' | 'structured';
  resultCount: number;
  latencyMs: number;
  userId?: string;
  filters?: Record<string, unknown>;
}): SearchAnalyticsEvent {
  return {
    query: params.query,
    normalizedQuery: params.preprocessed.normalized,
    searchType: params.searchType,
    resultCount: params.resultCount,
    latencyMs: params.latencyMs,
    userId: params.userId,
    timestamp: new Date(),
    filters: params.filters,
    spellCorrected: params.preprocessed.spellCorrections.length > 0,
    synonymExpanded: params.preprocessed.expandedTerms.length > 1,
  };
}

// ============================================================
// Popular Queries / Autocomplete
// ============================================================

// Sample popular queries (in production, this would come from database)
const POPULAR_QUERIES = [
  'private equity funds',
  'venture capital early stage',
  'hedge fund long short',
  'real estate investment',
  'global macro strategy',
  'quantitative trading',
  'cryptocurrency funds',
  'event driven strategy',
  'multi strategy hedge fund',
  'emerging markets',
  'low volatility funds',
  'high sharpe ratio',
  'distressed debt',
  'infrastructure investment',
  'fund of funds',
];

/**
 * Get autocomplete suggestions based on partial query
 */
export function getAutocompleteSuggestions(
  partialQuery: string,
  limit: number = 5
): string[] {
  const normalized = normalizeQuery(partialQuery);
  if (normalized.length < 2) return [];

  const suggestions = POPULAR_QUERIES.filter((q) =>
    normalizeQuery(q).includes(normalized)
  );

  // Also check if any synonym matches
  for (const [canonical, synonyms] of Object.entries(SYNONYMS)) {
    if (canonical.includes(normalized)) {
      suggestions.push(canonical);
    }
    for (const synonym of synonyms) {
      if (synonym.includes(normalized)) {
        suggestions.push(synonym);
      }
    }
  }

  // Deduplicate and limit
  return Array.from(new Set(suggestions)).slice(0, limit);
}

/**
 * Extract potential fund type from query
 */
export function extractFundType(query: string): string | null {
  const normalized = normalizeQuery(query);
  
  const fundTypePatterns: Record<string, RegExp> = {
    HEDGE_FUND: /hedge\s*fund|l\/?s|long\/?short|macro|event.driven|quant|systematic/,
    PRIVATE_EQUITY: /private\s*equity|pe\b|buyout|lbo|growth\s*equity/,
    VENTURE_CAPITAL: /venture|vc\b|early\s*stage|seed|startup/,
    REAL_ESTATE: /real\s*estate|property|reit/,
    CRYPTO: /crypto|bitcoin|blockchain|digital\s*asset/,
    CREDIT: /credit|fixed\s*income|debt|bond/,
    INFRASTRUCTURE: /infrastructure|infra\b|utilities/,
    FUND_OF_FUNDS: /fund\s*of\s*funds|fof\b|multi.manager/,
  };

  for (const [type, pattern] of Object.entries(fundTypePatterns)) {
    if (pattern.test(normalized)) {
      return type;
    }
  }

  return null;
}

/**
 * Extract strategy hints from query
 */
export function extractStrategyHints(query: string): string[] {
  const normalized = normalizeQuery(query);
  const hints: string[] = [];

  const strategyPatterns: Record<string, RegExp> = {
    'Long/Short Equity': /long\/?short|equity\s*hedge|l\/?s\s*equity/,
    'Global Macro': /global\s*macro|macro\s*strategy|discretionary\s*macro/,
    'Event Driven': /event.driven|special\s*situation|merger\s*arb|distressed/,
    'Quantitative': /quant|systematic|algorithmic|algo\s*trading/,
    'Multi-Strategy': /multi.strateg|diversified/,
    'Fixed Income': /fixed\s*income|credit|bond|debt/,
    'Real Estate': /real\s*estate|property|reit/,
    'Venture': /venture|early\s*stage|seed\s*stage|startup/,
    'Buyout': /buyout|lbo|leveraged/,
    'Growth Equity': /growth\s*equity|growth\s*stage/,
  };

  for (const [strategy, pattern] of Object.entries(strategyPatterns)) {
    if (pattern.test(normalized)) {
      hints.push(strategy);
    }
  }

  return hints;
}
