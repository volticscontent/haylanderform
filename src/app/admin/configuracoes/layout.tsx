import { requirePermission } from '@/lib/require-permission';

export default async function ConfiguracoesLayout({ children }: { children: React.ReactNode }) {
    await requirePermission('/admin/configuracoes');
    return <>{children}</>;
}
