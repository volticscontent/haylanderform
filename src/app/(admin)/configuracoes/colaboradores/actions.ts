'use server';

import { revalidatePath } from 'next/cache';
import { backendGet, backendPost, backendPut } from '@/lib/backend-proxy';

export type Colaborador = {
    id: number;
    nome: string;
    email: string | null;
    telefone: string | null;
    cargo: string;
    permissoes: string[];
    ativo: boolean;
    created_at: Date;
    updated_at: Date;
};

export type ColaboradorInput = {
    nome: string;
    email: string;
    telefone?: string;
    cargo: string;
    permissoes?: string[];
    senha?: string;
};

const REVALIDATE_PATH = '/colaboradores';

export async function getColaboradores(filtro?: { cargo?: string; ativo?: boolean }) {
    try {
        const params = new URLSearchParams();
        if (filtro?.cargo && filtro.cargo !== 'todos') params.set('cargo', filtro.cargo);
        if (filtro?.ativo !== undefined) params.set('ativo', String(filtro.ativo));
        const res = await backendGet('/api/colaboradores', params.toString() ? params : undefined);
        return res.json();
    } catch {
        return { success: false, error: 'Falha ao carregar colaboradores' };
    }
}

export async function createColaborador(data: ColaboradorInput) {
    try {
        const res = await backendPost('/api/colaboradores', data);
        revalidatePath(REVALIDATE_PATH);
        return res.json();
    } catch {
        return { success: false, error: 'Falha ao criar colaborador' };
    }
}

export async function updateColaborador(id: number, data: Partial<ColaboradorInput>) {
    try {
        const res = await backendPut(`/api/colaboradores/${id}`, data);
        revalidatePath(REVALIDATE_PATH);
        return res.json();
    } catch {
        return { success: false, error: 'Falha ao atualizar colaborador' };
    }
}

export async function toggleColaboradorAtivo(id: number) {
    try {
        const res = await backendPost(`/api/colaboradores/${id}/toggle`, {});
        revalidatePath(REVALIDATE_PATH);
        return res.json();
    } catch {
        return { success: false, error: 'Falha ao alterar status' };
    }
}

export async function getCargosDisponiveis() {
    try {
        const res = await backendGet('/api/colaboradores/cargos');
        return res.json();
    } catch {
        return { success: false, error: 'Falha ao carregar cargos' };
    }
}

export async function resetSenha(id: number, novaSenha: string) {
    try {
        const res = await backendPost(`/api/colaboradores/${id}/senha`, { novaSenha });
        revalidatePath(REVALIDATE_PATH);
        return res.json();
    } catch {
        return { success: false, error: 'Falha ao redefinir senha' };
    }
}
