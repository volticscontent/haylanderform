CREATE TABLE IF NOT EXISTS consultas_serpro (
  id SERIAL PRIMARY KEY,
  cnpj VARCHAR(20) NOT NULL,
  tipo_servico VARCHAR(50) NOT NULL,
  resultado JSONB,
  status INTEGER,
  source VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_consultas_serpro_cnpj ON consultas_serpro(cnpj);
