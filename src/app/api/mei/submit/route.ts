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

const CREATE_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS public.mei_applications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES public.haylander(id) ON DELETE SET NULL,
  nome_completo TEXT NOT NULL,
  cpf TEXT NOT NULL,
  data_nascimento DATE NOT NULL,
  nome_mae TEXT NOT NULL,
  telefone VARCHAR(20) NOT NULL,
  email TEXT NOT NULL,
  senha_gov TEXT NOT NULL,
  cep VARCHAR(10) NOT NULL,
  endereco TEXT NOT NULL,
  numero VARCHAR(20) NOT NULL,
  complemento TEXT,
  bairro TEXT NOT NULL,
  cidade TEXT NOT NULL,
  estado VARCHAR(2) NOT NULL,
  nome_fantasia TEXT NOT NULL,
  atividade_principal TEXT NOT NULL,
  atividades_secundarias TEXT,
  local_atividade VARCHAR(20) NOT NULL,
  titulo_eleitor_ou_recibo_ir TEXT,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_mei_applications_user_id ON public.mei_applications(user_id);
`

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

    // Ensure table exists
    await client.query(CREATE_TABLE_SQL)

    // Resolve user_id from phone if not provided
    let resolvedUserId: number | null = null
    if (typeof userId === 'number' && Number.isInteger(userId)) {
      resolvedUserId = userId
    } else if (userPhone) {
      const res = await client.query('SELECT id FROM public.haylander WHERE telefone = $1 LIMIT 1', [userPhone])
      if (res.rows.length > 0) {
        resolvedUserId = Number(res.rows[0].id)
      }
    }

    const insertSql = `
      INSERT INTO public.mei_applications (
        user_id,
        nome_completo, cpf, data_nascimento, nome_mae,
        telefone, email, senha_gov,
        cep, endereco, numero, complemento,
        bairro, cidade, estado,
        nome_fantasia, atividade_principal, atividades_secundarias,
        local_atividade, titulo_eleitor_ou_recibo_ir
      ) VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8,
        $9, $10, $11, $12,
        $13, $14, $15,
        $16, $17, $18,
        $19, $20
      ) RETURNING id
    `

    const params = [
      resolvedUserId,
      form.nome_completo,
      form.cpf,
      form.data_nascimento,
      form.nome_mae,
      form.telefone,
      form.email,
      form.senha_gov,
      form.cep,
      form.endereco,
      form.numero,
      form.complemento ?? null,
      form.bairro,
      form.cidade,
      form.estado,
      form.nome_fantasia,
      form.atividade_principal,
      form.atividades_secundarias ?? null,
      form.local_atividade,
      form.titulo_eleitor_ou_recibo_ir ?? null,
    ]

    const ins = await client.query(insertSql, params)
    await client.end()

    return NextResponse.json({ success: true, id: ins.rows[0].id })
  } catch (error: unknown) {
    console.error('MEI submit error:', error)
    const message = error instanceof Error ? error.message : 'Erro ao salvar dados do MEI'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}