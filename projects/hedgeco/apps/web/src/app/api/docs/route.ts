/**
 * Swagger UI API Documentation Route
 * Sprint 7: HedgeCo.Net
 *
 * Serves Swagger UI for API documentation.
 * Loads spec from /openapi.json or generates dynamically.
 */

import { NextResponse } from 'next/server';
import { generateOpenAPISpec } from '@/lib/openapi';

/**
 * GET /api/docs
 * Returns Swagger UI HTML page
 */
export async function GET() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>HedgeCo.Net API Documentation</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui.css">
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  <style>
    :root {
      --primary-color: #0ea5e9;
      --primary-dark: #0284c7;
      --bg-color: #0f172a;
      --bg-secondary: #1e293b;
      --text-color: #f1f5f9;
      --text-muted: #94a3b8;
      --border-color: #334155;
    }
    
    * {
      box-sizing: border-box;
    }
    
    body {
      margin: 0;
      padding: 0;
      background: var(--bg-color);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    }
    
    /* Header */
    .topbar-wrapper {
      background: var(--bg-secondary) !important;
      padding: 1rem 2rem !important;
      border-bottom: 1px solid var(--border-color);
    }
    
    .topbar-wrapper .link {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    
    .topbar-wrapper .link::before {
      content: '📊';
      font-size: 1.5rem;
    }
    
    .topbar-wrapper .link span {
      font-weight: 600;
      color: var(--text-color) !important;
    }
    
    .swagger-ui .topbar .download-url-wrapper {
      display: flex;
      gap: 0.5rem;
    }
    
    .swagger-ui .topbar .download-url-wrapper input {
      background: var(--bg-color);
      border: 1px solid var(--border-color);
      color: var(--text-color);
      border-radius: 6px;
      padding: 0.5rem 1rem;
    }
    
    .swagger-ui .topbar .download-url-wrapper .download-url-button {
      background: var(--primary-color);
      border-radius: 6px;
    }
    
    /* Main content */
    .swagger-ui {
      background: var(--bg-color);
      color: var(--text-color);
    }
    
    .swagger-ui .wrapper {
      max-width: 1400px;
      padding: 2rem;
    }
    
    /* Info section */
    .swagger-ui .info {
      margin: 0 0 2rem;
    }
    
    .swagger-ui .info .title {
      color: var(--text-color) !important;
      font-size: 2rem;
    }
    
    .swagger-ui .info .description p,
    .swagger-ui .info .description {
      color: var(--text-muted);
      font-size: 1rem;
      line-height: 1.6;
    }
    
    .swagger-ui .info .description code {
      background: var(--bg-secondary);
      padding: 0.2rem 0.4rem;
      border-radius: 4px;
      font-size: 0.9em;
    }
    
    .swagger-ui .info .description pre {
      background: var(--bg-secondary);
      padding: 1rem;
      border-radius: 8px;
      overflow-x: auto;
    }
    
    /* Tags/sections */
    .swagger-ui .opblock-tag {
      color: var(--text-color) !important;
      border-bottom: 1px solid var(--border-color);
      padding: 1rem 0;
    }
    
    .swagger-ui .opblock-tag:hover {
      background: var(--bg-secondary);
    }
    
    /* Operations */
    .swagger-ui .opblock {
      background: var(--bg-secondary);
      border-radius: 8px;
      border: 1px solid var(--border-color);
      margin-bottom: 1rem;
    }
    
    .swagger-ui .opblock .opblock-summary {
      border-radius: 8px;
    }
    
    .swagger-ui .opblock .opblock-summary-method {
      border-radius: 4px;
      font-weight: 600;
      min-width: 80px;
      text-align: center;
    }
    
    .swagger-ui .opblock.opblock-get .opblock-summary-method {
      background: #22c55e;
    }
    
    .swagger-ui .opblock.opblock-post .opblock-summary-method {
      background: #3b82f6;
    }
    
    .swagger-ui .opblock.opblock-put .opblock-summary-method {
      background: #f59e0b;
    }
    
    .swagger-ui .opblock.opblock-delete .opblock-summary-method {
      background: #ef4444;
    }
    
    .swagger-ui .opblock .opblock-summary-path {
      color: var(--text-color);
    }
    
    .swagger-ui .opblock .opblock-summary-description {
      color: var(--text-muted);
    }
    
    /* Expanded operation */
    .swagger-ui .opblock-body {
      background: var(--bg-color);
    }
    
    .swagger-ui .opblock-description-wrapper,
    .swagger-ui .opblock-section-header {
      background: transparent;
    }
    
    .swagger-ui .opblock-section-header h4 {
      color: var(--text-color);
    }
    
    /* Parameters */
    .swagger-ui .parameters-col_description {
      color: var(--text-muted);
    }
    
    .swagger-ui table.parameters tbody tr td {
      border-color: var(--border-color);
    }
    
    .swagger-ui .parameter__name,
    .swagger-ui .parameter__type {
      color: var(--text-color);
    }
    
    /* Models/Schemas */
    .swagger-ui .model-box {
      background: var(--bg-secondary);
      border-radius: 8px;
    }
    
    .swagger-ui .model {
      color: var(--text-color);
    }
    
    .swagger-ui .model-title {
      color: var(--text-color);
    }
    
    .swagger-ui .prop-type {
      color: var(--primary-color);
    }
    
    /* Try it out */
    .swagger-ui .btn {
      border-radius: 6px;
    }
    
    .swagger-ui .btn.execute {
      background: var(--primary-color);
      border-color: var(--primary-color);
    }
    
    .swagger-ui .btn.execute:hover {
      background: var(--primary-dark);
    }
    
    .swagger-ui .btn.cancel {
      background: var(--bg-color);
      border-color: var(--border-color);
      color: var(--text-color);
    }
    
    /* Response */
    .swagger-ui .responses-wrapper {
      background: transparent;
    }
    
    .swagger-ui .response-col_status {
      color: var(--text-color);
    }
    
    .swagger-ui .response-col_description {
      color: var(--text-muted);
    }
    
    /* Code blocks */
    .swagger-ui .highlight-code {
      background: var(--bg-color);
    }
    
    .swagger-ui .highlight-code code {
      color: var(--text-color);
    }
    
    /* Authorization */
    .swagger-ui .authorization__btn {
      background: transparent;
      border: 1px solid var(--border-color);
      border-radius: 6px;
    }
    
    .swagger-ui .authorization__btn:hover {
      background: var(--bg-secondary);
    }
    
    .swagger-ui .dialog-ux .modal-ux {
      background: var(--bg-secondary);
      border: 1px solid var(--border-color);
      border-radius: 12px;
    }
    
    .swagger-ui .dialog-ux .modal-ux-header h3 {
      color: var(--text-color);
    }
    
    .swagger-ui .dialog-ux .modal-ux-content {
      color: var(--text-muted);
    }
    
    /* Scrollbar */
    ::-webkit-scrollbar {
      width: 8px;
      height: 8px;
    }
    
    ::-webkit-scrollbar-track {
      background: var(--bg-color);
    }
    
    ::-webkit-scrollbar-thumb {
      background: var(--border-color);
      border-radius: 4px;
    }
    
    ::-webkit-scrollbar-thumb:hover {
      background: var(--text-muted);
    }
    
    /* Loading */
    .swagger-ui .loading-container {
      padding: 4rem;
    }
    
    .swagger-ui .loading-container .loading::after {
      border-color: var(--primary-color) transparent;
    }
    
    /* Custom header */
    .api-header {
      background: linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-color) 100%);
      padding: 2rem;
      border-bottom: 1px solid var(--border-color);
    }
    
    .api-header-content {
      max-width: 1400px;
      margin: 0 auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .api-header h1 {
      margin: 0;
      font-size: 1.5rem;
      color: var(--text-color);
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    
    .api-header-links {
      display: flex;
      gap: 1rem;
    }
    
    .api-header-links a {
      color: var(--text-muted);
      text-decoration: none;
      padding: 0.5rem 1rem;
      border-radius: 6px;
      border: 1px solid var(--border-color);
      transition: all 0.2s;
    }
    
    .api-header-links a:hover {
      color: var(--text-color);
      border-color: var(--primary-color);
      background: rgba(14, 165, 233, 0.1);
    }
    
    /* Hide default topbar */
    .swagger-ui .topbar {
      display: none;
    }
  </style>
</head>
<body>
  <div class="api-header">
    <div class="api-header-content">
      <h1>
        <svg width="32" height="32" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="100" height="100" rx="20" fill="#0ea5e9"/>
          <path d="M25 65 L40 35 L55 55 L70 25 L80 25" stroke="white" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
          <circle cx="40" cy="35" r="4" fill="white"/>
          <circle cx="55" cy="55" r="4" fill="white"/>
          <circle cx="70" cy="25" r="4" fill="white"/>
        </svg>
        HedgeCo.Net API
      </h1>
      <div class="api-header-links">
        <a href="/">← Back to App</a>
        <a href="/openapi.json" target="_blank">Download OpenAPI Spec</a>
      </div>
    </div>
  </div>
  
  <div id="swagger-ui"></div>
  
  <script src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-bundle.js"></script>
  <script src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-standalone-preset.js"></script>
  <script>
    window.onload = function() {
      const ui = SwaggerUIBundle({
        url: '/openapi.json',
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        plugins: [
          SwaggerUIBundle.plugins.DownloadUrl
        ],
        layout: 'StandaloneLayout',
        defaultModelsExpandDepth: 1,
        defaultModelExpandDepth: 2,
        docExpansion: 'list',
        filter: true,
        showExtensions: true,
        showCommonExtensions: true,
        tryItOutEnabled: true,
        persistAuthorization: true,
        requestInterceptor: (request) => {
          // Add any default headers here
          return request;
        },
        responseInterceptor: (response) => {
          return response;
        }
      });
      
      window.ui = ui;
    };
  </script>
</body>
</html>
  `.trim();

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
    },
  });
}
