-- Sprint 3: Add pgvector support for embeddings and semantic search
-- HedgeCo.Net v2 - Embedding Pipeline

-- ============================================================
-- 1. Enable pgvector extension
-- ============================================================

CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================
-- 2. Create FundEmbedding table
-- ============================================================

CREATE TABLE "FundEmbedding" (
    "id" TEXT NOT NULL,
    "fundId" TEXT NOT NULL,
    "embedding" vector(3072),
    "sourceText" TEXT NOT NULL,
    "model" TEXT NOT NULL DEFAULT 'text-embedding-3-large',
    "dimensions" INTEGER NOT NULL DEFAULT 3072,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FundEmbedding_pkey" PRIMARY KEY ("id")
);

-- Unique constraint on fundId (one embedding per fund)
CREATE UNIQUE INDEX "FundEmbedding_fundId_key" ON "FundEmbedding"("fundId");

-- Index on fundId for lookups
CREATE INDEX "FundEmbedding_fundId_idx" ON "FundEmbedding"("fundId");

-- Foreign key to Fund table
ALTER TABLE "FundEmbedding" ADD CONSTRAINT "FundEmbedding_fundId_fkey" 
    FOREIGN KEY ("fundId") REFERENCES "Fund"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ============================================================
-- 3. Create SearchQuery table (for search analytics)
-- ============================================================

-- SearchType enum
CREATE TYPE "SearchType" AS ENUM ('SEMANTIC', 'STRUCTURED', 'HYBRID');

CREATE TABLE "SearchQuery" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "query" TEXT NOT NULL,
    "filters" JSONB,
    "searchType" "SearchType" NOT NULL DEFAULT 'SEMANTIC',
    "resultCount" INTEGER NOT NULL DEFAULT 0,
    "topResultIds" TEXT[],
    "latencyMs" INTEGER,
    "embedding" vector(3072),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SearchQuery_pkey" PRIMARY KEY ("id")
);

-- Indexes for SearchQuery
CREATE INDEX "SearchQuery_userId_idx" ON "SearchQuery"("userId");
CREATE INDEX "SearchQuery_searchType_idx" ON "SearchQuery"("searchType");
CREATE INDEX "SearchQuery_createdAt_idx" ON "SearchQuery"("createdAt");

-- ============================================================
-- 4. Create HNSW index for vector similarity search
-- ============================================================

-- HNSW index for fast cosine similarity search on fund embeddings
-- Parameters: m=16 (connections per layer), ef_construction=64 (build-time accuracy)
CREATE INDEX "FundEmbedding_embedding_hnsw_idx" 
    ON "FundEmbedding" USING hnsw (embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);

-- ============================================================
-- 5. Create helper function for similarity search
-- ============================================================

CREATE OR REPLACE FUNCTION search_similar_funds(
    query_embedding vector(3072),
    fund_type_filter TEXT DEFAULT NULL,
    strategy_filter TEXT DEFAULT NULL,
    min_aum DECIMAL DEFAULT NULL,
    max_aum DECIMAL DEFAULT NULL,
    match_count INT DEFAULT 20,
    similarity_threshold FLOAT DEFAULT 0.5
)
RETURNS TABLE (
    id TEXT,
    name TEXT,
    fund_type TEXT,
    strategy TEXT,
    similarity FLOAT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        f.id,
        f.name,
        f.type::TEXT as fund_type,
        f.strategy,
        (1 - (fe.embedding <=> query_embedding))::FLOAT as similarity
    FROM "Fund" f
    JOIN "FundEmbedding" fe ON f.id = fe."fundId"
    WHERE 
        f.status = 'APPROVED'
        AND f.visible = true
        AND fe.embedding IS NOT NULL
        AND (fund_type_filter IS NULL OR f.type::TEXT = fund_type_filter)
        AND (strategy_filter IS NULL OR f.strategy ILIKE '%' || strategy_filter || '%')
        AND (min_aum IS NULL OR f.aum >= min_aum)
        AND (max_aum IS NULL OR f.aum <= max_aum)
        AND (1 - (fe.embedding <=> query_embedding)) >= similarity_threshold
    ORDER BY fe.embedding <=> query_embedding
    LIMIT match_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 6. Create function to find similar funds to a given fund
-- ============================================================

CREATE OR REPLACE FUNCTION find_similar_funds(
    source_fund_id TEXT,
    match_count INT DEFAULT 10
)
RETURNS TABLE (
    id TEXT,
    name TEXT,
    fund_type TEXT,
    strategy TEXT,
    similarity FLOAT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        f.id,
        f.name,
        f.type::TEXT as fund_type,
        f.strategy,
        (1 - (fe.embedding <=> source.embedding))::FLOAT as similarity
    FROM "Fund" f
    JOIN "FundEmbedding" fe ON f.id = fe."fundId"
    CROSS JOIN (
        SELECT embedding 
        FROM "FundEmbedding" 
        WHERE "fundId" = source_fund_id
    ) source
    WHERE 
        f.id != source_fund_id
        AND f.status = 'APPROVED'
        AND f.visible = true
        AND fe.embedding IS NOT NULL
    ORDER BY fe.embedding <=> source.embedding
    LIMIT match_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 7. Monitoring views
-- ============================================================

-- View to check embedding coverage
CREATE OR REPLACE VIEW embedding_coverage AS
SELECT 
    COUNT(*) as total_approved_funds,
    COUNT(fe.id) as funds_with_embedding,
    COUNT(*) - COUNT(fe.id) as funds_missing_embedding,
    ROUND(100.0 * COUNT(fe.id) / NULLIF(COUNT(*), 0), 1) as coverage_percent
FROM "Fund" f
LEFT JOIN "FundEmbedding" fe ON f.id = fe."fundId"
WHERE f.status = 'APPROVED' AND f.visible = true;

-- View for embedding freshness
CREATE OR REPLACE VIEW embedding_freshness AS
SELECT 
    DATE_TRUNC('day', fe."updatedAt") as date,
    COUNT(*) as embeddings_updated
FROM "FundEmbedding" fe
WHERE fe."updatedAt" IS NOT NULL
GROUP BY 1
ORDER BY 1 DESC
LIMIT 30;
