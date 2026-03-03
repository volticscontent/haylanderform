import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { ColaboradorSession } from './admin-auth';

// Mapa: caminho da rota → permissões que dão acesso
const ROUTE_PERMISSIONS: Record<string, string[]> = {
    '/admin/dashboard': ['admin', 'vendas', 'atendimento', 'financeiro'],
    '/admin/atendimentos': ['admin', 'atendimento'],
    '/admin/atendimento': ['admin', 'atendimento'],
    '/admin/lista': ['admin', 'vendas', 'atendimento'],
    '/admin/disparo': ['admin', 'disparo'],
    '/admin/serpro': ['admin', 'serpro'],
    '/admin/docs': [], // todos podem ver
    '/admin/configuracoes': ['admin'],
};

/**
 * Verifica se o colaborador logado tem permissão para acessar a rota.
 * Se não tiver, redireciona para /admin/dashboard.
 * Retorna os dados da sessão se tudo estiver OK.
 */
export async function requirePermission(pathname: string): Promise<ColaboradorSession> {
    const cookieStore = await cookies();
    const session = cookieStore.get('admin_session');

    if (!session) {
        redirect('/admin/login');
    }

    const { getSession } = await import('./admin-auth');
    const colaborador = await getSession(session.value);

    if (!colaborador) {
        redirect('/admin/login');
    }

    // Encontrar a regra de permissão mais específica que bate
    const matchingRoute = Object.keys(ROUTE_PERMISSIONS)
        .filter(route => pathname.startsWith(route))
        .sort((a, b) => b.length - a.length)[0]; // Mais específica primeiro

    if (matchingRoute) {
        const required = ROUTE_PERMISSIONS[matchingRoute];
        // Se a lista está vazia, todos podem acessar
        if (required.length > 0) {
            const hasAccess = colaborador.permissoes.some(p => required.includes(p));
            if (!hasAccess) {
                redirect('/admin/dashboard');
            }
        }
    }

    return colaborador;
}
