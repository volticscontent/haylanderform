'use server';

import pool from "@/lib/db";
import { revalidatePath } from "next/cache";
import { uploadFileToR2 } from "@/lib/r2";

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
