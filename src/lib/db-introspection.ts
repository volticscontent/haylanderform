import { backendGet } from './backend-proxy';

export interface ColumnInfo {
  column_name: string;
  data_type: string;
  is_nullable: string;
  column_default: string | null;
}

export interface TableSchema {
  table_name: string;
  columns: ColumnInfo[];
}

export async function getDatabaseSchema(): Promise<TableSchema[]> {
  try {
    const res = await backendGet('/api/db-schema');
    const data = await res.json();
    return data?.data ?? [];
  } catch {
    return [];
  }
}
