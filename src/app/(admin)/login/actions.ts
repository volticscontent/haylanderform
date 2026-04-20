'use server'

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { backendPost } from '@/lib/backend-proxy';

function isRedirectError(err: unknown): boolean {
  if (err instanceof Error) return err.message.includes('NEXT_REDIRECT') || err.message.includes('redirect');
  if (typeof err === 'object' && err !== null && 'digest' in err) {
    const digest = (err as { digest?: string }).digest;
    return typeof digest === 'string' && digest.startsWith('NEXT_REDIRECT');
  }
  return false;
}

export async function login(prevState: unknown, formData: FormData) {
  const emailRaw = formData.get('email') as string | null;
  const email = emailRaw ? emailRaw.trim().toLowerCase() : '';
  const password = formData.get('password') as string;

  if (!password) return { error: 'Preencha a senha' };

  const cookieConfig = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 60 * 60 * 24,
    path: '/',
  };

  let shouldRedirect = false;

  try {
    const res = await backendPost('/api/auth/login', { email, password });

    if (res.ok) {
      const user = await res.json() as { id: number; nome: string; email: string; permissoes: string[] };
      const { signAdminSession } = await import('@/lib/dashboard-auth');
      const sessionValue = await signAdminSession(
        user.id !== 0
          ? { id: user.id, nome: user.nome, email: user.email, permissoes: user.permissoes }
          : undefined,
      );
      const cookieStore = await cookies();
      cookieStore.set('admin_session', sessionValue, cookieConfig);
      shouldRedirect = true;
    } else {
      const errData = await res.json().catch(() => ({ error: 'Credenciais inválidas' }));
      return { error: errData.error || 'Credenciais inválidas' };
    }
  } catch (err) {
    if (isRedirectError(err)) throw err;
    console.error('[Login] Erro:', err instanceof Error ? err.message : String(err));
    return { error: 'Erro interno ao fazer login (Verifique console do server)' };
  }

  if (shouldRedirect) {
    redirect('/dashboard');
  }
}
