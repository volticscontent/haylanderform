
-- Enable pgvector extension if available
CREATE EXTENSION IF NOT EXISTS vector;

-- Create memories table
CREATE TABLE IF NOT EXISTS interpreter_memories (
  id SERIAL PRIMARY KEY,
  lead_id INTEGER REFERENCES leads(id) ON DELETE CASCADE,
  phone VARCHAR(20) NOT NULL,
  content TEXT NOT NULL,
  category VARCHAR(50), -- 'qualificacao', 'vendas', 'atendimento'
  embedding vector(1536), -- 1536 dim for text-embedding-3-small
  created_at TIMESTAMP DEFAULT NOW()
);

-- Index for faster vector search (HNSW)
-- CREATE INDEX ON interpreter_memories USING hnsw (embedding vector_cosine_ops);
-- Note: Index creation might fail if table is empty or extension missing, so we keep it commented or optional in script.
