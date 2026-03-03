'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import pool from '@/lib/db'
import bcrypt from 'bcryptjs'

type Colaborador = {
  id: number;
  nome: string;
  email: string;
  permissoes: string[];
  senha_hash: string | null;
  ativo: boolean;
};

function isRedirectError(err: unknown): boolean {
  // Next.js 14+ usa NEXT_REDIRECT, 16+ pode usar outra string
  if (err instanceof Error) {
    return err.message.includes('NEXT_REDIRECT') || err.message.includes('redirect');
  }
  // Next.js pode também lançar um objeto especial
  if (typeof err === 'object' && err !== null && 'digest' in err) {
    const digest = (err as { digest?: string }).digest;
    return typeof digest === 'string' && digest.startsWith('NEXT_REDIRECT');
  }
  return false;
}

export async function login(prevState: unknown, formData: FormData) {
  const email = (formData.get('email') as string)?.trim().toLowerCase();
  const password = formData.get('password') as string;

  if (!password) {
    return { error: 'Preencha a senha' };
  }

  const { signAdminSession } = await import('@/lib/admin-auth');

  const cookieConfig = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 60 * 60 * 24, // 24h
    path: '/',
  };

  // 1. Tentar login por colaborador (email + senha)
  if (email) {
    try {
      const { rows } = await pool.query<Colaborador>(
        'SELECT id, nome, email, permissoes, senha_hash, ativo FROM colaboradores WHERE LOWER(email) = $1 LIMIT 1',
        [email]
      );

      if (rows.length > 0) {
        const colab = rows[0];

        if (!colab.ativo) {
          return { error: 'Conta desativada. Entre em contato com o administrador.' };
        }

        if (!colab.senha_hash) {
          return { error: 'Senha não configurada. Solicite ao administrador.' };
        }

        const valid = await bcrypt.compare(password, colab.senha_hash);
        if (!valid) {
          return { error: 'Senha incorreta' };
        }

        // Criar sessão com dados do colaborador
        const sessionValue = await signAdminSession({
          id: colab.id,
          nome: colab.nome,
          email: colab.email,
          permissoes: colab.permissoes || [],
        });

        const cookieStore = await cookies();
        cookieStore.set('admin_session', sessionValue, cookieConfig);
        redirect('/admin/dashboard');
      }
    } catch (err) {
      if (isRedirectError(err)) throw err;
      console.error('[Login] Erro ao buscar colaborador:', err);
    }
  }

  // 2. Fallback: login legado por ADMIN_PASSWORD
  const CORRECT_PASSWORD = process.env.ADMIN_PASSWORD;
  if (CORRECT_PASSWORD && password === CORRECT_PASSWORD) {
    const sessionValue = await signAdminSession();

    const cookieStore = await cookies();
    cookieStore.set('admin_session', sessionValue, cookieConfig);
    redirect('/admin/dashboard');
  }

  return { error: 'Credenciais inválidas' };
}
