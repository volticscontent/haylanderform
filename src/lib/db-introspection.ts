import pool from './db'

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

const ALLOWED_TABLES = [
  'leads',
  'leads_empresarial',
  'leads_qualificacao',
  'leads_financeiro',
  'leads_vendas',
  'leads_atendimento',
  'interpreter_memories',
  'disparos'
]

export async function getDatabaseSchema(): Promise<TableSchema[]> {
  const query = `
    SELECT 
      table_name, 
      column_name, 
      data_type, 
      is_nullable, 
      column_default 
    FROM 
      information_schema.columns 
    WHERE 
      table_schema = 'public' 
    ORDER BY 
      table_name, 
      ordinal_position;
  `
  
  try {
    const result = await pool.query(query)
    
    // Group by table_name
    const tables: Record<string, ColumnInfo[]> = {}
    
    result.rows.forEach(row => {
      if (!tables[row.table_name]) {
        tables[row.table_name] = []
      }
      tables[row.table_name].push({
        column_name: row.column_name,
        data_type: row.data_type,
        is_nullable: row.is_nullable,
        column_default: row.column_default
      })
    })
    
    return Object.entries(tables)
      .filter(([name]) => ALLOWED_TABLES.includes(name))
      .map(([name, cols]) => ({
        table_name: name,
        columns: cols
      }))
    
  } catch (error) {
    console.error('Error fetching database schema:', error)
    return []
  }
}
