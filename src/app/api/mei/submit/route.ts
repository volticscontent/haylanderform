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
      await client.query(`
        UPDATE public.leads SET
          nome_completo = $1, cpf = $2, data_nascimento = $3, nome_mae = $4,
          email = $5, senha_gov = $6,
          cep = $7, endereco = $8, numero = $9, complemento = $10,
          bairro = $11, cidade = $12, estado = $13,
          nome_fantasia = $14, atividade_principal = $15, atividades_secundarias = $16,
          local_atividade = $17, titulo_eleitor_ou_recibo_ir = $18,
          atualizado_em = NOW()
        WHERE id = $19
      `, [
        form.nome_completo, form.cpf, form.data_nascimento, form.nome_mae,
        form.email, form.senha_gov,
        form.cep, form.endereco, form.numero, form.complemento ?? null,
        form.bairro, form.cidade, form.estado,
        form.nome_fantasia, form.atividade_principal, form.atividades_secundarias ?? null,
        form.local_atividade, form.titulo_eleitor_ou_recibo_ir ?? null,
        resolvedUserId
      ])
    } else {
      // Insert new user or update if phone exists (but we checked phone earlier and set resolvedUserId if found)
      // Since resolvedUserId is null here, it means phone was not found. So we insert.
      const insertRes = await client.query(`
        INSERT INTO public.leads (
          nome_completo, cpf, data_nascimento, nome_mae,
          telefone, email, senha_gov,
          cep, endereco, numero, complemento,
          bairro, cidade, estado,
          nome_fantasia, atividade_principal, atividades_secundarias,
          local_atividade, titulo_eleitor_ou_recibo_ir,
          data_cadastro, atualizado_em
        ) VALUES (
          $1, $2, $3, $4,
          $5, $6, $7,
          $8, $9, $10, $11,
          $12, $13, $14,
          $15, $16, $17,
          $18, $19,
          NOW(), NOW()
        ) RETURNING id
      `, [
        form.nome_completo, form.cpf, form.data_nascimento, form.nome_mae,
        form.telefone, form.email, form.senha_gov,
        form.cep, form.endereco, form.numero, form.complemento ?? null,
        form.bairro, form.cidade, form.estado,
        form.nome_fantasia, form.atividade_principal, form.atividades_secundarias ?? null,
        form.local_atividade, form.titulo_eleitor_ou_recibo_ir ?? null
      ])
      resultId = insertRes.rows[0].id
    }

    await client.end()

    return NextResponse.json({ success: true, id: resultId })
  } catch (error: unknown) {
    console.error('MEI submit error:', error)
    const message = error instanceof Error ? error.message : 'Erro ao salvar dados do MEI'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}