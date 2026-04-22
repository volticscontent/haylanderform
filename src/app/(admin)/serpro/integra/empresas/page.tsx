import { listarEmpresas, listarLeadsParaImportar } from './actions';
import EmpresasClient from './EmpresasClient';

export const dynamic = 'force-dynamic';

export default async function EmpresasPage() {
  const [empresas, leadsDisponiveis] = await Promise.all([
    listarEmpresas(),
    listarLeadsParaImportar(),
  ]);
  return <EmpresasClient empresas={empresas} leadsDisponiveis={leadsDisponiveis} />;
}
