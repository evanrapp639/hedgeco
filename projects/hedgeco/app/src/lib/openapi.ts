/**
 * OpenAPI 3.0 Spec Generation
 * Sprint 7: HedgeCo.Net
 *
 * Generates OpenAPI specification from tRPC routers
 * for API documentation and client generation.
 */

// Inline OpenAPI types to avoid dependency issues
namespace OpenAPIV3 {
  export interface SchemaObject {
    type?: string;
    properties?: Record<string, SchemaObject>;
    items?: SchemaObject;
    required?: string[];
    description?: string;
    example?: unknown;
    enum?: string[];
    format?: string;
    nullable?: boolean;
    $ref?: string;
    minimum?: number;
    maximum?: number;
    default?: unknown;
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    additionalProperties?: boolean | SchemaObject;
    allOf?: SchemaObject[];
    oneOf?: SchemaObject[];
    anyOf?: SchemaObject[];
    minItems?: number;
    maxItems?: number;
    uniqueItems?: boolean;
  }
  export interface PathItemObject {
    get?: OperationObject;
    post?: OperationObject;
    put?: OperationObject;
    delete?: OperationObject;
  }
  export interface OperationObject {
    summary?: string;
    description?: string;
    operationId?: string;
    tags?: string[];
    parameters?: ParameterObject[];
    requestBody?: RequestBodyObject;
    responses?: Record<string, ResponseObject>;
    security?: SecurityRequirementObject[];
  }
  export interface ParameterObject {
    name: string;
    in: string;
    required?: boolean;
    schema?: SchemaObject;
    description?: string;
  }
  export interface RequestBodyObject {
    required?: boolean;
    content?: Record<string, MediaTypeObject>;
  }
  export interface ResponseObject {
    description: string;
    content?: Record<string, MediaTypeObject>;
    headers?: Record<string, HeaderObject>;
  }
  export interface MediaTypeObject {
    schema?: SchemaObject;
  }
  export interface HeaderObject {
    schema?: SchemaObject;
    description?: string;
  }
  export interface SecurityRequirementObject {
    [name: string]: string[];
  }
  export type PathsObject = Record<string, PathItemObject>;
  export interface Document {
    openapi: string;
    info: InfoObject;
    servers?: ServerObject[];
    paths: PathsObject;
    components?: ComponentsObject;
    security?: SecurityRequirementObject[];
    tags?: TagObject[];
  }
  export interface InfoObject {
    title: string;
    version: string;
    description?: string;
    contact?: ContactObject;
    license?: LicenseObject;
    termsOfService?: string;
  }
  export interface ContactObject {
    name?: string;
    email?: string;
    url?: string;
  }
  export interface LicenseObject {
    name: string;
    url?: string;
  }
  export interface ServerObject {
    url: string;
    description?: string;
  }
  export interface ComponentsObject {
    schemas?: Record<string, SchemaObject>;
    securitySchemes?: Record<string, SecuritySchemeObject>;
    responses?: Record<string, ResponseObject>;
    parameters?: Record<string, ParameterObject>;
    requestBodies?: Record<string, RequestBodyObject>;
    headers?: Record<string, HeaderObject>;
  }
  export interface SecuritySchemeObject {
    type: string;
    scheme?: string;
    bearerFormat?: string;
    description?: string;
    in?: string;
    name?: string;
    flows?: OAuthFlowsObject;
  }
  export interface OAuthFlowsObject {
    implicit?: OAuthFlowObject;
    password?: OAuthFlowObject;
    clientCredentials?: OAuthFlowObject;
    authorizationCode?: OAuthFlowObject;
  }
  export interface OAuthFlowObject {
    authorizationUrl?: string;
    tokenUrl?: string;
    refreshUrl?: string;
    scopes: Record<string, string>;
  }
  export interface TagObject {
    name: string;
    description?: string;
  }
}

// ============================================================
// TYPES
// ============================================================

export interface OpenAPIGeneratorOptions {
  title?: string;
  version?: string;
  description?: string;
  serverUrl?: string;
}

// ============================================================
// SCHEMA DEFINITIONS
// ============================================================

/**
 * Common schema definitions used across endpoints
 */
const commonSchemas: Record<string, OpenAPIV3.SchemaObject> = {
  Error: {
    type: 'object',
    properties: {
      message: { type: 'string' },
      code: { type: 'string' },
      data: {
        type: 'object',
        properties: {
          zodError: {
            type: 'object',
            nullable: true,
          },
        },
      },
    },
    required: ['message', 'code'],
  },
  Pagination: {
    type: 'object',
    properties: {
      cursor: { type: 'string', nullable: true },
      limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
    },
  },
  Fund: {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
      name: { type: 'string' },
      slug: { type: 'string' },
      type: { $ref: '#/components/schemas/FundType' },
      strategy: { type: 'string', nullable: true },
      subStrategy: { type: 'string', nullable: true },
      description: { type: 'string', nullable: true },
      aum: { type: 'number', nullable: true },
      aumDate: { type: 'string', format: 'date-time', nullable: true },
      inceptionDate: { type: 'string', format: 'date-time', nullable: true },
      managementFee: { type: 'number', nullable: true },
      performanceFee: { type: 'number', nullable: true },
      minInvestment: { type: 'number', nullable: true },
      city: { type: 'string', nullable: true },
      state: { type: 'string', nullable: true },
      country: { type: 'string', nullable: true },
      featured: { type: 'boolean' },
      visible: { type: 'boolean' },
      status: { $ref: '#/components/schemas/FundStatus' },
    },
    required: ['id', 'name', 'slug', 'type'],
  },
  FundType: {
    type: 'string',
    enum: ['HEDGE_FUND', 'PRIVATE_EQUITY', 'VENTURE_CAPITAL', 'REAL_ESTATE', 'FUND_OF_FUNDS', 'OTHER'],
  },
  FundStatus: {
    type: 'string',
    enum: ['DRAFT', 'PENDING_REVIEW', 'APPROVED', 'REJECTED', 'SUSPENDED'],
  },
  FundStatistics: {
    type: 'object',
    properties: {
      fundId: { type: 'string', format: 'uuid' },
      ytdReturn: { type: 'number', nullable: true },
      oneYearReturn: { type: 'number', nullable: true },
      threeYearReturn: { type: 'number', nullable: true },
      fiveYearReturn: { type: 'number', nullable: true },
      inceptionReturn: { type: 'number', nullable: true },
      sharpeRatio: { type: 'number', nullable: true },
      sortinoRatio: { type: 'number', nullable: true },
      maxDrawdown: { type: 'number', nullable: true },
      volatility: { type: 'number', nullable: true },
      beta: { type: 'number', nullable: true },
      alpha: { type: 'number', nullable: true },
      cagr: { type: 'number', nullable: true },
    },
  },
  MonthlyReturn: {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
      fundId: { type: 'string', format: 'uuid' },
      year: { type: 'integer' },
      month: { type: 'integer', minimum: 1, maximum: 12 },
      value: { type: 'number' },
    },
    required: ['id', 'fundId', 'year', 'month', 'value'],
  },
  User: {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
      email: { type: 'string', format: 'email' },
      role: { $ref: '#/components/schemas/UserRole' },
      createdAt: { type: 'string', format: 'date-time' },
    },
    required: ['id', 'email', 'role'],
  },
  UserRole: {
    type: 'string',
    enum: ['INVESTOR', 'MANAGER', 'ADMIN', 'SUPER_ADMIN'],
  },
  SearchResult: {
    type: 'object',
    properties: {
      funds: {
        type: 'array',
        items: { $ref: '#/components/schemas/Fund' },
      },
      total: { type: 'integer' },
      nextCursor: { type: 'string', nullable: true },
    },
  },
  ComparisonData: {
    type: 'object',
    properties: {
      funds: {
        type: 'array',
        items: { $ref: '#/components/schemas/Fund' },
      },
      metrics: {
        type: 'object',
        additionalProperties: {
          type: 'object',
        },
      },
      correlationMatrix: {
        type: 'array',
        items: {
          type: 'array',
          items: { type: 'number' },
        },
      },
    },
  },
};

// ============================================================
// ENDPOINT DEFINITIONS
// ============================================================

/**
 * Define all public API endpoints
 */
function generatePaths(): OpenAPIV3.PathsObject {
  return {
    // ==================== FUND ENDPOINTS ====================
    '/api/trpc/fund.list': {
      get: {
        tags: ['Fund'],
        summary: 'List funds with filters',
        description: 'Returns a paginated list of approved, visible funds with optional filters.',
        operationId: 'fund.list',
        parameters: [
          { name: 'type', in: 'query', schema: { $ref: '#/components/schemas/FundType' } },
          { name: 'strategy', in: 'query', schema: { type: 'string' } },
          { name: 'minAum', in: 'query', schema: { type: 'number' } },
          { name: 'maxAum', in: 'query', schema: { type: 'number' } },
          { name: 'country', in: 'query', schema: { type: 'string' } },
          { name: 'featured', in: 'query', schema: { type: 'boolean' } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'cursor', in: 'query', schema: { type: 'string' } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
        ],
        responses: {
          '200': {
            description: 'Successful response',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SearchResult' },
              },
            },
          },
          '400': {
            description: 'Bad request',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },
    '/api/trpc/fund.getBySlug': {
      get: {
        tags: ['Fund'],
        summary: 'Get fund by slug',
        description: 'Returns basic fund information by URL slug.',
        operationId: 'fund.getBySlug',
        parameters: [
          { name: 'slug', in: 'query', required: true, schema: { type: 'string' } },
        ],
        responses: {
          '200': {
            description: 'Successful response',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Fund' },
              },
            },
          },
          '404': {
            description: 'Fund not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },
    '/api/trpc/fund.getFullDetails': {
      get: {
        tags: ['Fund'],
        summary: 'Get full fund details',
        description: 'Returns complete fund information including returns and documents. Requires authentication.',
        operationId: 'fund.getFullDetails',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'fundId', in: 'query', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          '200': {
            description: 'Successful response',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/Fund' },
                    {
                      type: 'object',
                      properties: {
                        statistics: { $ref: '#/components/schemas/FundStatistics' },
                        returns: {
                          type: 'array',
                          items: { $ref: '#/components/schemas/MonthlyReturn' },
                        },
                      },
                    },
                  ],
                },
              },
            },
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          '404': {
            description: 'Fund not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },
    '/api/trpc/fund.getFeatured': {
      get: {
        tags: ['Fund'],
        summary: 'Get featured funds',
        description: 'Returns a list of featured funds for homepage display.',
        operationId: 'fund.getFeatured',
        parameters: [
          { name: 'limit', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 10, default: 3 } },
        ],
        responses: {
          '200': {
            description: 'Successful response',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Fund' },
                },
              },
            },
          },
        },
      },
    },
    '/api/trpc/fund.getTypeCounts': {
      get: {
        tags: ['Fund'],
        summary: 'Get fund type counts',
        description: 'Returns count of funds by type.',
        operationId: 'fund.getTypeCounts',
        responses: {
          '200': {
            description: 'Successful response',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      type: { $ref: '#/components/schemas/FundType' },
                      count: { type: 'integer' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },

    // ==================== SEARCH ENDPOINTS ====================
    '/api/trpc/search.semantic': {
      get: {
        tags: ['Search'],
        summary: 'Semantic fund search',
        description: 'Search funds using natural language queries with AI-powered semantic matching.',
        operationId: 'search.semantic',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'query', in: 'query', required: true, schema: { type: 'string' } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
          { name: 'filters', in: 'query', schema: { type: 'object' } },
        ],
        responses: {
          '200': {
            description: 'Successful response',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SearchResult' },
              },
            },
          },
        },
      },
    },

    // ==================== STATISTICS ENDPOINTS ====================
    '/api/trpc/stats.getFundStats': {
      get: {
        tags: ['Statistics'],
        summary: 'Get fund statistics',
        description: 'Returns calculated statistics for a fund.',
        operationId: 'stats.getFundStats',
        parameters: [
          { name: 'fundId', in: 'query', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          '200': {
            description: 'Successful response',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/FundStatistics' },
              },
            },
          },
        },
      },
    },

    // ==================== COMPARISON ENDPOINTS ====================
    '/api/trpc/comparison.compare': {
      post: {
        tags: ['Comparison'],
        summary: 'Compare multiple funds',
        description: 'Returns side-by-side comparison data for specified funds.',
        operationId: 'comparison.compare',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  fundIds: {
                    type: 'array',
                    items: { type: 'string', format: 'uuid' },
                    minItems: 2,
                    maxItems: 5,
                  },
                  metrics: {
                    type: 'array',
                    items: { type: 'string' },
                  },
                },
                required: ['fundIds'],
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Successful response',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ComparisonData' },
              },
            },
          },
        },
      },
    },
    '/api/trpc/comparison.getCorrelationMatrix': {
      post: {
        tags: ['Comparison'],
        summary: 'Get correlation matrix',
        description: 'Returns pairwise correlation coefficients between funds.',
        operationId: 'comparison.getCorrelationMatrix',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  fundIds: {
                    type: 'array',
                    items: { type: 'string', format: 'uuid' },
                    minItems: 2,
                  },
                },
                required: ['fundIds'],
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Successful response',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    fundIds: {
                      type: 'array',
                      items: { type: 'string' },
                    },
                    matrix: {
                      type: 'array',
                      items: {
                        type: 'array',
                        items: { type: 'number' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/trpc/comparison.exportComparison': {
      post: {
        tags: ['Comparison'],
        summary: 'Export fund comparison',
        description: 'Exports fund comparison data as PDF or CSV.',
        operationId: 'comparison.exportComparison',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  fundIds: {
                    type: 'array',
                    items: { type: 'string', format: 'uuid' },
                  },
                  format: {
                    type: 'string',
                    enum: ['pdf', 'csv'],
                  },
                },
                required: ['fundIds', 'format'],
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Successful response',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: { type: 'string', description: 'Base64 encoded file data' },
                    filename: { type: 'string' },
                    mimeType: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/trpc/comparison.getSimilarFunds': {
      get: {
        tags: ['Comparison'],
        summary: 'Find similar funds',
        description: 'Returns funds similar to the specified fund based on strategy and performance.',
        operationId: 'comparison.getSimilarFunds',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'fundId', in: 'query', required: true, schema: { type: 'string', format: 'uuid' } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 5 } },
        ],
        responses: {
          '200': {
            description: 'Successful response',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    allOf: [
                      { $ref: '#/components/schemas/Fund' },
                      {
                        type: 'object',
                        properties: {
                          similarityScore: { type: 'number' },
                        },
                      },
                    ],
                  },
                },
              },
            },
          },
        },
      },
    },

    // ==================== AUTH ENDPOINTS ====================
    '/api/auth/login': {
      post: {
        tags: ['Authentication'],
        summary: 'User login',
        description: 'Authenticate user with email and password.',
        operationId: 'auth.login',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string', minLength: 8 },
                },
                required: ['email', 'password'],
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Successful login',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    user: { $ref: '#/components/schemas/User' },
                    accessToken: { type: 'string' },
                  },
                },
              },
            },
          },
          '401': {
            description: 'Invalid credentials',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },
    '/api/auth/register': {
      post: {
        tags: ['Authentication'],
        summary: 'User registration',
        description: 'Register a new user account.',
        operationId: 'auth.register',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string', minLength: 8 },
                  firstName: { type: 'string' },
                  lastName: { type: 'string' },
                  role: { $ref: '#/components/schemas/UserRole' },
                },
                required: ['email', 'password', 'firstName', 'lastName'],
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'User created',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/User' },
              },
            },
          },
          '409': {
            description: 'Email already exists',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },
    '/api/auth/refresh': {
      post: {
        tags: ['Authentication'],
        summary: 'Refresh access token',
        description: 'Get a new access token using refresh token cookie.',
        operationId: 'auth.refresh',
        responses: {
          '200': {
            description: 'Token refreshed',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    accessToken: { type: 'string' },
                  },
                },
              },
            },
          },
          '401': {
            description: 'Invalid or expired refresh token',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },

    // ==================== PDF ENDPOINTS ====================
    '/api/trpc/pdf.generateFundReport': {
      post: {
        tags: ['PDF'],
        summary: 'Generate fund report PDF',
        description: 'Generate a detailed PDF report for a fund.',
        operationId: 'pdf.generateFundReport',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  fundId: { type: 'string', format: 'uuid' },
                  includeReturns: { type: 'boolean', default: true },
                  includeStatistics: { type: 'boolean', default: true },
                },
                required: ['fundId'],
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'PDF generated',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    pdf: { type: 'string', description: 'Base64 encoded PDF' },
                    filename: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    },
  };
}

// ============================================================
// MAIN GENERATOR
// ============================================================

/**
 * Generate the complete OpenAPI 3.0 specification
 */
export function generateOpenAPISpec(options: OpenAPIGeneratorOptions = {}): OpenAPIV3.Document {
  const {
    title = 'HedgeCo.Net API',
    version = '1.0.0',
    description = 'API for the HedgeCo.Net hedge fund research platform. Provides endpoints for fund discovery, comparison, analytics, and management.',
    serverUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  } = options;

  return {
    openapi: '3.0.3',
    info: {
      title,
      version,
      description,
      contact: {
        name: 'HedgeCo.Net Support',
        email: 'api-support@hedgeco.net',
        url: 'https://hedgeco.net/support',
      },
      license: {
        name: 'Proprietary',
        url: 'https://hedgeco.net/terms',
      },
    },
    servers: [
      {
        url: serverUrl,
        description: 'Current environment',
      },
      {
        url: 'https://api.hedgeco.net',
        description: 'Production',
      },
      {
        url: 'https://staging-api.hedgeco.net',
        description: 'Staging',
      },
    ],
    tags: [
      { name: 'Authentication', description: 'User authentication and session management' },
      { name: 'Fund', description: 'Fund discovery and management' },
      { name: 'Search', description: 'Fund search functionality' },
      { name: 'Statistics', description: 'Fund performance statistics' },
      { name: 'Comparison', description: 'Fund comparison tools' },
      { name: 'PDF', description: 'PDF report generation' },
    ],
    paths: generatePaths(),
    components: {
      schemas: commonSchemas,
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT access token. Obtain via /api/auth/login endpoint.',
        },
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'accessToken',
          description: 'JWT stored in httpOnly cookie (automatic with browser requests).',
        },
      },
      responses: {
        Unauthorized: {
          description: 'Authentication required or token invalid',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
            },
          },
        },
        Forbidden: {
          description: 'Insufficient permissions',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
            },
          },
        },
        NotFound: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
            },
          },
        },
        ValidationError: {
          description: 'Request validation failed',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
            },
          },
        },
        RateLimited: {
          description: 'Rate limit exceeded',
          headers: {
            'X-RateLimit-Limit': {
              description: 'Request limit per window',
              schema: { type: 'integer' },
            },
            'X-RateLimit-Remaining': {
              description: 'Remaining requests in window',
              schema: { type: 'integer' },
            },
            'X-RateLimit-Reset': {
              description: 'Unix timestamp when the window resets',
              schema: { type: 'integer' },
            },
          },
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
            },
          },
        },
      },
    },
    security: [], // Default is no auth, endpoints specify their own
  };
}

/**
 * Get the OpenAPI spec as a JSON string
 */
export function getOpenAPISpecJSON(options?: OpenAPIGeneratorOptions): string {
  return JSON.stringify(generateOpenAPISpec(options), null, 2);
}
