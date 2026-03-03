import { requirePermission } from '@/lib/require-permission';

export default async function AtendimentoLayout({ children }: { children: React.ReactNode }) {
    await requirePermission('/admin/atendimento');
    return <>{children}</>;
}
