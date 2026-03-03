'use server';

import pool from "@/lib/db";
import { revalidatePath } from "next/cache";

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
    email?: string;
    telefone?: string;
    cargo: string;
    permissoes?: string[];
};

const REVALIDATE_PATH = '/admin/configuracoes/colaboradores';

export async function getColaboradores(filtro?: { cargo?: string; ativo?: boolean }) {
    try {
        let sql = 'SELECT * FROM colaboradores';
        const conditions: string[] = [];
        const values: unknown[] = [];
        let i = 1;

        if (filtro?.cargo && filtro.cargo !== 'todos') {
            conditions.push(`cargo = $${i}`);
            values.push(filtro.cargo);
            i++;
        }
        if (filtro?.ativo !== undefined) {
            conditions.push(`ativo = $${i}`);
            values.push(filtro.ativo);
            i++;
        }

        if (conditions.length > 0) {
            sql += ' WHERE ' + conditions.join(' AND ');
        }
        sql += ' ORDER BY ativo DESC, nome ASC';

        const { rows } = await pool.query<Colaborador>(sql, values);
        return { success: true, data: rows };
    } catch (error) {
        console.error('getColaboradores error:', error);
        return { success: false, error: 'Falha ao carregar colaboradores' };
    }
}

export async function createColaborador(data: ColaboradorInput) {
    try {
        if (!data.nome || !data.cargo) {
            return { success: false, error: 'Nome e cargo são obrigatórios' };
        }

        const { rows } = await pool.query<Colaborador>(
            `INSERT INTO colaboradores (nome, email, telefone, cargo, permissoes)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING *`,
            [data.nome, data.email || null, data.telefone || null, data.cargo, data.permissoes || []]
        );

        revalidatePath(REVALIDATE_PATH);
        return { success: true, data: rows[0] };
    } catch (error: unknown) {
        console.error('createColaborador error:', error);
        const pgError = error as { code?: string; constraint?: string };
        if (pgError.code === '23505') {
            const field = pgError.constraint?.includes('email') ? 'email' : 'telefone';
            return { success: false, error: `Já existe um colaborador com este ${field}` };
        }
        return { success: false, error: 'Falha ao criar colaborador' };
    }
}

export async function updateColaborador(id: number, data: Partial<ColaboradorInput>) {
    try {
        const fields: string[] = [];
        const values: unknown[] = [];
        let i = 1;

        if (data.nome !== undefined) { fields.push(`nome = $${i}`); values.push(data.nome); i++; }
        if (data.email !== undefined) { fields.push(`email = $${i}`); values.push(data.email || null); i++; }
        if (data.telefone !== undefined) { fields.push(`telefone = $${i}`); values.push(data.telefone || null); i++; }
        if (data.cargo !== undefined) { fields.push(`cargo = $${i}`); values.push(data.cargo); i++; }
        if (data.permissoes !== undefined) { fields.push(`permissoes = $${i}`); values.push(data.permissoes); i++; }

        if (fields.length === 0) {
            return { success: false, error: 'Nenhum campo para atualizar' };
        }

        fields.push(`updated_at = NOW()`);
        values.push(id);

        const { rows } = await pool.query<Colaborador>(
            `UPDATE colaboradores SET ${fields.join(', ')} WHERE id = $${i} RETURNING *`,
            values
        );

        if (rows.length === 0) {
            return { success: false, error: 'Colaborador não encontrado' };
        }

        revalidatePath(REVALIDATE_PATH);
        return { success: true, data: rows[0] };
    } catch (error: unknown) {
        console.error('updateColaborador error:', error);
        const pgError = error as { code?: string; constraint?: string };
        if (pgError.code === '23505') {
            const field = pgError.constraint?.includes('email') ? 'email' : 'telefone';
            return { success: false, error: `Já existe um colaborador com este ${field}` };
        }
        return { success: false, error: 'Falha ao atualizar colaborador' };
    }
}

export async function toggleColaboradorAtivo(id: number) {
    try {
        const { rows } = await pool.query<Colaborador>(
            `UPDATE colaboradores SET ativo = NOT ativo, updated_at = NOW() WHERE id = $1 RETURNING *`,
            [id]
        );

        if (rows.length === 0) {
            return { success: false, error: 'Colaborador não encontrado' };
        }

        revalidatePath(REVALIDATE_PATH);
        return { success: true, data: rows[0] };
    } catch (error) {
        console.error('toggleColaboradorAtivo error:', error);
        return { success: false, error: 'Falha ao alterar status' };
    }
}

export async function getCargosDisponiveis() {
    try {
        const { rows } = await pool.query<{ cargo: string }>(
            'SELECT DISTINCT cargo FROM colaboradores ORDER BY cargo'
        );
        return { success: true, data: rows.map(r => r.cargo) };
    } catch (error) {
        console.error('getCargosDisponiveis error:', error);
        return { success: false, error: 'Falha ao carregar cargos' };
    }
}
