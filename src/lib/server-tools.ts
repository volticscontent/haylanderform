import pool from './db';
import redis from './redis';

export async function getUser(phone: string): Promise<string> {
    try {
        const res = await pool.query('SELECT * FROM leads WHERE telefone = $1 LIMIT 1', [phone]);
        if (res.rows.length === 0) return JSON.stringify({ status: 'not_found' });
        return JSON.stringify(res.rows[0]);
    } catch (error) {
        console.error('getUser error:', error);
        return JSON.stringify({ status: 'error', message: String(error) });
    }
}

export async function updateUser(data: Record<string, unknown>): Promise<string> {
    try {
        const { telefone, ...fields } = data;
        if (!telefone) return JSON.stringify({ status: 'error', message: 'Telefone is required' });

        const leadsFields = [
            'nome_completo', 'email', 'cpf', 'nome_mae', 'senha_gov', 'situacao', 'observacoes', 'qualificacao',
            'faturamento_mensal', 'tem_divida', 'tipo_negocio', 'possui_socio', 'valor_divida_federal',
            'valor_divida_ativa', 'valor_divida_estadual', 'valor_divida_municipal', 'cartao_cnpj',
            'tipo_divida', 'motivo_qualificacao', 'interesse_ajuda', 'pos_qualificacao', 'cnpj', 'razao_social',
            'origem', 'data_ultima_consulta'
        ];
        const updateFields: string[] = [];
        const values: unknown[] = [];
        let i = 1;

        for (const [key, value] of Object.entries(fields)) {
            if (leadsFields.includes(key)) {
                if (key === 'observacoes') {
                    updateFields.push(`observacoes = CASE WHEN observacoes IS NULL OR observacoes = '' THEN $${i} ELSE observacoes || E'\\n' || $${i} END`);
                } else {
                    updateFields.push(`${key} = $${i}`);
                }
                values.push(value);
                i++;
            }
        }

        if (updateFields.length > 0) {
            updateFields.push(`atualizado_em = NOW()`);
            values.push(telefone);
            await pool.query(`UPDATE leads SET ${updateFields.join(', ')} WHERE telefone = $${i}`, values);
        }

        const resId = await pool.query('SELECT id FROM leads WHERE telefone = $1', [telefone]);
        if (resId.rows.length > 0) {
            const leadId = resId.rows[0].id;
            const check = await pool.query('SELECT id FROM leads_atendimento WHERE lead_id = $1', [leadId]);
            if (check.rows.length > 0) {
                await pool.query('UPDATE leads_atendimento SET data_controle_24h = NOW() WHERE lead_id = $1', [leadId]);
            } else {
                await pool.query('INSERT INTO leads_atendimento (lead_id, data_controle_24h) VALUES ($1, NOW())', [leadId]);
            }
        }

        return JSON.stringify({ status: 'success', message: 'User updated' });
    } catch (error) {
        console.error('updateUser error:', error);
        return JSON.stringify({ status: 'error', message: String(error) });
    }
}

export async function getAgentRouting(phone: string): Promise<string | null> {
    try {
        return await redis.get(`routing_override:${phone}`);
    } catch (error) {
        console.error('getAgentRouting error:', error);
        return null;
    }
}
