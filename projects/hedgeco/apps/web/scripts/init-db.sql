-- =============================================================================
-- HedgeCo.Net Database Initialization Script
-- Run automatically by PostgreSQL container on first startup
-- =============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";

-- Grant permissions to the hedgeco user
GRANT ALL PRIVILEGES ON DATABASE hedgeco TO hedgeco;

-- Create schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS public;
GRANT ALL ON SCHEMA public TO hedgeco;

-- Set default search path
ALTER DATABASE hedgeco SET search_path TO public;

-- Log success
DO $$
BEGIN
  RAISE NOTICE 'Database initialization complete.';
  RAISE NOTICE 'Extensions enabled: uuid-ossp, pgcrypto, vector';
END $$;
