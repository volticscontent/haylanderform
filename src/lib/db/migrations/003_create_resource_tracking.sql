-- Criar tabela de tracking de recursos para regularização fiscal
CREATE TABLE IF NOT EXISTS resource_tracking (
    id SERIAL PRIMARY KEY,
    lead_id INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    resource_type VARCHAR(50) NOT NULL CHECK (resource_type IN ('video-tutorial', 'link-ecac', 'formulario', 'documentacao')),
    resource_key VARCHAR(255) NOT NULL,
    delivered_at TIMESTAMP NOT NULL DEFAULT NOW(),
    accessed_at TIMESTAMP,
    status VARCHAR(20) NOT NULL DEFAULT 'delivered' CHECK (status IN ('delivered', 'accessed', 'completed')),
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_resource_tracking_lead_id ON resource_tracking(lead_id);
CREATE INDEX IF NOT EXISTS idx_resource_tracking_type_key ON resource_tracking(resource_type, resource_key);
CREATE INDEX IF NOT EXISTS idx_resource_tracking_status ON resource_tracking(status);
CREATE INDEX IF NOT EXISTS idx_resource_tracking_delivered_at ON resource_tracking(delivered_at);

-- Índice composto para buscar recursos recentes de um lead específico
CREATE INDEX IF NOT EXISTS idx_resource_tracking_lead_recent ON resource_tracking(lead_id, delivered_at DESC);

-- Comentários para documentação
COMMENT ON TABLE resource_tracking IS 'Tabela para tracking de recursos entregues aos clientes durante o processo de regularização fiscal';
COMMENT ON COLUMN resource_tracking.lead_id IS 'ID do lead/cliente';
COMMENT ON COLUMN resource_tracking.resource_type IS 'Tipo do recurso (video-tutorial, link-ecac, formulario, documentacao)';
COMMENT ON COLUMN resource_tracking.resource_key IS 'Chave identificadora do recurso (URL, nome do vídeo, etc)';
COMMENT ON COLUMN resource_tracking.delivered_at IS 'Data/hora em que o recurso foi entregue ao cliente';
COMMENT ON COLUMN resource_tracking.accessed_at IS 'Data/hora em que o cliente acessou o recurso';
COMMENT ON COLUMN resource_tracking.status IS 'Status do recurso (delivered, accessed, completed)';
COMMENT ON COLUMN resource_tracking.metadata IS 'Metadados adicionais do recurso (JSON)';