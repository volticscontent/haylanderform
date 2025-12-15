import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export interface TableSchema {
  table_name: string;
  columns: {
    column_name: string;
    data_type: string;
    is_nullable: string;
    column_default: string | null;
  }[];
}

export async function getDatabaseSchema(): Promise<TableSchema[]> {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      SELECT 
        table_name, 
        column_name, 
        data_type, 
        is_nullable,
        column_default
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND table_name IN ('haylander', 'mei_applications')
      ORDER BY table_name, ordinal_position;
    `);

    const tables: Record<string, TableSchema> = {};

    result.rows.forEach((row) => {
      if (!tables[row.table_name]) {
        tables[row.table_name] = {
          table_name: row.table_name,
          columns: [],
        };
      }
      tables[row.table_name].columns.push({
        column_name: row.column_name,
        data_type: row.data_type,
        is_nullable: row.is_nullable,
        column_default: row.column_default,
      });
    });

    return Object.values(tables);
  } finally {
    client.release();
  }
}
