import { listarEmpresas } from './actions';
import EmpresasClient from './EmpresasClient';

export const dynamic = 'force-dynamic';

export default async function EmpresasPage() {
  const empresas = await listarEmpresas();
  return <EmpresasClient empresas={empresas} />;
}
