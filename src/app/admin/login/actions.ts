'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export async function login(prevState: unknown, formData: FormData) {
  const password = formData.get('password') as string
  
  // Simple hardcoded password for now
  const CORRECT_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123'

  if (password === CORRECT_PASSWORD) {
    const cookieStore = await cookies()
    cookieStore.set('admin_session', 'true', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24, // 1 day
      path: '/',
    })
    redirect('/admin/dashboard')
  } else {
    return { error: 'Senha incorreta' }
  }
}
