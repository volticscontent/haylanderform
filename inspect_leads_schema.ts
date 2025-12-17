import dotenv from 'dotenv';
import { getDatabaseSchema } from './src/lib/db-introspection';

dotenv.config({ path: '.env.local' });

async function inspectLeads() {
  const schema = await getDatabaseSchema();
  const leadsTable = schema.find(t => t.table_name === 'leads');
  if (leadsTable) {
    console.log('Leads Columns:');
    leadsTable.columns.forEach(c => console.log(`- ${c.column_name}: ${c.data_type}`));
  } else {
    console.log('Leads table not found');
  }
}

inspectLeads().catch(console.error);
