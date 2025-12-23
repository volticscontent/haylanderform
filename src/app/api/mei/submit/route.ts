import { NextResponse } from 'next/server'
import { Client } from 'pg'

interface MEIFormData {
  nome_completo: string
  cpf: string
  data_nascimento: string // YYYY-MM-DD
  nome_mae: string
  telefone: string
  email: string
  senha_gov: string
  cep: string
  endereco: string
  numero: string
  complemento?: string
  bairro: string
  cidade: string
  estado: string
  nome_fantasia: string
  atividade_principal: string
  atividades_secundarias?: string
  local_atividade: string // 'Residencial' | 'Comercial'
  titulo_eleitor_ou_recibo_ir?: string
}

function validateForm(form: unknown): { valid: boolean; message?: string } {
  const f = form as Partial<MEIFormData>
  const required: (keyof MEIFormData)[] = [
    'nome_completo','cpf','data_nascimento','nome_mae','telefone','email','senha_gov','cep','endereco','numero','bairro','cidade','estado','nome_fantasia','atividade_principal','local_atividade'
  ]
  for (const key of required) {
    const v = f[key]
    if (!v || (typeof v === 'string' && v.trim() === '')) {
      return { valid: false, message: `Campo obrigatório ausente: ${String(key)}` }
    }
  }
  return { valid: true }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const form: MEIFormData | undefined = body?.form
    const userId: number | undefined = body?.userId
    const userPhone: string | undefined = body?.userPhone

    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ error: 'Database connection not configured' }, { status: 500 })
    }

    const { valid, message } = validateForm(form)
    if (!valid || !form) {
      return NextResponse.json({ error: message ?? 'Dados inválidos' }, { status: 400 })
    }

    const client = new Client({ connectionString: process.env.DATABASE_URL })
    await client.connect()

    // Resolve user_id from phone if not provided
    let resolvedUserId: number | null = null
    if (typeof userId === 'number' && Number.isInteger(userId)) {
      resolvedUserId = userId
    } else if (userPhone) {
      const res = await client.query('SELECT id FROM public.leads WHERE telefone = $1 LIMIT 1', [userPhone])
      if (res.rows.length > 0) {
        resolvedUserId = Number(res.rows[0].id)
      }
    }

    // Insert or Update leads table
    // Priority: user_id if available, otherwise telefone
    let resultId: number | null = resolvedUserId

    if (resolvedUserId) {
      // Update existing user
      try {
        await client.query('BEGIN');

        // Update leads (core identity)
        await client.query(`
          UPDATE public.leads SET
            nome_completo = $1, 
            cpf = $2, 
            data_nascimento = $3, 
            nome_mae = $4,
            email = $5, 
            senha_gov = $6,
            atualizado_em = NOW()
          WHERE id = $7
        `, [
          form.nome_completo, 
          form.cpf, 
          form.data_nascimento, 
          form.nome_mae,
          form.email, 
          form.senha_gov,
          resolvedUserId
        ]);

        // Upsert leads_empresarial (business data)
        // Store extra MEI fields in dados_serpro JSONB
        const extraData = {
          mei_form_data: {
            atividade_principal: form.atividade_principal,
            atividades_secundarias: form.atividades_secundarias,
            local_atividade: form.local_atividade,
            titulo_eleitor_ou_recibo_ir: form.titulo_eleitor_ou_recibo_ir
          }
        };

        // Check if leads_empresarial exists
        const checkEmp = await client.query('SELECT id, dados_serpro FROM leads_empresarial WHERE lead_id = $1', [resolvedUserId]);
        
        if (checkEmp.rows.length > 0) {
          // Merge with existing dados_serpro if any
          const currentDados = checkEmp.rows[0].dados_serpro || {};
          const newDados = { ...currentDados, ...extraData };

          await client.query(`
            UPDATE leads_empresarial SET
              nome_fantasia = $1,
              endereco = $2,
              numero = $3,
              complemento = $4,
              bairro = $5,
              cidade = $6,
              estado = $7,
              cep = $8,
              dados_serpro = $9,
              updated_at = NOW()
            WHERE lead_id = $10
          `, [
            form.nome_fantasia,
            form.endereco,
            form.numero,
            form.complemento ?? null,
            form.bairro,
            form.cidade,
            form.estado,
            form.cep,
            JSON.stringify(newDados),
            resolvedUserId
          ]);
        } else {
          await client.query(`
            INSERT INTO leads_empresarial (
              lead_id,
              nome_fantasia,
              endereco,
              numero,
              complemento,
              bairro,
              cidade,
              estado,
              cep,
              dados_serpro
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          `, [
            resolvedUserId,
            form.nome_fantasia,
            form.endereco,
            form.numero,
            form.complemento ?? null,
            form.bairro,
            form.cidade,
            form.estado,
            form.cep,
            JSON.stringify(extraData)
          ]);
        }

        await client.query('COMMIT');
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      }
    } else {
      // Insert new user
      try {
        await client.query('BEGIN');

        // Insert into leads
        const insertRes = await client.query(`
          INSERT INTO public.leads (
            nome_completo, cpf, data_nascimento, nome_mae,
            email, senha_gov, telefone, data_cadastro
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
          RETURNING id
        `, [
          form.nome_completo, 
          form.cpf, 
          form.data_nascimento, 
          form.nome_mae,
          form.email, 
          form.senha_gov, 
          form.telefone // Use telefone from form if creating new user
        ]);

        const newUserId = insertRes.rows[0].id;
        resultId = newUserId;

        // Insert into leads_empresarial
        const extraData = {
          mei_form_data: {
            atividade_principal: form.atividade_principal,
            atividades_secundarias: form.atividades_secundarias,
            local_atividade: form.local_atividade,
            titulo_eleitor_ou_recibo_ir: form.titulo_eleitor_ou_recibo_ir
          }
        };

        await client.query(`
          INSERT INTO leads_empresarial (
            lead_id,
            nome_fantasia,
            endereco,
            numero,
            complemento,
            bairro,
            cidade,
            estado,
            cep,
            dados_serpro
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        `, [
          newUserId,
          form.nome_fantasia,
          form.endereco,
          form.numero,
          form.complemento ?? null,
          form.bairro,
          form.cidade,
          form.estado,
          form.cep,
          JSON.stringify(extraData)
        ]);

        await client.query('COMMIT');
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      }
    }

    await client.end()

    return NextResponse.json({ success: true, id: resultId })
  } catch (error: unknown) {
    console.error('MEI submit error:', error)
    const message = error instanceof Error ? error.message : 'Erro ao salvar dados do MEI'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}