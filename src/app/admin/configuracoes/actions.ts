'use server';

import pool from "@/lib/db";
import { revalidatePath } from "next/cache";
import { uploadFileToR2, getFileFromR2, deleteFileFromR2 } from "@/lib/r2";

export type SystemSetting = {
    key: string;
    value: string;
    label: string;
    type: string;
    updated_at: Date;
    allowed_bots: string[] | null;
};

export async function getSystemSettings() {
    try {
        // Use DISTINCT ON to ensure unique keys, prioritizing entries with values and then most recent
        const { rows } = await pool.query<SystemSetting>(`
            SELECT DISTINCT ON (key) * 
            FROM system_settings 
            ORDER BY key, (value IS NOT NULL AND value <> '') DESC, updated_at DESC
        `);
        
        // Sort by label for display purposes (since DISTINCT ON requires ordering by key first)
        const sortedRows = rows.sort((a, b) => a.label.localeCompare(b.label));
        
        return { success: true, data: sortedRows };
    } catch (error) {
        console.error('Error fetching settings:', error);
        return { success: false, error: 'Failed to fetch settings' };
    }
}

export async function getSettingValue(key: string): Promise<string | null> {
    try {
        const { rows } = await pool.query<{ value: string }>('SELECT value FROM system_settings WHERE key = $1', [key]);
        return rows.length > 0 ? rows[0].value : null;
    } catch (error) {
        console.error(`Error fetching setting ${key}:`, error);
        return null;
    }
}

export async function updateSystemSetting(key: string, value: string) {
    try {
        await pool.query(
            'UPDATE system_settings SET value = $1, updated_at = NOW() WHERE key = $2',
            [value, key]
        );
        revalidatePath('/admin/configuracoes');
        return { success: true };
    } catch (error) {
        console.error('Error updating setting:', error);
        return { success: false, error: 'Failed to update setting' };
    }
}

export async function updateSettingBots(key: string, bots: string[]) {
    try {
        await pool.query(
            'UPDATE system_settings SET allowed_bots = $1, updated_at = NOW() WHERE key = $2',
            [bots, key]
        );
        revalidatePath('/admin/configuracoes');
        return { success: true };
    } catch (error) {
        console.error('Error updating setting bots:', error);
        return { success: false, error: 'Failed to update setting bots' };
    }
}

export async function uploadSystemSettingFile(formData: FormData) {
    const key = formData.get('key') as string;
    const file = formData.get('file') as File;

    if (!key || !file) {
        return { success: false, error: 'Missing key or file' };
    }

    try {
        const buffer = Buffer.from(await file.arrayBuffer());
        // Sanitize filename
        const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const fileName = `${key}_${Date.now()}_${safeName}`;
        
        const url = await uploadFileToR2(buffer, fileName, file.type);
        
        await updateSystemSetting(key, url);
        
        return { success: true, url };
    } catch (error) {
        console.error('Error uploading file:', error);
        return { success: false, error: 'Failed to upload file' };
    }
}

export async function createSystemSetting(data: { key: string; label: string; type: string; value?: string }) {
    try {
        await pool.query(
            `INSERT INTO system_settings (key, label, type, value, updated_at) 
             VALUES ($1, $2, $3, $4, NOW())
             ON CONFLICT (key) DO NOTHING`,
            [data.key, data.label, data.type, data.value || '']
        );
        revalidatePath('/admin/configuracoes');
        return { success: true };
    } catch (error) {
        console.error('Error creating setting:', error);
        return { success: false, error: 'Failed to create setting' };
    }
}

export async function deleteSystemSetting(key: string) {
    try {
        await pool.query('DELETE FROM system_settings WHERE key = $1', [key]);
        revalidatePath('/admin/configuracoes');
        return { success: true };
    } catch (error) {
        console.error('Error deleting setting:', error);
        return { success: false, error: 'Failed to delete setting' };
    }
}

export async function getSettingFileContent(key: string) {
    try {
        const value = await getSettingValue(key);
        if (!value) return { success: false, error: 'Setting not found' };
        
        const content = await getFileFromR2(value);
        return { success: true, content };
    } catch (error) {
        console.error('Error fetching file content:', error);
        return { success: false, error: 'Failed to fetch file content' };
    }
}

export async function updateSettingFileContent(key: string, content: string, extension: string = 'txt') {
    try {
        const buffer = Buffer.from(content, 'utf-8');
        const fileName = `${key}_${Date.now()}.${extension}`;
        
        let contentType = 'text/plain';
        if (extension === 'json') contentType = 'application/json';
        if (extension === 'md') contentType = 'text/markdown';
        if (extension === 'js') contentType = 'application/javascript';
        if (extension === 'ts') contentType = 'application/typescript';
        if (extension === 'csv') contentType = 'text/csv';
        if (extension === 'html') contentType = 'text/html';

        const url = await uploadFileToR2(buffer, fileName, contentType);
        await updateSystemSetting(key, url);
        
        return { success: true, url };
    } catch (error) {
        console.error('Error updating file content:', error);
        return { success: false, error: 'Failed to update file content' };
    }
}
