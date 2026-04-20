'use server';

import { revalidatePath } from 'next/cache';
import { backendGet, backendPost, backendPut, backendDelete } from '@/lib/backend-proxy';
import { uploadFileToR2, getFileFromR2, getPresignedUploadUrl } from '@/lib/r2';

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
    const res = await backendGet('/api/settings');
    return res.json();
  } catch {
    return { success: false, error: 'Failed to fetch settings' };
  }
}

export async function getSettingValue(key: string): Promise<string | null> {
  try {
    const res = await backendGet(`/api/settings/${encodeURIComponent(key)}`);
    const data = await res.json();
    return data?.value ?? null;
  } catch {
    return null;
  }
}

export async function updateSystemSetting(key: string, value: string) {
  try {
    const res = await backendPut(`/api/settings/${encodeURIComponent(key)}`, { value });
    revalidatePath('');
    return res.json();
  } catch {
    return { success: false, error: 'Failed to update setting' };
  }
}

export async function updateSettingBots(key: string, bots: string[]) {
  try {
    const res = await backendPut(`/api/settings/${encodeURIComponent(key)}/bots`, { bots });
    revalidatePath('');
    return res.json();
  } catch {
    return { success: false, error: 'Failed to update setting bots' };
  }
}

export async function createSystemSetting(data: { key: string; label: string; type: string; value?: string }) {
  try {
    const res = await backendPost('/api/settings', data);
    revalidatePath('');
    return res.json();
  } catch {
    return { success: false, error: 'Failed to create setting' };
  }
}

export async function deleteSystemSetting(key: string) {
  try {
    const res = await backendDelete(`/api/settings/${encodeURIComponent(key)}`);
    revalidatePath('');
    return res.json();
  } catch {
    return { success: false, error: 'Failed to delete setting' };
  }
}

export async function getUploadUrl(key: string, fileName: string, contentType: string) {
  try {
    const safeName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const r2FileName = `${key}_${Date.now()}_${safeName}`;
    const { uploadUrl, publicUrl } = await getPresignedUploadUrl(r2FileName, contentType);
    return { success: true, uploadUrl, publicUrl };
  } catch {
    return { success: false, error: 'Failed to get upload URL' };
  }
}

export async function uploadSystemSettingFile(formData: FormData) {
  const key = formData.get('key') as string;
  const file = formData.get('file') as File;
  if (!key || !file) return { success: false, error: 'Missing key or file' };
  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `${key}_${Date.now()}_${safeName}`;
    const url = await uploadFileToR2(buffer, fileName, file.type);
    await updateSystemSetting(key, url);
    return { success: true, url };
  } catch {
    return { success: false, error: 'Failed to upload file' };
  }
}

export async function getSettingFileContent(key: string) {
  try {
    const value = await getSettingValue(key);
    if (!value) return { success: false, error: 'Setting not found' };
    const content = await getFileFromR2(value);
    return { success: true, content };
  } catch {
    return { success: false, error: 'Failed to fetch file content' };
  }
}

export async function updateSettingFileContent(key: string, content: string, extension: string = 'txt') {
  try {
    const buffer = Buffer.from(content, 'utf-8');
    const fileName = `${key}_${Date.now()}.${extension}`;
    const mimeMap: Record<string, string> = { json: 'application/json', md: 'text/markdown', js: 'application/javascript', ts: 'application/typescript', csv: 'text/csv', html: 'text/html' };
    const url = await uploadFileToR2(buffer, fileName, mimeMap[extension] || 'text/plain');
    await updateSystemSetting(key, url);
    return { success: true, url };
  } catch {
    return { success: false, error: 'Failed to update file content' };
  }
}
