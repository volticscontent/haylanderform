import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { evolutionSendTextMessage } from '@/lib/evolution';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { phone, action, message, summary, extracted_fields } = body;

        if (!phone) {
            return NextResponse.json({ error: 'Phone is required' }, { status: 400 });
        }

        console.log(`[Context Callback] Received action ${action} for ${phone}`);

        // --- Action 1: Send Message (5-min Nudge) ---
        if (action === 'send_message' && message) {
            try {
                await evolutionSendTextMessage(phone, message);
                return NextResponse.json({ message: 'Message sent successfully' });
            } catch (err) {
                console.error('[Context Callback] Error sending message:', err);
                return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
            }
        }

        // --- Action 2: Update Context (10-min Sync) ---
        // Se a action for undefined, assumimos que é o update padrão (retrocompatibilidade)
        if (action === 'update_context' || (!action && summary)) {
            
            // 1. Get Lead ID
            const leadRes = await pool.query('SELECT id FROM leads WHERE telefone = $1', [phone]);
            if (leadRes.rows.length === 0) {
                return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
            }
            const leadId = leadRes.rows[0].id;

            // 2. Prepare Updates
            const queries = [];

            // ... (rest of the update logic remains the same)


        // --- Update Leads Table (Basic Info) ---
        const leadsFields: Record<string, unknown> = {};
        if (extracted_fields?.nome_completo) leadsFields['nome_completo'] = extracted_fields.nome_completo;
        if (extracted_fields?.email) leadsFields['email'] = extracted_fields.email;
        
        if (Object.keys(leadsFields).length > 0) {
            const setClause = Object.keys(leadsFields).map((k, i) => `${k} = $${i + 2}`).join(', ');
            const values = Object.values(leadsFields);
            queries.push({
                text: `UPDATE leads SET ${setClause}, atualizado_em = NOW() WHERE id = $1`,
                values: [leadId, ...values]
            });
        }

        // --- Update Leads Empresarial ---
        const empFields: Record<string, unknown> = {};
        if (extracted_fields?.cnpj) empFields['cnpj'] = extracted_fields.cnpj;
        if (extracted_fields?.razao_social) empFields['razao_social'] = extracted_fields.razao_social;
        if (extracted_fields?.tipo_negocio) empFields['tipo_negocio'] = extracted_fields.tipo_negocio;
        if (extracted_fields?.faturamento_mensal) empFields['faturamento_mensal'] = extracted_fields.faturamento_mensal;

        if (Object.keys(empFields).length > 0) {
            // UPSERT logic (assuming lead_id is unique or we just insert/update)
            // We'll try UPDATE first, if 0 rows, INSERT? Or ON CONFLICT if constraint exists.
            // Let's assume standard 1:1 and try UPSERT style with ON CONFLICT (lead_id)
            // We need to know if leads_empresarial has a unique constraint on lead_id. 
            // If not, we might create duplicates.
            // Safer: Check if exists first.
            const checkEmp = await pool.query('SELECT id FROM leads_empresarial WHERE lead_id = $1', [leadId]);
            if (checkEmp.rows.length > 0) {
                const setClause = Object.keys(empFields).map((k, i) => `${k} = $${i + 2}`).join(', ');
                const values = Object.values(empFields);
                queries.push({
                    text: `UPDATE leads_empresarial SET ${setClause}, updated_at = NOW() WHERE lead_id = $1`,
                    values: [leadId, ...values]
                });
            } else {
                const cols = ['lead_id', ...Object.keys(empFields), 'created_at', 'updated_at'];
                const placeholders = cols.map((_, i) => `$${i + 1}`).join(', ');
                const values = [leadId, ...Object.values(empFields), new Date(), new Date()];
                queries.push({
                    text: `INSERT INTO leads_empresarial (${cols.join(', ')}) VALUES (${placeholders})`,
                    values: values
                });
            }
        }

        // --- Update Leads Qualificacao ---
        const qualFields: Record<string, unknown> = {};
        if (extracted_fields?.qualificacao) qualFields['qualificacao'] = extracted_fields.qualificacao;
        if (extracted_fields?.situacao) qualFields['situacao'] = extracted_fields.situacao;
        if (extracted_fields?.motivo_qualificacao) qualFields['motivo_qualificacao'] = extracted_fields.motivo_qualificacao;
        if (extracted_fields?.interesse_ajuda) qualFields['interesse_ajuda'] = extracted_fields.interesse_ajuda;

        if (Object.keys(qualFields).length > 0) {
            const checkQual = await pool.query('SELECT id FROM leads_qualificacao WHERE lead_id = $1', [leadId]);
            if (checkQual.rows.length > 0) {
                const setClause = Object.keys(qualFields).map((k, i) => `${k} = $${i + 2}`).join(', ');
                const values = Object.values(qualFields);
                queries.push({
                    text: `UPDATE leads_qualificacao SET ${setClause}, updated_at = NOW() WHERE lead_id = $1`,
                    values: [leadId, ...values]
                });
            } else {
                const cols = ['lead_id', ...Object.keys(qualFields), 'created_at', 'updated_at'];
                const placeholders = cols.map((_, i) => `$${i + 1}`).join(', ');
                const values = [leadId, ...Object.values(qualFields), new Date(), new Date()];
                queries.push({
                    text: `INSERT INTO leads_qualificacao (${cols.join(', ')}) VALUES (${placeholders})`,
                    values: values
                });
            }
        }

        // --- Update Leads Atendimento (Summary/Observacoes) ---
        if (summary) {
             const checkAtend = await pool.query('SELECT id FROM leads_atendimento WHERE lead_id = $1', [leadId]);
             if (checkAtend.rows.length > 0) {
                 queries.push({
                     text: `UPDATE leads_atendimento 
                            SET observacoes = COALESCE(observacoes, '') || E'\n[Resumo Auto]: ' || $2, 
                                updated_at = NOW() 
                            WHERE lead_id = $1`,
                     values: [leadId, summary]
                 });
             } else {
                 queries.push({
                     text: `INSERT INTO leads_atendimento (lead_id, observacoes, created_at, updated_at) 
                            VALUES ($1, $2, NOW(), NOW())`,
                     values: [leadId, `[Resumo Auto]: ${summary}`]
                 });
             }
        }

        // Execute all queries
        for (const q of queries) {
            await pool.query(q.text, q.values);
        }

        return NextResponse.json({ message: 'Context updated successfully', updates: queries.length });

        } else {
             return NextResponse.json({ error: 'Invalid action or missing parameters' }, { status: 400 });
        }

    } catch (error) {
        console.error('[Context Callback] Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
